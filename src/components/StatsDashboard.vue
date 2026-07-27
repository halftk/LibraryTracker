<template>
  <div class="stats-dashboard">
    <h2 class="stats-heading">
      <span>📊</span> Estadísticas
    </h2>

    <!-- Summary Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <span class="stat-value">{{ totalItems }}</span>
        <span class="stat-label">Total Juegos</span>
      </div>
      <div class="stat-card stat-jugado">
        <span class="stat-value">{{ statusCounts['Jugado'] || 0 }}</span>
        <span class="stat-label">Jugados</span>
      </div>
      <div class="stat-card stat-en-curso">
        <span class="stat-value">{{ statusCounts['En curso'] || 0 }}</span>
        <span class="stat-label">En curso</span>
      </div>
      <div class="stat-card stat-pendiente">
        <span class="stat-value">{{ statusCounts['Pendiente'] || 0 }}</span>
        <span class="stat-label">Pendientes</span>
      </div>
      <div class="stat-card stat-abandonado">
        <span class="stat-value">{{ statusCounts['Abandonado'] || 0 }}</span>
        <span class="stat-label">Abandonados</span>
      </div>
      <div class="stat-card stat-prestado">
        <span class="stat-value">{{ statusCounts['Prestado'] || 0 }}</span>
        <span class="stat-label">Prestados</span>
      </div>
    </div>

    <!-- Metrics Row -->
    <div class="metrics-row" v-if="totalItems > 0">
      <div class="metric-card card">
        <div class="metric-icon">⭐</div>
        <div class="metric-info">
          <span class="metric-value">{{ avgRating }}</span>
          <span class="metric-label">Puntuación promedio</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-info">
          <span class="metric-value">{{ avgPlaytime }}h</span>
          <span class="metric-label">Promedio por juego</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon">🕐</div>
        <div class="metric-info">
          <span class="metric-value">{{ totalPlaytime }}h</span>
          <span class="metric-label">Tiempo total jugado</span>
        </div>
      </div>
    </div>

    <!-- Distribution Charts -->
    <div v-if="totalItems > 0" class="charts-grid">
      <!-- Platform Distribution -->
      <div class="chart-card card">
        <h3 class="chart-title">🎮 Por Plataforma</h3>
        <div class="bar-chart">
          <div
            v-for="(count, platform) in platformCounts"
            :key="platform"
            class="bar-item"
          >
            <span class="bar-label">{{ platform }}</span>
            <div class="bar-track">
              <div
                class="bar-fill bar-fill-platform"
                :style="{ width: `${(count / maxPlatformCount) * 100}%` }"
              ></div>
            </div>
            <span class="bar-value">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Genre Distribution -->
      <div class="chart-card card">
        <h3 class="chart-title">🏷️ Por Género</h3>
        <div class="bar-chart">
          <div
            v-for="(count, genre) in genreCounts"
            :key="genre"
            class="bar-item"
          >
            <span class="bar-label">{{ genre }}</span>
            <div class="bar-track">
              <div
                class="bar-fill bar-fill-genre"
                :style="{ width: `${(count / maxGenreCount) * 100}%` }"
              ></div>
            </div>
            <span class="bar-value">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase, getLibraryItems } from '../lib/supabase';

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

const totalItems = computed(() => items.value.length);

const statusCounts = computed(() => {
  const counts: Record<string, number> = {};
  items.value.forEach(i => {
    counts[i.status] = (counts[i.status] || 0) + 1;
  });
  return counts;
});

const avgRating = computed(() => {
  const rated = items.value.filter(i => i.rating && i.rating > 0);
  if (rated.length === 0) return '—';
  const avg = rated.reduce((sum, i) => sum + (i.rating || 0), 0) / rated.length;
  return avg.toFixed(1);
});

const totalPlaytime = computed(() => {
  return items.value.reduce((sum, i) => sum + (i.playtime_hours || 0), 0).toFixed(1);
});

const avgPlaytime = computed(() => {
  const withTime = items.value.filter(i => i.playtime_hours > 0);
  if (withTime.length === 0) return '0';
  const avg = withTime.reduce((sum, i) => sum + i.playtime_hours, 0) / withTime.length;
  return avg.toFixed(1);
});

const platformCounts = computed(() => {
  const counts: Record<string, number> = {};
  items.value.forEach(i => {
    counts[i.platform] = (counts[i.platform] || 0) + 1;
  });
  // Sort by count descending
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8)
  );
});

const maxPlatformCount = computed(() => Math.max(...Object.values(platformCounts.value), 1));

const genreCounts = computed(() => {
  const counts: Record<string, number> = {};
  items.value.forEach(i => {
    i.game.genres?.forEach(g => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8)
  );
});

const maxGenreCount = computed(() => Math.max(...Object.values(genreCounts.value), 1));

async function loadItems() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
      items.value = JSON.parse(localStorage.getItem('libraryItems') || '[]');
    }
  } catch (err) {
    console.error('Error loading stats:', err);
    items.value = [];
  }
}

function refresh() {
  loadItems();
}

defineExpose({ refresh });

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.stats-dashboard {
  animation: slide-up 0.5s ease-out;
}

.stats-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-jugado .stat-value { color: var(--color-accent-emerald); }
.stat-en-curso .stat-value { color: var(--color-accent-cyan); }
.stat-pendiente .stat-value { color: var(--color-accent-amber); }
.stat-abandonado .stat-value { color: var(--color-accent-rose); }
.stat-prestado .stat-value { color: var(--color-accent-secondary); }

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
}

.metric-icon {
  font-size: 2rem;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent-primary);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.chart-card {
  padding: 1.5rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.bar-item {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  align-items: center;
  gap: 0.75rem;
}

.bar-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  height: 8px;
  background: var(--color-bg-input);
  border-radius: 9999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.bar-fill-platform {
  background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-cyan));
}

.bar-fill-genre {
  background: linear-gradient(90deg, var(--color-accent-emerald), var(--color-accent-cyan));
}

.bar-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: right;
}

@media (max-width: 640px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .bar-item {
    grid-template-columns: 80px 1fr 30px;
  }
}
</style>
