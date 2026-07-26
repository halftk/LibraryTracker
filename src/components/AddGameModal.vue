<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-game-preview">
              <img
                v-if="game.cover_url"
                :src="game.cover_url"
                :alt="game.title"
                class="modal-cover"
              />
              <div v-else class="modal-cover-placeholder">🎮</div>
              <div class="modal-game-info">
                <h2 class="modal-title">{{ game.title }}</h2>
                <p class="modal-meta">
                  <span v-if="game.release_year">{{ game.release_year }}</span>
                  <span v-if="game.developers.length"> · {{ game.developers.join(', ') }}</span>
                </p>
                <div v-if="game.genres.length" class="modal-genres">
                  <span v-for="genre in game.genres" :key="genre" class="genre-tag">{{ genre }}</span>
                </div>
              </div>
            </div>
            <button class="modal-close" @click="$emit('close')">✕</button>
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
                  :class="['star', { filled: star <= form.rating }]"
                  @click="form.rating = star === form.rating ? 0 : star"
                >
                  ★
                </button>
                <span class="rating-value">{{ form.rating > 0 ? `${form.rating}/5` : '' }}</span>
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

            <!-- Validation error -->
            <div v-if="validationError" class="validation-error">
              ⚠️ {{ validationError }}
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="$emit('close')">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Añadir a Biblioteca' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

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

const props = defineProps<{ game: IGDBGame }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'added', item: unknown): void;
}>();

const statuses = [
  { value: 'Pendiente' as GameStatus, label: 'Pendiente', icon: '⏳', css: 'pendiente' },
  { value: 'En curso' as GameStatus, label: 'En curso', icon: '🎮', css: 'en-curso' },
  { value: 'Jugado' as GameStatus, label: 'Jugado', icon: '✅', css: 'jugado' },
  { value: 'Abandonado' as GameStatus, label: 'Abandonado', icon: '❌', css: 'abandonado' },
  { value: 'Prestado' as GameStatus, label: 'Prestado', icon: '🤝', css: 'prestado' },
];

const defaultPlatforms = ['PC', 'PS5', 'PS4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile', 'Otro'];

const availablePlatforms = computed(() => {
  const igdbPlatforms = props.game.platforms || [];
  const all = [...new Set([...igdbPlatforms, ...defaultPlatforms])];
  return all;
});

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

const saving = ref(false);
const validationError = ref('');

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

  const libraryItem = {
    game: {
      igdb_id: props.game.igdb_id,
      title: props.game.title,
      cover_url: props.game.cover_url,
      release_year: props.game.release_year,
      genres: props.game.genres,
      developers: props.game.developers,
      steam_appid: props.game.steam_appid,
    },
    platform: form.value.platform,
    status: form.value.status,
    start_date: form.value.startDate || null,
    finish_date: form.value.finishDate || null,
    playtime_hours: form.value.playtimeHours || 0,
    rating: form.value.rating || null,
    lent_to: form.value.lentTo || null,
    notes: form.value.notes || null,
  };

  // TODO: Save to Supabase when connected
  // For now, emit and save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('libraryItems') || '[]');
    existing.push({ ...libraryItem, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem('libraryItems', JSON.stringify(existing));
    emit('added', libraryItem);
  } catch (err) {
    console.error('Error saving:', err);
    validationError.value = 'Error al guardar. Intenta de nuevo.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-container {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  animation: scale-in 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-game-preview {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.modal-cover {
  width: 64px;
  height: 85px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.modal-cover-placeholder {
  width: 64px;
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: 8px;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.modal-game-info {
  min-width: 0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.modal-genres {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.genre-tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-secondary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--color-text-primary);
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
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.required {
  color: var(--color-accent-rose);
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
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-secondary);
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
  color: var(--color-accent-rose);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
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
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

input[type="date"].input-field {
  color-scheme: dark;
}
</style>
