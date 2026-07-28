import type { APIRoute } from 'astro';
import { searchGames } from '../../../lib/igdb';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q');
  const lang = (url.searchParams.get('lang') as 'es' | 'en') || 'es';

  if (!query || query.trim().length < 2) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required (min 2 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;
    const results = await searchGames(query.trim(), limit, lang);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('IGDB search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search IGDB' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
