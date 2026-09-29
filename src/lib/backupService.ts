/**
 * Backup & Restore Service — Core engine for LibraryTracker
 * Handles JSON Backup creation with SHA-256 integrity checksum,
 * backup structure validation, diff calculation, and restoration logic.
 */

import type { DBLibraryItem, DBGame } from './supabase';
import { supabase, upsertGameSnapshot, clearUserLibraryInDB } from './supabase';

export interface BackupPayload {
  version: 1;
  app: 'LibraryTracker';
  exported_at: string;
  item_count: number;
  user_id?: string;
  items: BackupItem[];
  checksum: string;
}

export interface BackupItem {
  game_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  developers: string[];
  steam_appid: number | null;
  platform: string;
  status: 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  notes: string | null;
  lent_to: string | null;
}

export interface DiffSummary {
  totalBackupItems: number;
  toAdd: BackupItem[];
  toUpdate: { backupItem: BackupItem; existingId: string }[];
  unchangedCount: number;
}

/**
 * Genera un Hash SHA-256 en formato Hexadecimal usando Web Crypto API
 */
export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Crea un objeto BackupPayload completo con su checksum SHA-256
 */
export async function createBackupPayload(
  userId: string | undefined,
  libraryItems: DBLibraryItem[]
): Promise<BackupPayload> {
  const items: BackupItem[] = libraryItems.map((item) => ({
    game_id: item.game_id,
    title: item.game?.title || 'Juego desconocido',
    cover_url: item.game?.cover_url || null,
    release_year: item.game?.release_year || null,
    genres: item.game?.genres || [],
    developers: item.game?.developers || [],
    steam_appid: item.game?.steam_appid || null,
    platform: item.platform || 'PC',
    status: item.status || 'Pendiente',
    start_date: item.start_date || null,
    finish_date: item.finish_date || null,
    playtime_hours: item.playtime_hours || 0,
    rating: item.rating ?? null,
    notes: item.notes || null,
    lent_to: item.lent_to || null,
  }));

  const serializedContent = JSON.stringify(items);
  const checksum = await computeSHA256(serializedContent);

  return {
    version: 1,
    app: 'LibraryTracker',
    exported_at: new Date().toISOString(),
    item_count: items.length,
    user_id: userId,
    items,
    checksum,
  };
}

/**
 * Valida la estructura e integridad (SHA-256) de un objeto JSON cargado
 */
export async function validateBackupPayload(
  payload: any
): Promise<{ valid: boolean; error?: string; payload?: BackupPayload }> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'El archivo no es un objeto JSON válido.' };
  }

  if (payload.app !== 'LibraryTracker' && !Array.isArray(payload)) {
    return { valid: false, error: 'El formato del archivo no corresponde a LibraryTracker.' };
  }

  // Compatibilidad con formato array raw legacy o formato BackupPayload estructurado
  let items: BackupItem[] = [];
  let checksum: string | undefined = payload.checksum;

  if (Array.isArray(payload)) {
    items = payload;
  } else if (Array.isArray(payload.items)) {
    items = payload.items;
  } else {
    return { valid: false, error: 'No se encontraron juegos válidos en el archivo de copia.' };
  }

  // Validar campos mínimos de cada item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.title || !item.game_id) {
      return { valid: false, error: `El registro #${i + 1} no tiene título o ID de juego válido.` };
    }
  }

  // Si tiene checksum, verificarlo
  if (checksum) {
    const serializedContent = JSON.stringify(items);
    const calculated = await computeSHA256(serializedContent);
    if (calculated !== checksum) {
      return {
        valid: false,
        error: 'Error de integridad: El checksum SHA-256 no coincide (el archivo puede estar alterado o corrupto).',
      };
    }
  }

  const cleanPayload: BackupPayload = {
    version: 1,
    app: 'LibraryTracker',
    exported_at: payload.exported_at || new Date().toISOString(),
    item_count: items.length,
    user_id: payload.user_id,
    items,
    checksum: checksum || (await computeSHA256(JSON.stringify(items))),
  };

  return { valid: true, payload: cleanPayload };
}

/**
 * Calcula la diferencia entre la biblioteca actual y los elementos del backup
 */
export function calculateBackupDiff(
  currentItems: DBLibraryItem[],
  backupItems: BackupItem[]
): DiffSummary {
  const currentMap = new Map<string, DBLibraryItem>();
  for (const item of currentItems) {
    const key = `${item.game_id}_${item.platform.toLowerCase()}`;
    currentMap.set(key, item);
  }

  const toAdd: BackupItem[] = [];
  const toUpdate: { backupItem: BackupItem; existingId: string }[] = [];
  let unchangedCount = 0;

  for (const bItem of backupItems) {
    const key = `${bItem.game_id}_${bItem.platform.toLowerCase()}`;
    const existing = currentMap.get(key);

    if (!existing) {
      toAdd.push(bItem);
    } else {
      // Verificar si hay diferencias relevantes
      const hasChanges =
        existing.status !== bItem.status ||
        existing.rating !== bItem.rating ||
        existing.playtime_hours !== bItem.playtime_hours ||
        existing.notes !== bItem.notes ||
        existing.start_date !== bItem.start_date ||
        existing.finish_date !== bItem.finish_date ||
        existing.lent_to !== bItem.lent_to;

      if (hasChanges) {
        toUpdate.push({ backupItem: bItem, existingId: existing.id });
      } else {
        unchangedCount++;
      }
    }
  }

  return {
    totalBackupItems: backupItems.length,
    toAdd,
    toUpdate,
    unchangedCount,
  };
}

/**
 * Ejecuta el proceso de restauración en Supabase
 */
export async function executeRestore(
  userId: string,
  backupItems: BackupItem[],
  mode: 'merge' | 'overwrite',
  diff?: DiffSummary
): Promise<{ added: number; updated: number; cleared: boolean }> {
  let added = 0;
  let updated = 0;
  let cleared = false;

  if (mode === 'overwrite') {
    await clearUserLibraryInDB(userId);
    cleared = true;
  }

  // Insertar/actualizar metadatos de juegos en public.games
  const uniqueGamesMap = new Map<number, DBGame>();
  for (const item of backupItems) {
    if (!uniqueGamesMap.has(item.game_id)) {
      uniqueGamesMap.set(item.game_id, {
        id: item.game_id,
        title: item.title,
        cover_url: item.cover_url,
        release_year: item.release_year,
        genres: item.genres || [],
        developers: item.developers || [],
        steam_appid: item.steam_appid || null,
      });
    }
  }

  for (const game of uniqueGamesMap.values()) {
    try {
      await upsertGameSnapshot(game);
    } catch (e) {
      console.warn(`No se pudo guardar la instantánea del juego ${game.id}:`, e);
    }
  }

  if (mode === 'overwrite') {
    // Insertar todos en bloque
    const inserts = backupItems.map((item) => ({
      user_id: userId,
      game_id: item.game_id,
      platform: item.platform,
      status: item.status,
      start_date: item.start_date,
      finish_date: item.finish_date,
      playtime_hours: item.playtime_hours,
      rating: item.rating,
      notes: item.notes,
      lent_to: item.lent_to,
    }));

    // Enviar en chunks de 50 para evitar sobrepasar límites
    const CHUNK_SIZE = 50;
    for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
      const chunk = inserts.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('library_items').insert(chunk);
      if (error) throw error;
    }
    added = inserts.length;
  } else {
    // Modo Merge: Usar el diff calculado o calcularlo en caliente
    const current = await supabase.from('library_items').select('*').eq('user_id', userId);
    const existingItems = (current.data || []) as DBLibraryItem[];
    const calculatedDiff = diff || calculateBackupDiff(existingItems, backupItems);

    // 1. Añadir nuevos
    if (calculatedDiff.toAdd.length > 0) {
      const inserts = calculatedDiff.toAdd.map((item) => ({
        user_id: userId,
        game_id: item.game_id,
        platform: item.platform,
        status: item.status,
        start_date: item.start_date,
        finish_date: item.finish_date,
        playtime_hours: item.playtime_hours,
        rating: item.rating,
        notes: item.notes,
        lent_to: item.lent_to,
      }));

      const CHUNK_SIZE = 50;
      for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
        const chunk = inserts.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('library_items').insert(chunk);
        if (error) throw error;
      }
      added = inserts.length;
    }

    // 2. Actualizar existentes cambiados
    for (const updateTarget of calculatedDiff.toUpdate) {
      const item = updateTarget.backupItem;
      const { error } = await supabase
        .from('library_items')
        .update({
          status: item.status,
          start_date: item.start_date,
          finish_date: item.finish_date,
          playtime_hours: item.playtime_hours,
          rating: item.rating,
          notes: item.notes,
          lent_to: item.lent_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updateTarget.existingId);

      if (error) throw error;
      updated++;
    }
  }

  return { added, updated, cleared };
}
