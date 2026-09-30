<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-game-preview">
              <img
                v-if="currentGame.cover_url"
                :src="currentGame.cover_url"
                :alt="currentGame.title"
                class="modal-cover"
              />
              <div v-else class="modal-cover-placeholder">🎮</div>
              <div class="modal-game-info">
                <div class="modal-top-tags">
                  <span v-if="isEditMode" class="edit-badge">✏️ EDITAR ENTRADA</span>
                  <span class="game-id-tag">IGDB ID: {{ currentGame.igdb_id }}</span>
                </div>
                <!-- Prominent Game Title -->
                <h2 class="modal-title" :title="currentGame.title">{{ currentGame.title }}</h2>
                <p class="modal-meta">
                  <span v-if="currentGame.release_year">{{ currentGame.release_year }}</span>
                  <span v-if="currentGame.developers && currentGame.developers.length"> · {{ currentGame.developers.join(', ') }}</span>
                </p>
                <div v-if="currentGame.genres && currentGame.genres.length" class="modal-genres">
                  <span v-for="genre in currentGame.genres" :key="genre" class="genre-tag">{{ genre }}</span>
                </div>
                <button
                  type="button"
                  class="btn-toggle-change-game"
                  @click="showSearchPanel = !showSearchPanel"
                >
                  🔄 {{ showSearchPanel ? 'Ocultar buscador' : 'Cambiar juego / Buscar en IGDB' }}
                </button>
              </div>
            </div>
            <button class="modal-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Inline Search Panel to Change Game -->
          <div v-if="showSearchPanel" class="change-game-panel">
            <div class="panel-header">
              <strong>🔍 Buscar y vincular otro juego desde IGDB</strong>
              <p class="panel-sub">Si la coincidencia automática fue incorrecta, busca aquí el título exacto para corregirlo.</p>
            </div>
            <div class="search-input-row">
              <input
                v-model="searchQuery"
                type="text"
                class="input-field search-input"
                placeholder="Escribe el nombre del juego (ej: Hades II)..."
                @keyup.enter="performSearch"
              />
              <button type="button" class="btn-search-action" @click="performSearch" :disabled="searching">
                {{ searching ? 'Buscando...' : '🔍 Buscar' }}
              </button>
            </div>

            <div v-if="searchResults.length > 0" class="search-results-list">
              <div
                v-for="res in searchResults"
                :key="res.igdb_id"
                class="search-result-card"
                :class="{ active: currentGame.igdb_id === res.igdb_id }"
                @click="selectGame(res)"
              >
                <img v-if="res.cover_url" :src="res.cover_url" class="result-cover" />
                <div v-else class="result-cover-placeholder">🎮</div>
                <div class="result-info">
                  <span class="result-title">{{ res.title }}</span>
                  <span class="result-meta">
                    {{ res.release_year || 'Año desconocido' }}
                    <template v-if="res.developers && res.developers.length"> · {{ res.developers.join(', ') }}</template>
                  </span>
                </div>
                <button type="button" class="btn-select-chip">
                  {{ currentGame.igdb_id === res.igdb_id ? '✓ Vinculado' : 'Seleccionar' }}
                </button>
              </div>
            </div>
            <div v-else-if="searchDone && !searching" class="no-results-msg">
              No se encontraron coincidencias para "{{ searchQuery }}".
            </div>
          </div>

          <!-- Notice for replaying / multiple runs -->
          <div v-if="!isEditMode && existingRunsCount > 0" class="existing-runs-notice">
            <span class="notice-icon">💡</span>
            <span><strong>Rejugada / Nueva partida:</strong> Ya tienes {{ existingRunsCount }} partida(s) de este juego en tu biblioteca. Se añadirá como una nueva entrada independiente.</span>
          </div>

          <!-- Form -->
          <form class="modal-form" @submit.prevent="handleSubmit">
            <!-- Platform -->
            <div class="form-group">
              <label class="form-label">Plataforma <span class="required">*</span></label>
              <select v-model="form.platform" class="input-field" required>
                <option value="" disabled>Seleccionar plataforma...</option>
                <option v-for="p in availablePlatforms" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label">Estado <span class="required">*</span></label>
              <div class="status-grid">
                <button
                  v-for="s in statuses"
                  :key="s.value"
                  type="button"
                  :class="['status-btn', `status-${s.css}`, { active: form.status === s.value }]"
                  @click="form.status = s.value"
                >
                  <span>{{ s.icon }}</span>
                  <span>{{ s.label }}</span>
                </button>
              </div>
            </div>

            <!-- Dates row -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Fecha de inicio</label>
                <input v-model="form.startDate" type="date" class="input-field" />
              </div>
              <div class="form-group">
                <label class="form-label">
                  Fecha de fin
                  <span v-if="form.status === 'Jugado'" class="required">*</span>
                </label>
                <input
                  v-model="form.finishDate"
                  type="date"
                  class="input-field"
                  :required="form.status === 'Jugado'"
                />
              </div>
            </div>

            <!-- Playtime -->
            <div class="form-group">
              <label class="form-label">Horas jugadas</label>
              <input
                v-model.number="form.playtimeHours"
                type="number"
                class="input-field"
                min="0"
                step="0.5"
                placeholder="0"
              />
            </div>

            <!-- Rating -->
            <div class="form-group">
              <label class="form-label">
                Puntuación
                <span v-if="form.status === 'Jugado'" class="required">*</span>
              </label>
              <div class="star-rating">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  :class="['star', { filled: star <= (hoverRating || form.rating) }]"
                  :title="`${star} - ${getRatingLabel(star)}`"
                  @mouseenter="hoverRating = star"
                  @mouseleave="hoverRating = 0"
                  @click="form.rating = star === form.rating ? 0 : star"
                >
                  ★
                </button>
                <span class="rating-value">
                  {{ (hoverRating || form.rating) > 0 ? `${hoverRating || form.rating}/5 — ${getRatingLabel(hoverRating || form.rating)}` : '' }}
                </span>
              </div>
            </div>

            <!-- Lent to (only if Prestado) -->
            <Transition name="slide">
              <div v-if="form.status === 'Prestado'" class="form-group">
                <label class="form-label">Prestado a <span class="required">*</span></label>
                <input
                  v-model="form.lentTo"
                  type="text"
                  class="input-field"
                  placeholder="Nombre de la persona..."
                  required
                />
              </div>
            </Transition>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label">Notas / Reseña</label>
              <textarea
                v-model="form.notes"
                class="input-field textarea"
                rows="3"
                placeholder="Escribe una nota o impresión sobre el juego..."
              ></textarea>
            </div>

            <!-- Otras partidas registradas del mismo juego -->
            <div v-if="otherRuns.length > (isEditMode ? 1 : 0)" class="form-group other-runs-container">
              <label class="form-label">
                🔁 Otras partidas registradas ({{ otherRuns.length }})
              </label>
              <div class="other-runs-list">
                <div
                  v-for="run in otherRuns"
                  :key="run.id"
                  :class="['other-run-card', { 'current-run': run.isCurrent }]"
                >
                  <div class="run-card-header">
                    <div class="run-card-badges">
                      <span class="run-badge-tag">{{ run.runLabel }}</span>
                      <span class="platform-badge-tag">{{ run.platform }}</span>
                      <span :class="['status-badge-tag', `status-${statusCss(run.status)}`]">
                        {{ statusIcon(run.status) }} {{ run.status }}
                      </span>
                    </div>
                    <span v-if="run.isCurrent" class="current-badge-tag">📍 Editando ahora</span>
                  </div>

                  <div class="run-card-body">
                    <div class="run-meta-row">
                      <span v-if="run.finish_date" class="run-meta-item" title="Fecha de compleción">
                        🏁 {{ formatDateShort(run.finish_date) }}
                      </span>
                      <span v-else-if="run.start_date" class="run-meta-item">
                        ▶️ {{ formatDateShort(run.start_date) }}
                      </span>
                      <span v-if="run.rating" class="run-meta-item rating-text">
                        ⭐ {{ run.rating }}/5
                      </span>
                      <span v-if="run.playtime_hours" class="run-meta-item">
                        ⏱️ {{ run.playtime_hours }}h
                      </span>
                    </div>
                    <p v-if="run.notes" class="run-notes-preview">
                      💬 "{{ run.notes }}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation error -->
            <div v-if="validationError" class="validation-error">
              ⚠️ {{ validationError }}
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="$emit('close')">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Añadir a Biblioteca') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { supabase, addLibraryItemToDB, updateLibraryItemInDB } from '../lib/supabase';
import { triggerAutoDriveBackupIfEnabled } from '../lib/googleDrive';
import type { User } from '@supabase/supabase-js';

interface IGDBGame {
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

type GameStatus = 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';

interface ExistingItem {
  id: string;
  platform: string;
  status: GameStatus;
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  notes: string | null;
  lent_to: string | null;
}

const props = defineProps<{ game: IGDBGame; existingItem?: ExistingItem | null }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'added', item: unknown): void;
  (e: 'updated', item: unknown): void;
}>();

const isEditMode = computed(() => !!props.existingItem);

// Editable copy of current linked game
const currentGame = ref<IGDBGame>({ ...props.game });

watch(() => props.game, (newGame) => {
  if (newGame) {
    currentGame.value = { ...newGame };
    searchQuery.value = newGame.title || '';
  }
}, { immediate: true });

// Search panel to change linked game
const showSearchPanel = ref(false);
const searchQuery = ref(props.game.title || '');
const searching = ref(false);
const searchDone = ref(false);
const searchResults = ref<IGDBGame[]>([]);

async function performSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  searchDone.value = false;
  try {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'es';
    const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(q)}&limit=10&lang=${lang}`);
    if (res.ok) {
      searchResults.value = await res.json();
    }
  } catch (err) {
    console.error('Error searching game:', err);
  } finally {
    searching.value = false;
    searchDone.value = true;
  }
}

function selectGame(g: IGDBGame) {
  currentGame.value = { ...g };
  showSearchPanel.value = false;
}

const statuses = [
  { value: 'Pendiente' as GameStatus, label: 'Pendiente', icon: '⏳', css: 'pendiente' },
  { value: 'En curso' as GameStatus, label: 'En curso', icon: '🎮', css: 'en-curso' },
  { value: 'Jugado' as GameStatus, label: 'Jugado', icon: '✅', css: 'jugado' },
  { value: 'Abandonado' as GameStatus, label: 'Abandonado', icon: '❌', css: 'abandonado' },
  { value: 'Prestado' as GameStatus, label: 'Prestado', icon: '🤝', css: 'prestado' },
];

const defaultPlatforms = ['PC', 'PS5', 'PS4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'Switch 2', 'Steam Deck', 'Mobile', 'Otro'];

const availablePlatforms = computed(() => {
  const igdbPlatforms = currentGame.value.platforms || [];
  const all = [...new Set([...igdbPlatforms, ...defaultPlatforms])];
  return all;
});

const hoverRating = ref(0);

function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Infumable',
    2: 'Meh',
    3: 'Buen juego',
    4: 'Notable',
    5: 'Excelente',
  };
  return labels[rating] || '';
}

const form = ref({
  platform: '',
  status: 'Pendiente' as GameStatus,
  startDate: '',
  finishDate: '',
  playtimeHours: 0,
  rating: 0,
  lentTo: '',
  notes: '',
});

interface OtherRunItem {
  id: string;
  platform: string;
  status: string;
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  notes: string | null;
  created_at?: string;
  runLabel?: string;
  isCurrent?: boolean;
}

const saving = ref(false);
const validationError = ref('');
const currentUser = ref<User | null>(null);
const existingRunsCount = ref(0);
const otherRuns = ref<OtherRunItem[]>([]);

function getItemTimestamp(run: { finish_date?: string | null; start_date?: string | null; created_at?: string }): number {
  if (run.finish_date) {
    const t = new Date(run.finish_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (run.start_date) {
    const t = new Date(run.start_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (run.created_at) {
    const t = new Date(run.created_at).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

function statusCss(status: string): string {
  const map: Record<string, string> = {
    'Pendiente': 'pendiente',
    'En curso': 'en-curso',
    'Jugado': 'jugado',
    'Abandonado': 'abandonado',
    'Prestado': 'prestado',
  };
  return map[status] || 'pendiente';
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    'Pendiente': '⏳',
    'En curso': '🎮',
    'Jugado': '✅',
    'Abandonado': '❌',
    'Prestado': '🤝',
  };
  return map[status] || '';
}

function formatDateShort(str?: string | null): string {
  if (!str) return '';
  try {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  } catch {
    return str;
  }
}

async function fetchOtherRuns() {
  if (!currentGame.value?.igdb_id) {
    otherRuns.value = [];
    existingRunsCount.value = 0;
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    let rawItems: any[] = [];

    if (user) {
      const { data } = await supabase
        .from('library_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', currentGame.value.igdb_id);
      rawItems = data || [];
    } else {
      const local = JSON.parse(localStorage.getItem('libraryItems') || '[]');
      rawItems = local.filter((i: any) => i.game?.igdb_id === currentGame.value.igdb_id || i.game_id === currentGame.value.igdb_id);
    }

    rawItems.sort((a, b) => {
      const timeA = getItemTimestamp(a);
      const timeB = getItemTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdA - createdB;
    });

    otherRuns.value = rawItems.map((r, index) => ({
      id: r.id,
      platform: r.platform,
      status: r.status,
      start_date: r.start_date,
      finish_date: r.finish_date,
      playtime_hours: r.playtime_hours || 0,
      rating: r.rating,
      notes: r.notes,
      created_at: r.created_at,
      runLabel: `${index + 1}ª Partida`,
      isCurrent: props.existingItem?.id === r.id,
    }));

    existingRunsCount.value = rawItems.length;
  } catch (err) {
    console.error('Error fetching other runs:', err);
    otherRuns.value = [];
    existingRunsCount.value = 0;
  }
}

watch(() => props.existingItem, (e) => {
  if (e) {
    form.value.platform = e.platform || '';
    form.value.status = (e.status as GameStatus) || 'Pendiente';
    form.value.startDate = e.start_date || '';
    form.value.finishDate = e.finish_date || '';
    form.value.playtimeHours = e.playtime_hours || 0;
    form.value.rating = e.rating || 0;
    form.value.lentTo = e.lent_to || '';
    form.value.notes = e.notes || '';
  }
}, { immediate: true });

watch(currentGame, () => {
  fetchOtherRuns().catch(console.error);
}, { immediate: true });

onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser();
    currentUser.value = data.user;
  } catch (err) {
    console.error('Error getting user:', err);
  }
  fetchOtherRuns().catch(console.error);
});

// Clear validation on form changes
watch(form, () => {
  validationError.value = '';
}, { deep: true });

function validate(): boolean {
  if (!form.value.platform) {
    validationError.value = 'Debes seleccionar una plataforma.';
    return false;
  }

  if (form.value.status === 'Jugado') {
    if (!form.value.finishDate) {
      validationError.value = 'Para marcar como "Jugado", debes indicar la fecha de fin.';
      return false;
    }
    if (form.value.rating === 0) {
      validationError.value = 'Para marcar como "Jugado", debes asignar una puntuación.';
      return false;
    }
  }

  if (form.value.status === 'Prestado' && !form.value.lentTo.trim()) {
    validationError.value = 'Para marcar como "Prestado", debes indicar a quién se lo prestaste.';
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  saving.value = true;

  const itemData = {
    platform: form.value.platform,
    status: form.value.status,
    start_date: form.value.startDate || null,
    finish_date: form.value.finishDate || null,
    playtime_hours: form.value.playtimeHours || 0,
    rating: form.value.rating || null,
    lent_to: form.value.lentTo || null,
    notes: form.value.notes || null,
  };

  const gameSnapshot = {
    id: currentGame.value.igdb_id,
    title: currentGame.value.title,
    cover_url: currentGame.value.cover_url,
    release_year: currentGame.value.release_year,
    genres: currentGame.value.genres || [],
    developers: currentGame.value.developers || [],
    steam_appid: currentGame.value.steam_appid || null,
  };

  try {
    if (isEditMode.value && props.existingItem) {
      // Modo edición: actualizar en Supabase (y actualizar game_id si cambió de juego)
      const updated = await updateLibraryItemInDB(props.existingItem.id, itemData, gameSnapshot);
      triggerAutoDriveBackupIfEnabled().catch(() => {});
      emit('updated', updated);
    } else if (currentUser.value) {
      // Modo añadir con sesión: guardar en Supabase
      const saved = await addLibraryItemToDB(currentUser.value.id, gameSnapshot, itemData);
      triggerAutoDriveBackupIfEnabled().catch(() => {});
      emit('added', saved);
    } else {
      // Sin sesión: localStorage fallback
      const localItem = {
        ...itemData,
        id: props.existingItem ? props.existingItem.id : crypto.randomUUID(),
        game: { ...gameSnapshot, igdb_id: gameSnapshot.id },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('libraryItems') || '[]');
      if (props.existingItem) {
        const idx = existing.findIndex((i: any) => i.id === props.existingItem!.id);
        if (idx !== -1) existing[idx] = localItem;
        else existing.push(localItem);
      } else {
        existing.push(localItem);
      }
      localStorage.setItem('libraryItems', JSON.stringify(existing));
      emit(isEditMode.value ? 'updated' : 'added', localItem);
    }
  } catch (err: any) {
    console.error('Error saving:', err);
    if (err?.message?.includes('unique') || err?.code === '23505') {
      validationError.value = `⚠️ Tu base de datos de Supabase tiene una restricción de juego único. Para permitir múltiples partidas del mismo juego en Supabase, ejecuta en tu Editor SQL: ALTER TABLE library_items DROP CONSTRAINT IF EXISTS unique_user_game_platform;`;
    } else {
      validationError.value = err?.message || 'Error al guardar. Intenta de nuevo.';
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-container {
  background: var(--color-bg-secondary, #161b22);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 18px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  animation: scale-in 0.3s ease-out;
  color: var(--color-text-primary, #f0f6fc);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border, #30363d);
}

.modal-game-preview {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.modal-cover {
  width: 72px;
  height: 96px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.modal-cover-placeholder {
  width: 72px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card, #21262d);
  border-radius: 10px;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.modal-game-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-top-tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-badge {
  background: rgba(124, 58, 237, 0.25);
  border: 1px solid rgba(124, 58, 237, 0.5);
  color: #c4b5fd;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.game-id-tag {
  font-size: 0.65rem;
  color: #8b949e;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0.1rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #8b949e);
  margin: 0;
}

.modal-genres {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.genre-tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 9999px;
  color: var(--color-text-secondary, #8b949e);
}

.btn-toggle-change-game {
  align-self: flex-start;
  margin-top: 0.4rem;
  background: rgba(56, 139, 253, 0.1);
  border: 1px solid rgba(56, 139, 253, 0.3);
  color: #58a6ff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toggle-change-game:hover {
  background: rgba(56, 139, 253, 0.2);
  border-color: #58a6ff;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted, #8b949e);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #ffffff;
}

/* Inline Game Change Panel */
.change-game-panel {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--color-border, #30363d);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: fade-in 0.2s ease;
}

.panel-header strong {
  font-size: 0.875rem;
  color: #58a6ff;
  display: block;
}

.panel-sub {
  font-size: 0.75rem;
  color: #8b949e;
  margin: 0.15rem 0 0 0;
}

.search-input-row {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
}

.btn-search-action {
  background: #1a73e8;
  color: #fff;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-search-action:hover {
  background: #1557b0;
}

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.search-result-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-card:hover, .search-result-card.active {
  border-color: #58a6ff;
  background: rgba(56, 139, 253, 0.08);
}

.result-cover {
  width: 28px;
  height: 38px;
  object-fit: cover;
  border-radius: 4px;
}

.result-cover-placeholder {
  width: 28px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #21262d;
  border-radius: 4px;
  font-size: 0.9rem;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f0f6fc;
}

.result-meta {
  font-size: 0.725rem;
  color: #8b949e;
}

.btn-select-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #30363d;
  color: #f0f6fc;
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}

.search-result-card.active .btn-select-chip {
  background: #238636;
  border-color: #238636;
  color: #fff;
}

.no-results-msg {
  font-size: 0.8rem;
  color: #f85149;
  font-style: italic;
}

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary, #8b949e);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.required {
  color: var(--color-accent-rose, #f85149);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.status-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: var(--color-bg-card, #21262d);
  border: 2px solid var(--color-border, #30363d);
  border-radius: 10px;
  color: var(--color-text-secondary, #8b949e);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.status-btn:hover {
  border-color: var(--color-text-muted);
}

.status-btn.active.status-pendiente { border-color: var(--color-accent-amber); color: var(--color-accent-amber); background: rgba(245, 158, 11, 0.1); }
.status-btn.active.status-en-curso { border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); background: rgba(6, 182, 212, 0.1); }
.status-btn.active.status-jugado { border-color: var(--color-accent-emerald); color: var(--color-accent-emerald); background: rgba(16, 185, 129, 0.1); }
.status-btn.active.status-abandonado { border-color: var(--color-accent-rose); color: var(--color-accent-rose); background: rgba(244, 63, 94, 0.1); }
.status-btn.active.status-prestado { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); background: rgba(124, 58, 237, 0.1); }

.star-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rating-value {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.validation-error {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: var(--color-accent-rose, #ff7b72);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #30363d);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 100px;
}

select.input-field {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

select.input-field option {
  background: var(--color-bg-secondary, #161b22);
  color: var(--color-text-primary, #f0f6fc);
}

input[type="date"].input-field {
  color-scheme: dark;
}

.existing-runs-notice {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: rgba(6, 182, 212, 0.1);
  border-bottom: 1px solid rgba(6, 182, 212, 0.25);
  color: var(--color-accent-cyan, #38bdf8);
  font-size: 0.825rem;
  line-height: 1.4;
}

.notice-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* ── Historial de partidas en AddGameModal ─────────── */
.other-runs-container {
  margin-top: 0.5rem;
}

.other-runs-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.other-run-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 10px;
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  transition: all 0.2s ease;
}

.other-run-card.current-run {
  border-color: var(--color-accent-primary, #7c3aed);
  background: rgba(124, 58, 237, 0.08);
  box-shadow: 0 0 10px rgba(124, 58, 237, 0.15);
}

.run-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.run-card-badges {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.run-badge-tag {
  background: rgba(124, 58, 237, 0.25);
  border: 1px solid rgba(124, 58, 237, 0.4);
  color: #c4b5fd;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.platform-badge-tag {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-border, #30363d);
  color: var(--color-text-secondary, #8b949e);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.status-badge-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.status-badge-tag.status-pendiente { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
.status-badge-tag.status-en-curso { background: rgba(6, 182, 212, 0.15); color: #67e8f9; }
.status-badge-tag.status-jugado { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; }
.status-badge-tag.status-abandonado { background: rgba(244, 63, 94, 0.15); color: #fda4af; }
.status-badge-tag.status-prestado { background: rgba(124, 58, 237, 0.15); color: #c4b5fd; }

.current-badge-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-accent-cyan, #38bdf8);
}

.run-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.run-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #8b949e);
  flex-wrap: wrap;
}

.rating-text {
  color: var(--color-accent-amber, #fbbf24);
  font-weight: 600;
}

.run-notes-preview {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8b949e);
  font-style: italic;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
