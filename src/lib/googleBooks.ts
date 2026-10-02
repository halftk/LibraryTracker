export interface GoogleBook {
  id: string; // Google Books Volume ID
  title: string;
  authors: string[];
  cover_url: string | null;
  published_year: number | null;
  publisher: string | null;
  page_count: number | null;
  categories: string[];
  isbn: string | null;
  description: string | null;
}

export async function searchGoogleBooks(
  query: string,
  limit: number = 20,
  lang: string = 'es'
): Promise<GoogleBook[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const apiKey = import.meta.env.GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY || '';
  const apiKeyParam = apiKey ? `&key=${apiKey}` : '';
  const langRestrict = lang === 'es' ? '&langRestrict=es' : '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=${limit}${langRestrict}${apiKeyParam}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books API HTTP error ${res.status}`);
  }

  const data = await res.json();
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: any) => {
    const volumeInfo = item.volumeInfo || {};

    // Get cover URL and upgrade http -> https, boost thumbnail quality if available
    let coverUrl: string | null = null;
    if (volumeInfo.imageLinks) {
      const rawCover = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || null;
      if (rawCover) {
        coverUrl = rawCover.replace('http://', 'https://').replace('&edge=curl', '');
      }
    }

    // Extract year from publishedDate ("YYYY-MM-DD" or "YYYY")
    let publishedYear: number | null = null;
    if (volumeInfo.publishedDate) {
      const yearStr = volumeInfo.publishedDate.substring(0, 4);
      const parsed = parseInt(yearStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        publishedYear = parsed;
      }
    }

    // Extract ISBN-13 or ISBN-10
    let isbn: string | null = null;
    if (Array.isArray(volumeInfo.industryIdentifiers)) {
      const isbn13 = volumeInfo.industryIdentifiers.find((i: any) => i.type === 'ISBN_13');
      const isbn10 = volumeInfo.industryIdentifiers.find((i: any) => i.type === 'ISBN_10');
      isbn = isbn13?.identifier || isbn10?.identifier || null;
    }

    return {
      id: item.id,
      title: volumeInfo.title || 'Libro sin título',
      authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
      cover_url: coverUrl,
      published_year: publishedYear,
      publisher: volumeInfo.publisher || null,
      page_count: typeof volumeInfo.pageCount === 'number' ? volumeInfo.pageCount : null,
      categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
      isbn,
      description: volumeInfo.description || null,
    };
  });
}
