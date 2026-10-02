<template>
  <div class="book-library-section">
    <!-- Filters Bar -->
    <div class="filters-bar">

      <!-- ── Status Tabs ─── -->
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

      <!-- ── Mobile Filter Select ─── -->
      <div class="filter-row-mobile">
        <select v-model="activeFilter" class="input-field filter-select-mobile">
          <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.icon }} {{ tab.label }} ({{ getCountForStatus(tab.value) }})
          </option>
        </select>

        <select v-model="selectedFormat" class="input-field filter-select-mobile">
          <option value="all">📖 Formato (Todos)</option>
          <option value="Físico">📖 Físico</option>
          <option value="Ebook">📱 Ebook</option>
          <option value="Audiolibro">🎧 Audiolibro</option>
        </select>

        <select v-model="sortBy" class="input-field filter-select-mobile">
          <option value="recent">⚡ Recientes</option>
          <option value="title">🔤 A-Z</option>
          <option value="rating">⭐ Puntuación</option>
          <option value="pages">📄 Páginas</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- ── Desktop Filter Controls ─── -->
      <div class="filter-controls">
        <div class="filter-search-wrapper">
          <input
            v-model="localSearch"
            type="text"
            class="input-field filter-search"
            placeholder="Filtrar por título o autor..."
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

        <!-- Selector de Formato -->
        <select v-model="selectedFormat" class="input-field filter-select">
          <option value="all">📖 Todos los formatos</option>
          <option value="Físico">📖 Físico (Papel)</option>
          <option value="Ebook">📱 Ebook / Kindle</option>
          <option value="Audiolibro">🎧 Audiolibro</option>
        </select>

        <!-- Selector de Criterio de Ordenación -->
        <select v-model="sortBy" class="input-field filter-select">
          <option value="recent">⚡ Predeterminado (Más recientes)</option>
          <option value="finish_date">🏁 Fecha de compleción</option>
          <option value="title">Título A-Z</option>
          <option value="rating">Mejor valorados</option>
          <option value="pages">Número de páginas</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>

    <!-- Book Grid -->
    <TransitionGroup name="grid" tag="div" class="library-grid">
      <div
        v-for="item in displayedItems"
        :key="item.id"
        :class="['book-card card', { 'is-masterpiece': item.rating === 5 }]"
      >
        <!-- Cover -->
        <div class="card-cover-wrapper">
          <img
            v-if="item.book.cover_url"
            :src="item.book.cover_url"
            :alt="item.book.title"
            class="card-cover"
            loading="lazy"
          />
          <div v-else class="card-cover-placeholder">📖</div>

          <span :class="['badge', `badge-${statusCss(item.status)}`]" class="card-badge">
            <span>{{ statusIcon(item.status) }}</span>
            <span>{{ item.status }}</span>
          </span>

          <span class="badge format-badge">
            {{ formatIcon(item.format) }} {{ item.format }}
          </span>
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3 class="card-title">{{ item.book.title }}</h3>
          <p class="card-meta">
            <span v-if="item.book.authors.length">{{ item.book.authors.join(', ') }}</span>
            <span v-if="item.book.published_year"> · {{ item.book.published_year }}</span>
          </p>

          <!-- Reading Progress Bar if total pages is set -->
          <div v-if="item.status === 'Leyendo' && item.total_pages > 0" class="progress-bar-wrapper">
            <div class="progress-info">
              <span>{{ item.current_page }} / {{ item.total_pages }} pág.</span>
              <span>{{ Math.round((item.current_page / item.total_pages) * 100) }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${Math.min((item.current_page / item.total_pages) * 100, 100)}%` }"
              ></div>
            </div>
          </div>

          <p v-else-if="item.finish_date" class="finish-date-row" title="Fecha de fin de lectura">
            🏁 <span class="finish-date-tag">{{ formatDateShort(item.finish_date) }}</span>
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
          <button class="action-btn edit-btn" title="Editar lectura" @click="openEdit(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" title="Eliminar libro" @click="deleteItem(item.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>


    <!-- Empty State -->
    <div v-if="filteredItems.length === 0 && !loading" class="empty-state">
      <span style="font-size: 3rem;">📚</span>
      <h3>No se encontraron libros</h3>
      <p v-if="activeFilter !== 'all'">No tienes libros con estado "{{ activeFilter }}".</p>
      <p v-else>Usa el buscador de arriba para encontrar y añadir tus lecturas.</p>
    </div>

    <!-- Edit Modal -->
    <AddBookModal
      v-if="editingItem"
      :book="editingItem.book"
      :existing-item="editingItem"
      @close="editingItem = null"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { supabase, getBookLibraryItems, deleteBookLibraryItemFromDB } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import AddBookModal from './AddBookModal.vue';

interface BookLibraryItem {
  id: string;
  book: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
    published_year: number | null;
    publisher: string | null;
    page_count: number | null;
    categories: string[];
    isbn: string | null;
    description: string | null;
  };
  format: string;
  status: string;
  start_date: string | null;
  finish_date: string | null;
  current_page: number;
  total_pages: number;
  rating: number | null;
  lent_to: string | null;
  notes: string | null;
  created_at: string;
}

const items = ref<BookLibraryItem[]>([]);
const activeFilter = ref('all');
const localSearch = ref('');
const selectedFormat = ref('all');
const sortBy = ref('recent');
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentUser = ref<User | null>(null);
const loading = ref(true);
const editingItem = ref<any>(null);

const statusTabs = [
  { value: 'all', label: 'Todos', icon: '📚' },
  { value: 'Leyendo', label: 'Leyendo', icon: '📖' },
  { value: 'Pendiente', label: 'Pendientes', icon: '⏳' },
  { value: 'Leído', label: 'Leídos', icon: '✅' },
  { value: 'Abandonado', label: 'Abandonados', icon: '❌' },
  { value: 'Prestado', label: 'Prestados', icon: '🤝' },
];

function statusCss(status: string): string {
  const map: Record<string, string> = {
    'Leyendo': 'en-curso',
    'Pendiente': 'pendiente',
    'Leído': 'jugado',
    'Abandonado': 'abandonado',
    'Prestado': 'prestado',
  };
  return map[status] || 'pendiente';
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    'Leyendo': '📖',
    'Pendiente': '⏳',
    'Leído': '✅',
    'Abandonado': '❌',
    'Prestado': '🤝',
  };
  return map[status] || '';
}

function formatIcon(format: string): string {
  if (format === 'Ebook') return '📱';
  if (format === 'Audiolibro') return '🎧';
  return '📖';
}

function getCountForStatus(status: string): number {
  if (status === 'all') return items.value.length;
  return items.value.filter(i => i.status === status).length;
}

function formatDateShort(str?: string | null): string {
  if (!str) return '';
  try {
    const parts = str.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  } catch {
    return str;
  }
}

function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Infumable',
    2: 'Meh',
    3: 'Buen libro',
    4: 'Notable',
    5: 'Obra maestra',
  };
  return labels[rating] || '';
}

const filteredItems = computed(() => {
  let result = [...items.value];

  if (activeFilter.value !== 'all') {
    result = result.filter(i => i.status === activeFilter.value);
  }

  if (selectedFormat.value !== 'all') {
    result = result.filter(i => i.format === selectedFormat.value);
  }

  if (localSearch.value.trim()) {
    const q = localSearch.value.toLowerCase();
    result = result.filter(i =>
      i.book.title.toLowerCase().includes(q) ||
      i.book.authors.some(a => a.toLowerCase().includes(q))
    );
  }

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
      result.sort((a, b) => isAsc ? a.book.title.localeCompare(b.book.title) : b.book.title.localeCompare(a.book.title));
      break;
    case 'rating':
      result.sort((a, b) => isAsc ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0));
      break;
    case 'pages':
      result.sort((a, b) => isAsc ? (a.total_pages || 0) - (b.total_pages || 0) : (b.total_pages || 0) - (a.total_pages || 0));
      break;
    case 'recent':
    default:
      result.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return isAsc ? timeA - timeB : timeB - timeA;
      });
      break;
  }

  return result;
});

const displayedItems = computed(() => filteredItems.value);

async function loadItems() {
  loading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser.value = user;

    if (user) {
      const dbItems = await getBookLibraryItems(user.id);
      items.value = dbItems.map(i => ({
        id: i.id,
        book: {
          id: i.book?.id ?? i.book_id,
          title: i.book?.title ?? 'Libro sin título',
          authors: i.book?.authors ?? [],
          cover_url: i.book?.cover_url ?? null,
          published_year: i.book?.published_year ?? null,
          publisher: i.book?.publisher ?? null,
          page_count: i.book?.page_count ?? null,
          categories: i.book?.categories ?? [],
          isbn: i.book?.isbn ?? null,
          description: i.book?.description ?? null,
        },
        format: i.format,
        status: i.status,
        start_date: i.start_date,
        finish_date: i.finish_date,
        current_page: i.current_page || 0,
        total_pages: i.total_pages || 0,
        rating: i.rating,
        lent_to: i.lent_to,
        notes: i.notes,
        created_at: i.created_at,
      }));
    } else {
      items.value = JSON.parse(localStorage.getItem('bookLibraryItems') || '[]');
    }
  } catch (err) {
    console.error('Error loading book library:', err);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

async function deleteItem(id: string) {
  try {
    if (currentUser.value) {
      await deleteBookLibraryItemFromDB(id);
    } else {
      const updated = items.value.filter(i => i.id !== id);
      localStorage.setItem('bookLibraryItems', JSON.stringify(updated));
    }
    items.value = items.value.filter(i => i.id !== id);
  } catch (err) {
    console.error('Error deleting book item:', err);
  }
}

function openEdit(item: BookLibraryItem) {
  editingItem.value = { ...item };
}

function handleUpdated() {
  editingItem.value = null;
  loadItems();
}

function refresh() {
  loadItems();
}

defineExpose({ refresh });

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

onMounted(() => {
  loadItems();
  if (typeof window !== 'undefined') {
    window.addEventListener('library-updated', loadItems);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('library-updated', loadItems);
  }
});
</script>


<style scoped>
.book-library-section {
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

.filter-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 280px;
  flex: 1;
}

.filter-search {
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
}

.filter-select {
  max-width: 220px;
  cursor: pointer;
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
}

/* Elementos exclusivos de móvil (ocultos en desktop) */
.filter-row-mobile,
.filter-search-mobile {
  display: none;
}

/* Grid */
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.book-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}

.book-card.is-masterpiece {
  border: 1px solid rgba(251, 191, 36, 0.45) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.18);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.book-card.is-masterpiece:hover {
  border-color: rgba(251, 191, 36, 0.85) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.35);
}

.book-card:hover .card-actions {
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

.book-card:hover .card-cover {
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

.format-badge {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.card-info {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  margin-bottom: 0.2rem;
}

.finish-date-row {
  font-size: 0.75rem;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.action-btn:hover {
  transform: scale(1.1);
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


@media (max-width: 640px) {
  .library-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

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
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
  }
}
</style>

