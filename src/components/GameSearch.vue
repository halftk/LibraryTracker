<template>
  <div class="game-search">
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
          placeholder="Buscar videojuegos en IGDB..."
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
              <div class="skeleton" style="width: 48px; height: 64px;"></div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="skeleton" style="width: 60%; height: 16px;"></div>
                <div class="skeleton" style="width: 40%; height: 12px;"></div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div
            v-for="game in results"
            :key="game.igdb_id"
            class="result-item"
            @click="selectGame(game)"
          >
            <img
              v-if="game.cover_url"
              :src="game.cover_url"
              :alt="game.title"
              class="result-cover"
              loading="lazy"
            />
            <div v-else class="result-cover-placeholder">🎮</div>

            <div class="result-info">
              <span class="result-title">{{ game.title }}</span>
              <span class="result-meta">
                <span v-if="game.release_year">{{ game.release_year }}</span>
                <span v-if="game.developers.length"> · {{ game.developers[0] }}</span>
              </span>
              <div v-if="game.genres.length" class="result-genres">
                <span v-for="genre in game.genres.slice(0, 3)" :key="genre" class="genre-tag">
                  {{ genre }}
                </span>
              </div>
            </div>

            <button class="add-btn" @click.stop="selectGame(game)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
            </button>
          </div>

          <!-- No results -->
          <div v-if="!loading && results.length === 0 && query.length >= 2" class="no-results">
            <span style="font-size: 2rem;">🔍</span>
            <span>No se encontraron resultados para "{{ query }}"</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- AddGameModal -->
    <AddGameModal
      v-if="selectedGame"
      :game="selectedGame"
      @close="selectedGame = null"
      @added="onGameAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AddGameModal from './AddGameModal.vue';

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

const emit = defineEmits<{
  (e: 'game-added', item: unknown): void;
}>();

const query = ref('');
const results = ref<IGDBGame[]>([]);
const loading = ref(false);
const showResults = ref(false);
const selectedGame = ref<IGDBGame | null>(null);
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
    searchGames();
  }, 350);
}

async function searchGames() {
  try {
    const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(query.value.trim())}&limit=12`);
    if (!res.ok) throw new Error('Search failed');
    results.value = await res.json();
  } catch (err) {
    console.error('Search error:', err);
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function selectGame(game: IGDBGame) {
  selectedGame.value = game;
  showResults.value = false;
}

function clearSearch() {
  query.value = '';
  results.value = [];
  showResults.value = false;
  searchInput.value?.focus();
}

function onGameAdded(item: unknown) {
  selectedGame.value = null;
  emit('game-added', item);
  clearSearch();
}

function handleClickOutside(event: MouseEvent) {
  const el = (event.target as HTMLElement).closest('.game-search');
  if (!el) showResults.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.game-search {
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
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.result-cover-placeholder {
  width: 48px;
  height: 64px;
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

/* Dropdown transitions */
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
