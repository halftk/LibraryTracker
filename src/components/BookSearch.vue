<template>
  <div class="book-search">
    <!-- Search Input -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="input-field search-field"
          placeholder="Buscar libros en Google Books..."
          @input="onInput"
          @focus="showResults = true"
        />
        <div v-if="loading" class="search-spinner"></div>
        <button v-if="query" class="clear-btn" @click="clearSearch">✕</button>
      </div>

      <!-- Search Results Dropdown -->
      <Transition name="dropdown">
        <div v-if="showResults && (results.length > 0 || loading || query.length >= 2)" class="search-results">
          <!-- Loading skeletons -->
          <div v-if="loading && results.length === 0" class="results-loading">
            <div v-for="i in 4" :key="i" class="result-skeleton">
              <div class="skeleton" style="width: 48px; height: 68px;"></div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="skeleton" style="width: 60%; height: 16px;"></div>
                <div class="skeleton" style="width: 40%; height: 12px;"></div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div
            v-for="book in results"
            :key="book.id"
            class="result-item"
            @click="selectBook(book)"
          >
            <img
              v-if="book.cover_url"
              :src="book.cover_url"
              :alt="book.title"
              class="result-cover"
              loading="lazy"
            />
            <div v-else class="result-cover-placeholder">📖</div>

            <div class="result-info">
              <span class="result-title">{{ book.title }}</span>
              <span class="result-meta">
                <span v-if="book.authors.length">{{ book.authors.join(', ') }}</span>
                <span v-if="book.published_year"> · {{ book.published_year }}</span>
                <span v-if="book.page_count"> · {{ book.page_count }} pág.</span>
              </span>
              <div v-if="book.categories.length" class="result-genres">
                <span v-for="cat in book.categories.slice(0, 3)" :key="cat" class="genre-tag">
                  {{ cat }}
                </span>
              </div>
            </div>

            <button class="add-btn" @click.stop="selectBook(book)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
            </button>
          </div>

          <!-- No results -->
          <div v-if="!loading && results.length === 0 && query.length >= 2" class="no-results">
            <span style="font-size: 2rem;">🔍</span>
            <span>No se encontraron libros para "{{ query }}"</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GoogleBook } from '../lib/googleBooks';

const emit = defineEmits<{
  (e: 'select-book', book: GoogleBook): void;
  (e: 'book-added', item: unknown): void;
}>();

const query = ref('');
const results = ref<GoogleBook[]>([]);
const loading = ref(false);
const showResults = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);

  if (query.value.trim().length < 2) {
    results.value = [];
    return;
  }

  loading.value = true;
  debounceTimer = setTimeout(() => {
    searchBooks();
  }, 350);
}

async function searchBooks() {
  try {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'es';
    const res = await fetch(`/api/google-books/search?q=${encodeURIComponent(query.value.trim())}&limit=20&lang=${lang}`);
    if (!res.ok) throw new Error('Book search failed');
    results.value = await res.json();
  } catch (err) {
    console.error('Book search error:', err);
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function handleLangChange() {
  if (query.value.trim().length >= 2) {
    searchBooks();
  }
}

function selectBook(book: GoogleBook) {
  emit('select-book', book);
  showResults.value = false;
}

function clearSearch() {
  query.value = '';
  results.value = [];
  showResults.value = false;
  searchInput.value?.focus();
}

function handleClickOutside(event: MouseEvent) {
  const el = (event.target as HTMLElement).closest('.book-search');
  if (!el) showResults.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('lang-changed', handleLangChange);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('lang-changed', handleLangChange);
});
</script>

<style scoped>
.book-search {
  position: relative;
  width: 100%;
  max-width: 640px;
}

.search-container {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-field {
  padding-left: 2.75rem !important;
  padding-right: 5rem !important;
  height: 3rem;
  font-size: 1rem !important;
  border-radius: 12px !important;
}

.search-spinner {
  position: absolute;
  right: 3rem;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: var(--color-text-primary);
}

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  max-height: 480px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.results-loading {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-skeleton {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--color-border);
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: var(--color-bg-card);
}

.result-cover {
  width: 48px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.result-cover-placeholder {
  width: 48px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: 6px;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.result-title {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.result-genres {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.genre-tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-secondary);
}

.add-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: var(--color-accent-secondary);
  transform: scale(1.1);
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
