export interface GoogleBook {
  id: string; // Volume ID or OpenLibrary key
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

  // Try Google Books API first
  try {
    const books = await fetchFromGoogleBooks(cleanQuery, limit, lang);
    if (books && books.length > 0) {
      return books;
    }
  } catch (err) {
    console.warn('⚠️ Google Books API failed or quota exceeded. Falling back to Open Library API:', err);
  }

  // Fallback to Open Library API
  try {
    return await fetchFromOpenLibrary(cleanQuery, limit);
  } catch (err) {
    console.error('❌ Open Library API search failed as well:', err);
    return [];
  }
}

async function fetchFromGoogleBooks(query: string, limit: number, lang: string): Promise<GoogleBook[]> {
  const apiKey = import.meta.env.GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY || '';
  const langRestrict = lang === 'es' ? '&langRestrict=es' : '';

  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}${langRestrict}`;
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  let res = await fetch(url);

  // Fallback: If using API key returns 400/403/401, try without key
  if (!res.ok && apiKey) {
    const fallbackUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}${langRestrict}`;
    res = await fetch(fallbackUrl);
  }

  if (!res.ok) {
    throw new Error(`Google Books API HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: any) => {
    const volumeInfo = item.volumeInfo || {};

    let coverUrl: string | null = null;
    if (volumeInfo.imageLinks) {
      const rawCover = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || null;
      if (rawCover) {
        coverUrl = rawCover.replace('http://', 'https://').replace('&edge=curl', '');
      }
    }

    let publishedYear: number | null = null;
    if (volumeInfo.publishedDate) {
      const yearStr = volumeInfo.publishedDate.substring(0, 4);
      const parsed = parseInt(yearStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        publishedYear = parsed;
      }
    }

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

async function fetchFromOpenLibrary(query: string, limit: number): Promise<GoogleBook[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open Library API HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.docs || !Array.isArray(data.docs)) {
    return [];
  }

  return data.docs.map((doc: any) => {
    let coverUrl: string | null = null;
    if (doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    }

    const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null;

    return {
      id: doc.key ? doc.key.replace('/works/', 'ol-') : `ol-${Math.random().toString(36).substr(2, 9)}`,
      title: doc.title || 'Libro sin título',
      authors: Array.isArray(doc.author_name) ? doc.author_name : [],
      cover_url: coverUrl,
      published_year: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null,
      publisher: Array.isArray(doc.publisher) && doc.publisher.length > 0 ? doc.publisher[0] : null,
      page_count: typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : null,
      categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
      isbn,
      description: null,
    };
  });
}
