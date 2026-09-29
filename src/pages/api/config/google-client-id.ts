import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.PUBLIC_GOOGLE_CLIENT_ID ||
    import.meta.env.GOOGLE_CLIENT_ID ||
    import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
    '';

  return new Response(JSON.stringify({ clientId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
