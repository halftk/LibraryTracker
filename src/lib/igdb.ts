/**
 * IGDB API Client — Server-side only
 * Handles Twitch OAuth2 token acquisition and IGDB API requests.
 */

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  cover?: { url: string };
  first_release_date?: number;
  genres?: { name: string }[];
  involved_companies?: { company: { name: string }; developer: boolean }[];
  platforms?: { name: string; abbreviation?: string }[];
  summary?: string;
  external_games?: { category: number; uid: string }[];
}

export interface IGDBGameFormatted {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  developers: string[];
  platforms: string[];
  summary: string | null;
  steam_appid: number | null;
}

async function getTwitchToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = import.meta.env.TWITCH_CLIENT_ID;
  const clientSecret = import.meta.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitch OAuth failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TwitchTokenResponse;
  cachedToken = data.access_token;
  // Refresh 60 seconds before actual expiry
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

async function igdbRequest(endpoint: string, body: string): Promise<unknown> {
  const token = await getTwitchToken();
  const clientId = import.meta.env.TWITCH_CLIENT_ID;

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IGDB API error [${endpoint}]: ${response.status} — ${errorText}`);
  }

  return response.json();
}

function formatCoverUrl(url?: string): string | null {
  if (!url) return null;
  // IGDB returns URLs starting with // — make them https and upgrade to 720p
  return url.replace('//images.igdb.com/igdb/image/upload/t_thumb', 'https://images.igdb.com/igdb/image/upload/t_cover_big');
}

function formatGame(game: IGDBGame): IGDBGameFormatted {
  const steamEntry = game.external_games?.find((eg) => eg.category === 1);

  return {
    igdb_id: game.id,
    title: game.name,
    cover_url: formatCoverUrl(game.cover?.url),
    release_year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null,
    genres: game.genres?.map((g) => g.name) ?? [],
    developers:
      game.involved_companies
        ?.filter((ic) => ic.developer)
        .map((ic) => ic.company.name) ?? [],
    platforms: game.platforms?.map((p) => p.abbreviation ?? p.name) ?? [],
    summary: game.summary ?? null,
    steam_appid: steamEntry ? parseInt(steamEntry.uid, 10) : null,
  };
}

export async function searchGames(query: string, limit = 20): Promise<IGDBGameFormatted[]> {
  const body = `
    search "${query}";
    fields name, cover.url, first_release_date, genres.name,
           involved_companies.company.name, involved_companies.developer,
           platforms.name, platforms.abbreviation, summary,
           external_games.category, external_games.uid;
    where version_parent = null;
    limit ${limit};
  `;

  const results = (await igdbRequest('games', body)) as IGDBGame[];
  return results.map(formatGame);
}

export async function getGameById(id: number): Promise<IGDBGameFormatted | null> {
  const body = `
    fields name, cover.url, first_release_date, genres.name,
           involved_companies.company.name, involved_companies.developer,
           platforms.name, platforms.abbreviation, summary,
           external_games.category, external_games.uid;
    where id = ${id};
  `;

  const results = (await igdbRequest('games', body)) as IGDBGame[];
  return results.length > 0 ? formatGame(results[0]) : null;
}
