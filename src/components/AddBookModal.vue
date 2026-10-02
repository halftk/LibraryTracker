<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card card">
        <!-- Close Button -->
        <button class="modal-close" @click="$emit('close')" title="Cerrar">✕</button>

        <!-- Book Header -->
        <div class="book-header">
          <img
            v-if="currentBook.cover_url"
            :src="currentBook.cover_url"
            :alt="currentBook.title"
            class="modal-cover"
          />
          <div v-else class="modal-cover-placeholder">📖</div>

          <div class="book-details">
            <h2 class="book-title">{{ currentBook.title }}</h2>
            <p class="book-meta">
              <span v-if="currentBook.authors.length">{{ currentBook.authors.join(', ') }}</span>
              <span v-if="currentBook.published_year"> · {{ currentBook.published_year }}</span>
            </p>
            <p v-if="currentBook.page_count" class="book-pages-badge">
              📄 {{ currentBook.page_count }} páginas
            </p>
            <div v-if="currentBook.categories.length" class="book-genres">
              <span v-for="cat in currentBook.categories.slice(0, 3)" :key="cat" class="genre-tag">
                {{ cat }}
              </span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="saveItem" class="modal-form">
          <!-- Format Selector -->
          <div class="form-group">
            <label class="form-label">📖 Formato de lectura</label>
            <select v-model="form.format" class="input-field">
              <option value="Físico">📖 Físico (Papel)</option>
              <option value="Ebook">📱 Ebook / Kindle</option>
              <option value="Audiolibro">🎧 Audiolibro</option>
            </select>
          </div>

          <!-- Status Selector -->
          <div class="form-group">
            <label class="form-label">📍 Estado</label>
            <select v-model="form.status" class="input-field">
              <option value="Pendiente">⏳ Pendiente por leer</option>
              <option value="Leyendo">📖 Leyendo actualmente</option>
              <option value="Leído">✅ Leído (Completado)</option>
              <option value="Abandonado">❌ Abandonado</option>
              <option value="Prestado">🤝 Prestado a alguien</option>
            </select>
          </div>

          <!-- Progress (Pages read) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">📄 Página actual</label>
              <input
                v-model.number="form.current_page"
                type="number"
                min="0"
                class="input-field"
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label class="form-label">📚 Páginas totales</label>
              <input
                v-model.number="form.total_pages"
                type="number"
                min="0"
                class="input-field"
                placeholder="300"
              />
            </div>
          </div>

          <!-- Dates Row -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">📅 Fecha de Inicio</label>
              <input v-model="form.start_date" type="date" class="input-field" />
            </div>
            <div class="form-group">
              <label class="form-label">🏁 Fecha de Fin</label>
              <input v-model="form.finish_date" type="date" class="input-field" />
            </div>
          </div>

          <!-- Rating Stars -->
          <div class="form-group">
            <label class="form-label">⭐ Valoración (1 - 5 estrellas)</label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                :class="['star-btn', { active: star <= (form.rating || 0) }]"
                @click="setRating(star)"
              >
                ★
              </button>
              <span v-if="form.rating" class="rating-label">{{ getRatingLabel(form.rating) }}</span>
            </div>
          </div>

          <!-- Lent To (conditional) -->
          <div v-if="form.status === 'Prestado'" class="form-group">
            <label class="form-label">🤝 Prestado a</label>
            <input
              v-model="form.lent_to"
              type="text"
              class="input-field"
              placeholder="Nombre del amigo o familiar..."
            />
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">📝 Citas o Notas personales</label>
            <textarea
              v-model="form.notes"
              class="input-field textarea-field"
              rows="3"
              placeholder="Citas destacadas, pensamientos o impresiones sobre la lectura..."
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (existingItem ? 'Actualizar Libro' : 'Añadir a mi Biblioteca') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { supabase, addBookLibraryItemToDB, updateBookLibraryItemInDB } from '../lib/supabase';
import type { GoogleBook } from '../lib/googleBooks';

interface BookItemProps {
  book: GoogleBook;
  existingItem?: any;
}

const props = defineProps<BookItemProps>();
const emit = defineEmits(['close', 'added', 'updated']);

const currentBook = ref<GoogleBook>({ ...props.book });
const saving = ref(false);

const form = ref({
  format: props.existingItem?.format || 'Físico',
  status: props.existingItem?.status || 'Pendiente',
  start_date: props.existingItem?.start_date || null,
  finish_date: props.existingItem?.finish_date || null,
  current_page: props.existingItem?.current_page || 0,
  total_pages: props.existingItem?.total_pages || props.book.page_count || 0,
  rating: props.existingItem?.rating || null,
  lent_to: props.existingItem?.lent_to || null,
  notes: props.existingItem?.notes || null,
});

watch(() => props.book, (newBook) => {
  if (newBook) {
    currentBook.value = { ...newBook };
    if (!form.value.total_pages && newBook.page_count) {
      form.value.total_pages = newBook.page_count;
    }
  }
}, { immediate: true });

function setRating(star: number) {
  form.value.rating = form.value.rating === star ? null : star;
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

async function saveItem() {
  saving.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      format: form.value.format,
      status: form.value.status,
      start_date: form.value.start_date || null,
      finish_date: form.value.finish_date || null,
      current_page: form.value.current_page || 0,
      total_pages: form.value.total_pages || 0,
      rating: form.value.rating,
      lent_to: form.value.lent_to || null,
      notes: form.value.notes || null,
    };

    if (user) {
      if (props.existingItem) {
        const updated = await updateBookLibraryItemInDB(props.existingItem.id, payload, currentBook.value);
        emit('updated', updated);
      } else {
        const added = await addBookLibraryItemToDB(user.id, currentBook.value, payload);
        emit('added', added);
      }
    } else {
      // LocalStorage fallback for non-logged-in users
      const stored = JSON.parse(localStorage.getItem('bookLibraryItems') || '[]');
      if (props.existingItem) {
        const index = stored.findIndex((i: any) => i.id === props.existingItem.id);
        if (index !== -1) {
          stored[index] = {
            ...stored[index],
            ...payload,
            book: currentBook.value,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        const newItem = {
          id: `local-book-${Date.now()}`,
          book_id: currentBook.value.id,
          book: currentBook.value,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        stored.unshift(newItem);
      }
      localStorage.setItem('bookLibraryItems', JSON.stringify(stored));
      emit(props.existingItem ? 'updated' : 'added');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('library-updated'));
    }
    emit('close');
  } catch (err) {

    console.error('Error saving book item:', err);
    alert('Error al guardar el libro. Por favor inténtalo de nuevo.');
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
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fade-in 0.2s ease-out;
}

.modal-card {
  position: relative;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.book-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-cover {
  width: 64px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.modal-cover-placeholder {
  width: 64px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: 8px;
  font-size: 2rem;
  flex-shrink: 0;
}

.book-details {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.book-meta {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.book-pages-badge {
  font-size: 0.8rem;
  color: var(--color-accent-primary);
  margin-bottom: 0.25rem;
}

.book-genres {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.genre-tag {
  font-size: 0.65rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-secondary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.textarea-field {
  resize: vertical;
  min-height: 70px;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-border);
  cursor: pointer;
  transition: transform 0.1s, color 0.15s;
}

.star-btn:hover,
.star-btn.active {
  color: #f59e0b;
  transform: scale(1.15);
}

.rating-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-left: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
