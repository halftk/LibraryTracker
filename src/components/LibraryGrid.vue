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

      <!-- ── Móvil: fila compacta con select de estado + ordenación ─── -->
      <div class="filter-row-mobile">
        <select v-model="activeFilter" class="input-field filter-select-mobile">
          <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.icon }} {{ tab.label }} ({{ getCountForStatus(tab.value) }})
          </option>
        </select>
        <select v-model="sortBy" class="input-field filter-select-mobile">
          <option value="recent">🕐 Recientes</option>
          <option value="title">🔤 A-Z</option>
          <option value="rating">⭐ Valoración</option>
          <option value="year">📅 Año</option>
        </select>
      </div>

      <!-- ── Búsqueda + Ordenación (desktop) ─── -->
      <div class="filter-controls">
        <input
          v-model="localSearch"
          type="text"
          class="input-field filter-search"
          placeholder="Filtrar por título..."
        />
        <select v-model="sortBy" class="input-field filter-select">
          <option value="recent">Más recientes</option>
          <option value="title">Título A-Z</option>
          <option value="rating">Mejor valorados</option>
          <option value="year">Año de lanzamiento</option>
        </select>
      </div>

      <!-- ── Búsqueda en móvil ─── -->
      <input
        v-model="localSearch"
        type="text"
        class="input-field filter-search-mobile"
        placeholder="🔍 Filtrar por título..."
      />
    </div>


    <!-- Grid -->
    <TransitionGroup name="grid" tag="div" class="library-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="game-card card"
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
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3 class="card-title">{{ item.game.title }}</h3>
          <p class="card-meta">
            <span>{{ item.platform }}</span>
            <span v-if="item.game.release_year"> · {{ item.game.release_year }}</span>
          </p>

          <!-- Stars -->
          <div v-if="item.rating" class="card-rating">
            <span v-for="s in 5" :key="s" :class="['star-small', { filled: s <= item.rating }]">★</span>
          </div>

          <!-- Lent to badge -->
          <div v-if="item.status === 'Prestado' && item.lent_to" class="lent-info">
            🤝 {{ item.lent_to }}
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="action-btn edit-btn" title="Editar" @click="openEdit(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" title="Eliminar" @click="deleteItem(item.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Empty State -->
    <div v-if="filteredItems.length === 0" class="empty-state">
      <span style="font-size: 3rem;">📚</span>
      <h3>Tu biblioteca está vacía</h3>
      <p v-if="activeFilter === 'all'">Usa el buscador de arriba para encontrar y añadir videojuegos.</p>
      <p v-else>No tienes juegos con estado "{{ activeFilter }}".</p>
    </div>

    <!-- Edit Modal -->
    <AddGameModal
      v-if="editingItem"
      :game="editingItem.game"
      :existing-item="editingItem"
      @close="editingItem = null"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

const items = ref<LibraryItem[]>([]);
const activeFilter = ref('all');
const localSearch = ref('');
const sortBy = ref('recent');
const currentUser = ref<User | null>(null);
const loading = ref(true);
const editingItem = ref<any>(null);

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

const filteredItems = computed(() => {
  let result = [...items.value];

  // Filter by status
  if (activeFilter.value !== 'all') {
    result = result.filter(i => i.status === activeFilter.value);
  }

  // Filter by local search
  if (localSearch.value.trim()) {
    const q = localSearch.value.toLowerCase();
    result = result.filter(i => i.game.title.toLowerCase().includes(q));
  }

  // Sort
  switch (sortBy.value) {
    case 'title':
      result.sort((a, b) => a.game.title.localeCompare(b.game.title));
      break;
    case 'rating':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'year':
      result.sort((a, b) => (b.game.release_year || 0) - (a.game.release_year || 0));
      break;
    case 'recent':
    default:
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }

  return result;
});

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
          igdb_id: i.game!.id,
          title: i.game!.title,
          cover_url: i.game!.cover_url,
          release_year: i.game!.release_year,
          genres: i.game!.genres,
          developers: i.game!.developers,
          steam_appid: i.game!.steam_appid,
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

function handleUpdated() {
  editingItem.value = null;
  loadItems();
}

// Public method: called from parent when a game is added
function refresh() {
  loadItems();
}

defineExpose({ refresh });

onMounted(() => {
  loadItems();
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
}

.filter-search {
  max-width: 300px;
}

.filter-select {
  max-width: 200px;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem !important;
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
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.2s ease;
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
