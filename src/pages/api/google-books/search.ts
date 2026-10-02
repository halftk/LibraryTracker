import type { APIRoute } from 'astro';
import { searchGoogleBooks } from '../../../lib/googleBooks';

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
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 40) : 20;
    const results = await searchGoogleBooks(query.trim(), limit, lang);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Google Books search API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search Google Books' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
