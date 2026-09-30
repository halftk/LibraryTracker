<template>
  <div class="library-section">
    <!-- Filters Bar -->
    <div class="filters-bar">

      <!-- ── Desktop: pills de estado ─── -->
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          :class="['filter-tab', { active: activeFilter === tab.value }]"
          @click="activeFilter = tab.value"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span class="tab-count">{{ getCountForStatus(tab.value) }}</span>
        </button>
      </div>

      <!-- ── Móvil: fila compacta con select de estado + año + ordenación ─── -->
      <div class="filter-row-mobile">
        <select v-model="activeFilter" class="input-field filter-select-mobile">
          <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.icon }} {{ tab.label }} ({{ getCountForStatus(tab.value) }})
          </option>
        </select>

        <select v-model="selectedYear" class="input-field filter-select-mobile">
          <option value="all">📅 Año (Todos)</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="sortBy" class="input-field filter-select-mobile">
          <option value="recent">⚡ Predeterminado</option>
          <option value="finish_date">🏁 Compleción</option>
          <option value="title">🔤 A-Z</option>
          <option value="rating">⭐ Puntuación</option>
          <option value="year">📅 Año lanzamiento</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente (clic para descendente)' : 'Orden descendente (clic para ascendente)'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- ── Búsqueda + Filtros + Ordenación (desktop) ─── -->
      <div class="filter-controls">
        <div class="filter-search-wrapper">
          <input
            v-model="localSearch"
            type="text"
            class="input-field filter-search"
            placeholder="Filtrar por título..."
          />
          <button
            v-if="localSearch"
            class="clear-search-btn"
            @click="localSearch = ''"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>

        <!-- Selector de Año -->
        <select v-model="selectedYear" class="input-field filter-select">
          <option value="all">📅 Todos los años</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <!-- Selector de Criterio de Ordenación -->
        <select v-model="sortBy" class="input-field filter-select">
          <option value="recent">⚡ Predeterminado (Pendientes + Recién completados)</option>
          <option value="finish_date">🏁 Fecha de compleción</option>
          <option value="title">Título A-Z</option>
          <option value="rating">Mejor valorados</option>
          <option value="year">Año de lanzamiento</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente (clic para descendente)' : 'Orden descendente (clic para ascendente)'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- ── Búsqueda en móvil ─── -->
      <div class="filter-search-wrapper-mobile">
        <input
          v-model="localSearch"
          type="text"
          class="input-field filter-search-mobile"
          placeholder="🔍 Filtrar por título..."
        />
        <button
          v-if="localSearch"
          class="clear-search-btn"
          @click="localSearch = ''"
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Grid -->
    <TransitionGroup name="grid" tag="div" class="library-grid">
      <div
        v-for="item in displayedItems"
        :key="item.id"
        :class="['game-card card', { 'is-masterpiece': item.rating === 5 }]"
      >
        <!-- Cover -->
        <div class="card-cover-wrapper">
          <img
            v-if="item.game.cover_url"
            :src="item.game.cover_url"
            :alt="item.game.title"
            class="card-cover"
            loading="lazy"
          />
          <div v-else class="card-cover-placeholder">🎮</div>
          <span :class="['badge', `badge-${statusCss(item.status)}`]" class="card-badge">
            <span>{{ statusIcon(item.status) }}</span>
            <span>{{ item.status }}</span>
          </span>
          <!-- Replay / Run badge -->
          <span v-if="getRunBadgeInfo(item)" class="badge run-badge" :title="`Tienes ${getRunBadgeInfo(item)?.totalCount} partida(s) registrada(s) de este juego`">
            🔁 {{ getRunBadgeInfo(item)?.badgeText }}
          </span>
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3 class="card-title">{{ item.game.title }}</h3>
          <p class="card-meta">
            <span>{{ item.platform }}</span>
            <span v-if="item.game.release_year"> · {{ item.game.release_year }}</span>
            <span v-if="item.finish_date" class="finish-date-tag" title="Fecha de compleción"> · 🏁 {{ formatDateShort(item.finish_date) }}</span>
          </p>

          <!-- Stars -->
          <div v-if="item.rating" class="card-rating" :title="`${item.rating}/5 — ${getRatingLabel(item.rating)}`">
            <span v-for="s in 5" :key="s" :class="['star-small', { filled: s <= item.rating }]" :title="`${s} - ${getRatingLabel(s)}`">★</span>
          </div>

          <!-- Lent to badge -->
          <div v-if="item.status === 'Prestado' && item.lent_to" class="lent-info">
            🤝 {{ item.lent_to }}
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="action-btn replay-btn" title="Registrar otra partida / rejugada" @click="openNewRun(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
          <button class="action-btn edit-btn" title="Editar partida" @click="openEdit(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" title="Eliminar partida" @click="deleteItem(item.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Infinite Scroll Sentinel / Load More Indicator -->
    <div ref="scrollSentinel" class="scroll-sentinel">
      <div v-if="hasMore" class="loading-more" @click="loadMore" title="Haz clic para cargar más manualmente">
        <span class="spinner">⏳</span>
        <span>Cargando más juegos... ({{ displayedItems.length }} de {{ filteredItems.length }})</span>
      </div>
      <div v-else-if="filteredItems.length > BATCH_SIZE" class="end-of-list">
        <span>✓ Se han cargado todos los juegos ({{ filteredItems.length }})</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredItems.length === 0 && !loading" class="empty-state">
      <span style="font-size: 3rem;">📚</span>
      <h3>No se encontraron juegos</h3>
      <p v-if="selectedYear !== 'all' && activeFilter !== 'all'">No tienes juegos en estado "{{ activeFilter }}" para el año {{ selectedYear }}.</p>
      <p v-else-if="selectedYear !== 'all'">No tienes juegos registrados para el año {{ selectedYear }}.</p>
      <p v-else-if="activeFilter !== 'all'">No tienes juegos con estado "{{ activeFilter }}".</p>
      <p v-else>Usa el buscador de arriba para encontrar y añadir videojuegos.</p>
    </div>

    <!-- Edit Modal -->
    <AddGameModal
      v-if="editingItem"
      :game="editingItem.game"
      :existing-item="editingItem"
      @close="editingItem = null"
      @updated="handleUpdated"
    />

    <!-- Add New Run Modal -->
    <AddGameModal
      v-if="addingNewRunGame"
      :game="addingNewRunGame"
      @close="addingNewRunGame = null"
      @added="handleNewRunAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { supabase, getLibraryItems, deleteLibraryItemFromDB } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import AddGameModal from './AddGameModal.vue';

interface LibraryItem {
  id: string;
  game: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
    release_year: number | null;
    genres: string[];
    developers: string[];
    steam_appid: number | null;
  };
  platform: string;
  status: string;
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  lent_to: string | null;
  notes: string | null;
  created_at: string;
}

const BATCH_SIZE = 12;

const items = ref<LibraryItem[]>([]);
const activeFilter = ref('all');
const localSearch = ref('');
const selectedYear = ref<string>('all');
const sortBy = ref('recent');
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentUser = ref<User | null>(null);
const loading = ref(true);
const editingItem = ref<any>(null);

// Pagination / Infinite Scroll state
const visibleCount = ref(BATCH_SIZE);
const scrollSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const statusTabs = [
  { value: 'all', label: 'Todos', icon: '📚' },
  { value: 'Pendiente', label: 'Pendientes', icon: '⏳' },
  { value: 'En curso', label: 'En curso', icon: '🎮' },
  { value: 'Jugado', label: 'Jugados', icon: '✅' },
  { value: 'Abandonado', label: 'Abandonados', icon: '❌' },
  { value: 'Prestado', label: 'Prestados', icon: '🤝' },
];

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

function getCountForStatus(status: string): number {
  if (status === 'all') return items.value.length;
  return items.value.filter(i => i.status === status).length;
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

function getStatusPriority(status: string): number {
  if (status === 'En curso') return 1;
  if (status === 'Pendiente') return 2;
  if (status === 'Jugado') return 3;
  if (status === 'Prestado') return 4;
  if (status === 'Abandonado') return 5;
  return 6;
}

// Extract distinct years present in user's library (release years & completion years)
const availableYears = computed(() => {
  const yearsSet = new Set<number>();
  items.value.forEach(item => {
    if (item.game.release_year) yearsSet.add(item.game.release_year);
    if (item.finish_date) {
      const y = new Date(item.finish_date).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    }
  });
  return Array.from(yearsSet).sort((a, b) => b - a);
});

const filteredItems = computed(() => {
  let result = [...items.value];

  // Filter by status
  if (activeFilter.value !== 'all') {
    result = result.filter(i => i.status === activeFilter.value);
  }

  // Filter by year (release year or completion year)
  if (selectedYear.value !== 'all') {
    const targetY = parseInt(selectedYear.value, 10);
    result = result.filter(i => {
      const relY = i.game.release_year;
      const finY = i.finish_date ? new Date(i.finish_date).getFullYear() : null;
      return relY === targetY || finY === targetY;
    });
  }

  // Filter by local search
  if (localSearch.value.trim()) {
    const q = localSearch.value.toLowerCase();
    result = result.filter(i => i.game.title.toLowerCase().includes(q));
  }

  // Sort
  const isAsc = sortOrder.value === 'asc';

  switch (sortBy.value) {
    case 'finish_date':
      result.sort((a, b) => {
        const timeA = a.finish_date ? new Date(a.finish_date).getTime() : (isAsc ? Infinity : -Infinity);
        const timeB = b.finish_date ? new Date(b.finish_date).getTime() : (isAsc ? Infinity : -Infinity);
        return isAsc ? timeA - timeB : timeB - timeA;
      });
      break;
    case 'title':
      result.sort((a, b) => isAsc ? a.game.title.localeCompare(b.game.title) : b.game.title.localeCompare(a.game.title));
      break;
    case 'rating':
      result.sort((a, b) => isAsc ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0));
      break;
    case 'year':
      result.sort((a, b) => isAsc ? (a.game.release_year || 0) - (b.game.release_year || 0) : (b.game.release_year || 0) - (a.game.release_year || 0));
      break;
    case 'recent':
    default:
      // Default order:
      // 1. En curso / Pendientes first
      // 2. Jugados ordered by finish_date descending (most recently completed first)
      // 3. Other statuses ordered by created_at / finish_date
      result.sort((a, b) => {
        const prioA = getStatusPriority(a.status);
        const prioB = getStatusPriority(b.status);

        if (prioA !== prioB) {
          return isAsc ? prioB - prioA : prioA - prioB;
        }

        if (a.status === 'Jugado') {
          const timeA = a.finish_date ? new Date(a.finish_date).getTime() : 0;
          const timeB = b.finish_date ? new Date(b.finish_date).getTime() : 0;
          return isAsc ? timeA - timeB : timeB - timeA;
        }

        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return isAsc ? timeA - timeB : timeB - timeA;
      });
      break;
  }

  return result;
});

// Paginated items to display
const displayedItems = computed(() => {
  return filteredItems.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return visibleCount.value < filteredItems.value.length;
});

// Reset visible count when filters or search change
watch([activeFilter, localSearch, selectedYear, sortBy, sortOrder], () => {
  visibleCount.value = BATCH_SIZE;
});

function loadMore() {
  if (hasMore.value) {
    visibleCount.value += BATCH_SIZE;
  }
}

function setupIntersectionObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value) {
        loadMore();
      }
    },
    { rootMargin: '250px' }
  );

  if (scrollSentinel.value) {
    observer.observe(scrollSentinel.value);
  }
}

async function loadItems() {
  loading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser.value = user;

    if (user) {
      // ── Usuario autenticado: cargar desde Supabase ──────────────────────
      const dbItems = await getLibraryItems(user.id);
      items.value = dbItems.map(i => ({
        id: i.id,
        game: {
          igdb_id: i.game?.id ?? i.game_id,
          title: i.game?.title ?? 'Juego sin título',
          cover_url: i.game?.cover_url ?? null,
          release_year: i.game?.release_year ?? null,
          genres: i.game?.genres ?? [],
          developers: i.game?.developers ?? [],
          steam_appid: i.game?.steam_appid ?? null,
        },
        platform: i.platform,
        status: i.status,
        start_date: i.start_date,
        finish_date: i.finish_date,
        playtime_hours: i.playtime_hours,
        rating: i.rating,
        lent_to: i.lent_to,
        notes: i.notes,
        created_at: i.created_at,
      }));
    } else {
      // ── Sin sesión: cargar desde localStorage ───────────────────────────
      const stored = JSON.parse(localStorage.getItem('libraryItems') || '[]');
      items.value = stored;
    }
  } catch (err) {
    console.error('Error loading library:', err);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

async function deleteItem(id: string) {
  try {
    if (currentUser.value) {
      await deleteLibraryItemFromDB(id);
    } else {
      const updated = items.value.filter(i => i.id !== id);
      localStorage.setItem('libraryItems', JSON.stringify(updated));
    }
    items.value = items.value.filter(i => i.id !== id);
  } catch (err) {
    console.error('Error deleting item:', err);
  }
}

const addingNewRunGame = ref<any>(null);

function openNewRun(item: LibraryItem) {
  addingNewRunGame.value = {
    igdb_id: item.game.igdb_id,
    title: item.game.title,
    cover_url: item.game.cover_url,
    release_year: item.game.release_year,
    genres: item.game.genres || [],
    developers: item.game.developers || [],
    platforms: [item.platform],
    summary: null,
    steam_appid: item.game.steam_appid || null,
  };
}

function formatRawItemToLibraryItem(rawItem: any): LibraryItem {
  return {
    id: rawItem.id,
    game: {
      igdb_id: rawItem.game?.id ?? rawItem.game?.igdb_id ?? rawItem.game_id,
      title: rawItem.game?.title ?? 'Juego sin título',
      cover_url: rawItem.game?.cover_url ?? null,
      release_year: rawItem.game?.release_year ?? null,
      genres: rawItem.game?.genres ?? [],
      developers: rawItem.game?.developers ?? [],
      steam_appid: rawItem.game?.steam_appid ?? null,
    },
    platform: rawItem.platform,
    status: rawItem.status,
    start_date: rawItem.start_date,
    finish_date: rawItem.finish_date,
    playtime_hours: rawItem.playtime_hours || 0,
    rating: rawItem.rating,
    lent_to: rawItem.lent_to,
    notes: rawItem.notes,
    created_at: rawItem.created_at || new Date().toISOString(),
  };
}

function getItemTimestamp(item: LibraryItem): number {
  if (item.finish_date) {
    const t = new Date(item.finish_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (item.start_date) {
    const t = new Date(item.start_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (item.created_at) {
    const t = new Date(item.created_at).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

function getRunBadgeInfo(item: LibraryItem): { badgeText: string; totalCount: number } | null {
  const sameGameItems = items.value.filter(i => i.game.igdb_id === item.game.igdb_id);
  if (sameGameItems.length <= 1) return null;

  const sorted = [...sameGameItems].sort((a, b) => {
    const timeA = getItemTimestamp(a);
    const timeB = getItemTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createdA - createdB;
  });

  const index = sorted.findIndex(i => i.id === item.id);
  if (index === -1) return null;

  return {
    badgeText: `${index + 1}ª Partida`,
    totalCount: sameGameItems.length,
  };
}

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

function openEdit(item: LibraryItem) {
  editingItem.value = {
    ...item,
    game: {
      ...item.game,
      platforms: [item.platform],
      summary: null,
    },
  };
}

function handleNewRunAdded(rawItem?: any) {
  addingNewRunGame.value = null;
  if (!rawItem || !rawItem.id) {
    loadItems();
    return;
  }

  const newItem = formatRawItemToLibraryItem(rawItem);
  items.value = [newItem, ...items.value];
  window.dispatchEvent(new CustomEvent('library-updated'));
}

function handleUpdated(rawItem?: any) {
  editingItem.value = null;
  if (!rawItem || !rawItem.id) {
    loadItems();
    return;
  }

  const updatedItem = formatRawItemToLibraryItem(rawItem);
  const idx = items.value.findIndex(i => i.id === updatedItem.id);
  if (idx !== -1) {
    items.value[idx] = updatedItem;
    items.value = [...items.value];
  } else {
    items.value = [updatedItem, ...items.value];
  }

  window.dispatchEvent(new CustomEvent('library-updated'));
}

function refresh() {
  loadItems();
}

defineExpose({ refresh });

onMounted(() => {
  loadItems();
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.library-section {
  animation: fade-in 0.4s ease-out;
}

.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.filter-tab:hover {
  border-color: var(--color-accent-primary);
}

.filter-tab.active {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.tab-count {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.7rem;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 260px;
  flex: 1;
}

.filter-search-wrapper-mobile {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.filter-search {
  width: 100%;
  padding-right: 2.2rem !important;
}

.filter-search-mobile {
  width: 100%;
  padding-right: 2.2rem !important;
}

.clear-search-btn {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  z-index: 2;
}

.clear-search-btn:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.12);
}

.filter-select {
  max-width: 280px;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem !important;
}

.btn-sort-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  font-family: var(--font-family-base);
}

.btn-sort-order:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 10px rgba(109, 40, 217, 0.2);
}

.filter-select option {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Grid */
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.game-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Reborde dorado para juegos de 5 estrellas (Excelente / Masterpiece) ── */
.game-card.is-masterpiece {
  border: 1px solid rgba(251, 191, 36, 0.45) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.18);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card.is-masterpiece:hover {
  border-color: rgba(251, 191, 36, 0.85) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.35);
}

.game-card:hover .card-actions {
  opacity: 1;
}

.card-cover-wrapper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .card-cover {
  transform: scale(1.05);
}

.card-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card-hover);
  font-size: 3rem;
}

.card-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
}

.card-info {
  padding: 0.75rem;
  flex: 1;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.375rem;
}

.finish-date-tag {
  color: var(--color-accent-emerald, #10b981);
  font-weight: 500;
}

.card-rating {
  display: flex;
  gap: 0.125rem;
}

.star-small {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.star-small.filled {
  color: var(--color-accent-amber);
}

.lent-info {
  font-size: 0.7rem;
  color: var(--color-accent-secondary);
  margin-top: 0.25rem;
}

.card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.replay-btn:hover {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}

.edit-btn:hover {
  background: rgba(124, 58, 237, 0.3);
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}

.delete-btn:hover {
  background: rgba(244, 63, 94, 0.3);
  border-color: var(--color-accent-rose);
  color: var(--color-accent-rose);
}

.run-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(124, 58, 237, 0.9);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
}

/* Scroll Sentinel & Loading More */
.scroll-sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 1rem;
  width: 100%;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  font-size: 0.825rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.loading-more:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-text-primary);
}

.end-of-list {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: 0.875rem;
  max-width: 400px;
}

/* Grid transitions */
.grid-enter-active {
  transition: all 0.4s ease;
}

.grid-leave-active {
  transition: all 0.3s ease;
}

.grid-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.grid-move {
  transition: transform 0.4s ease;
}

@media (max-width: 640px) {
  .library-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-search,
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}

/* ── Elementos exclusivos de móvil (ocultos en desktop) ── */
.filter-row-mobile,
.filter-search-mobile {
  display: none;
}

/* ── En móvil: ocultar pills y controles desktop, mostrar compactos ── */
@media (max-width: 640px) {
  .filter-tabs,
  .filter-controls {
    display: none;
  }

  .filter-row-mobile {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  .filter-select-mobile {
    flex: 1;
    min-width: 0;
    appearance: none;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    padding-right: 2rem !important;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
  }

  .filter-select-mobile option {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .filter-search-mobile {
    display: block;
    width: 100%;
    font-size: 0.875rem;
  }
}

</style>
