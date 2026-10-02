/**
 * Supabase Client & Database Service — Isomorphic (client + server)
 * Compatible with Supabase Publishable Keys (sb_publishable_...) & Legacy Anon Keys.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase env vars not configured properly.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface DBGame {
  id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  developers: string[];
  steam_appid: number | null;
}

export interface DBLibraryItem {
  id: string;
  user_id: string;
  game_id: number;
  platform: string;
  status: 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  notes: string | null;
  lent_to: string | null;
  created_at: string;
  updated_at: string;
  game?: DBGame;
}

/**
 * Inserta/actualiza la instantánea de los metadatos del juego en public.games
 */
export async function upsertGameSnapshot(game: DBGame) {
  const { data, error } = await supabase
    .from('games')
    .upsert({
      id: game.id,
      title: game.title,
      cover_url: game.cover_url,
      release_year: game.release_year,
      genres: game.genres,
      developers: game.developers,
      steam_appid: game.steam_appid,
    })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Obtiene la biblioteca de un usuario uniendo metadatos del juego
 */
export async function getLibraryItems(userId: string): Promise<DBLibraryItem[]> {
  const { data, error } = await supabase
    .from('library_items')
    .select(`
      *,
      game:games (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DBLibraryItem[];
}

/**
 * Añade un juego a la biblioteca del usuario en Supabase
 */
export async function addLibraryItemToDB(
  userId: string,
  game: DBGame,
  itemData: {
    platform: string;
    status: 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';
    start_date: string | null;
    finish_date: string | null;
    playtime_hours: number;
    rating: number | null;
    notes: string | null;
    lent_to: string | null;
  }
) {
  // 1. Guardar metadatos en tabla games
  try {
    await upsertGameSnapshot(game);
  } catch (err) {
    console.warn('⚠️ No se pudo guardar la instantánea del juego en public.games:', err);
  }

  // 2. Insertar en library_items
  const { data, error } = await supabase
    .from('library_items')
    .insert({
      user_id: userId,
      game_id: game.id,
      platform: itemData.platform,
      status: itemData.status,
      start_date: itemData.start_date,
      finish_date: itemData.finish_date,
      playtime_hours: itemData.playtime_hours,
      rating: itemData.rating,
      notes: itemData.notes,
      lent_to: itemData.lent_to,
    })
    .select(`
      *,
      game:games (*)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un item de la biblioteca
 */
export async function deleteLibraryItemFromDB(id: string) {
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Elimina todos los items de la biblioteca de un usuario
 */
export async function clearUserLibraryInDB(userId: string) {
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Actualiza los campos editables de un library_item existente
 */
export async function updateLibraryItemInDB(
  id: string,
  itemData: {
    game_id?: number;
    platform: string;
    status: 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';
    start_date: string | null;
    finish_date: string | null;
    playtime_hours: number;
    rating: number | null;
    notes: string | null;
    lent_to: string | null;
  },
  game?: DBGame
) {
  if (game) {
    try {
      await upsertGameSnapshot(game);
    } catch (err) {
      console.warn('⚠️ No se pudo guardar la instantánea del juego:', err);
    }
  }

  const payload: any = {
    ...itemData,
    updated_at: new Date().toISOString(),
  };
  if (game) {
    payload.game_id = game.id;
  }

  const { data, error } = await supabase
    .from('library_items')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      game:games (*)
    `)
    .single();

  if (error) throw error;
  return data;
}

// ── BOOKS & BOOK LIBRARY ITEMS HELPERS ─────────────────────────────────

export interface DBBook {
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

export interface DBBookLibraryItem {
  id: string;
  user_id: string;
  book_id: string;
  format: string; // 'Físico', 'Ebook', 'Audiolibro'
  status: 'Pendiente' | 'Leyendo' | 'Leído' | 'Abandonado' | 'Prestado';
  start_date: string | null;
  finish_date: string | null;
  current_page: number;
  total_pages: number;
  rating: number | null;
  notes: string | null;
  lent_to: string | null;
  created_at: string;
  updated_at: string;
  book?: DBBook;
}

export async function upsertBookSnapshot(book: DBBook) {
  const { data, error } = await supabase
    .from('books')
    .upsert({
      id: book.id,
      title: book.title,
      authors: book.authors,
      cover_url: book.cover_url,
      published_year: book.published_year,
      publisher: book.publisher,
      page_count: book.page_count,
      categories: book.categories,
      isbn: book.isbn,
      description: book.description,
    })
    .select();

  if (error) throw error;
  return data;
}

export async function getBookLibraryItems(userId: string): Promise<DBBookLibraryItem[]> {
  const { data, error } = await supabase
    .from('book_library_items')
    .select(`
      *,
      book:books (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DBBookLibraryItem[];
}

export async function addBookLibraryItemToDB(
  userId: string,
  book: DBBook,
  itemData: {
    format: string;
    status: 'Pendiente' | 'Leyendo' | 'Leído' | 'Abandonado' | 'Prestado';
    start_date: string | null;
    finish_date: string | null;
    current_page: number;
    total_pages: number;
    rating: number | null;
    notes: string | null;
    lent_to: string | null;
  }
) {
  try {
    await upsertBookSnapshot(book);
  } catch (err) {
    console.warn('⚠️ No se pudo guardar la instantánea del libro en public.books:', err);
  }

  const { data, error } = await supabase
    .from('book_library_items')
    .insert({
      user_id: userId,
      book_id: book.id,
      format: itemData.format,
      status: itemData.status,
      start_date: itemData.start_date,
      finish_date: itemData.finish_date,
      current_page: itemData.current_page,
      total_pages: itemData.total_pages,
      rating: itemData.rating,
      notes: itemData.notes,
      lent_to: itemData.lent_to,
    })
    .select(`
      *,
      book:books (*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookLibraryItemInDB(
  id: string,
  itemData: {
    book_id?: string;
    format: string;
    status: 'Pendiente' | 'Leyendo' | 'Leído' | 'Abandonado' | 'Prestado';
    start_date: string | null;
    finish_date: string | null;
    current_page: number;
    total_pages: number;
    rating: number | null;
    notes: string | null;
    lent_to: string | null;
  },
  book?: DBBook
) {
  if (book) {
    try {
      await upsertBookSnapshot(book);
    } catch (err) {
      console.warn('⚠️ No se pudo guardar la instantánea del libro:', err);
    }
  }

  const payload: any = {
    ...itemData,
    updated_at: new Date().toISOString(),
  };
  if (book) {
    payload.book_id = book.id;
  }

  const { data, error } = await supabase
    .from('book_library_items')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      book:books (*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookLibraryItemFromDB(id: string) {
  const { error } = await supabase
    .from('book_library_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function clearUserBookLibraryInDB(userId: string) {
  const { error } = await supabase
    .from('book_library_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

