async function fetchFromOpenLibrary(query, limit = 20) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library API HTTP ${res.status}`);
  const data = await res.json();
  if (!data.docs || !Array.isArray(data.docs)) return [];

  return data.docs.map(doc => ({
    id: doc.key ? doc.key.replace('/works/', 'ol-') : `ol-${Math.random().toString(36).substr(2, 9)}`,
    title: doc.title || 'Libro sin título',
    authors: Array.isArray(doc.author_name) ? doc.author_name : [],
    cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    published_year: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null,
  }));
}

async function run() {
  const results = await fetchFromOpenLibrary('Palabras Radiantes');
  console.log('RESULTS COUNT:', results.length);
  console.log('FIRST ITEM:', JSON.stringify(results[0], null, 2));
}

run();
