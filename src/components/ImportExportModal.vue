<template>
  <Teleport to="body">
    <Transition name="ie-fade">
      <div class="ie-overlay">
        <div class="ie-container">

          <!-- Header -->
          <div class="ie-header">
            <div>
              <h2 class="ie-title">📦 Importar / Exportar</h2>
              <p class="ie-subtitle">Gestiona los datos de tu biblioteca</p>
            </div>
            <button class="ie-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Tabs -->
          <div class="ie-tabs">
            <button :class="['ie-tab', { active: activeTab === 'export' }]" @click="switchTab('export')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
            <button :class="['ie-tab', { active: activeTab === 'import' }]" @click="switchTab('import')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importar
            </button>
          </div>

          <div class="ie-body">

            <!-- ══════════ EXPORT TAB ══════════ -->
            <div v-if="activeTab === 'export'" class="export-tab">
              <p class="tab-desc">Descarga todos los datos de tu biblioteca en el formato que prefieras.</p>

              <div class="export-cards">
                <div class="export-card">
                  <div class="export-card-icon">📦</div>
                  <div class="export-card-info">
                    <strong>JSON Completo</strong>
                    <span>Todos los datos con metadatos de IGDB. Ideal para restaurar copias de seguridad.</span>
                  </div>
                  <button class="btn-dl" @click="exportJSON" :disabled="exporting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ exporting === 'json' ? 'Generando...' : 'Descargar JSON' }}
                  </button>
                </div>

                <div class="export-card">
                  <div class="export-card-icon">📄</div>
                  <div class="export-card-info">
                    <strong>CSV para Excel / Sheets</strong>
                    <span>Columnas legibles: Título, Plataforma, Estado, Fecha Fin, Puntuación, Horas, Notas.</span>
                  </div>
                  <button class="btn-dl" @click="exportCSV" :disabled="exporting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ exporting === 'csv' ? 'Generando...' : 'Descargar CSV' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ══════════ IMPORT TAB ══════════ -->
            <div v-if="activeTab === 'import'" class="import-tab">

              <!-- Steps indicator -->
              <div class="steps-bar">
                <template v-for="(label, i) in stepLabels" :key="i">
                  <div :class="['step-item', { active: importStep === i, done: importStep > i }]">
                    <div class="step-dot">
                      <span v-if="importStep > i">✓</span>
                      <span v-else>{{ i + 1 }}</span>
                    </div>
                    <span class="step-label">{{ label }}</span>
                  </div>
                  <div v-if="i < stepLabels.length - 1" class="step-line" :class="{ done: importStep > i }"></div>
                </template>
              </div>

              <!-- ── STEP 1: Upload ── -->
              <div v-if="importStep === 0" class="step-content">
                <p class="tab-desc">Sube un archivo <strong>.csv</strong> (desde Excel/Sheets) o un <strong>.json</strong> exportado previamente desde LibraryTracker.</p>

                <!-- Drop zone -->
                <div
                  class="drop-zone"
                  :class="{ 'drag-over': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave="isDragging = false"
                  @drop.prevent="handleDrop"
                  @click="fileInput?.click()"
                >
                  <input ref="fileInput" type="file" accept=".csv,.json" style="display:none" @change="handleFileSelect" />
                  <div class="drop-icon">📂</div>
                  <p class="drop-label">Arrastra tu archivo aquí o <span class="drop-link">haz clic para seleccionarlo</span></p>
                  <p class="drop-hint">Acepta: .csv (Excel), .json (backup LibraryTracker)</p>
                </div>

                <div v-if="parseError" class="error-banner">⚠️ {{ parseError }}</div>

                <!-- Preview after parse -->
                <div v-if="parsedRows.length > 0" class="parse-preview">
                  <div class="preview-header">
                    <span class="preview-badge">{{ parsedRows.length }} entradas detectadas</span>
                    <span class="preview-type" :class="fileType">{{ fileType === 'json' ? '📦 JSON nativo' : '📄 CSV' }}</span>
                  </div>
                  <div class="preview-table-wrap">
                    <table class="preview-table">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Plataforma</th>
                          <th>Estado</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Fin</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, i) in parsedRows.slice(0, 5)" :key="i">
                          <td>{{ row.title }}</td>
                          <td>{{ row.platform }}</td>
                          <td>{{ row.status }}</td>
                          <td>{{ row.start_date || '—' }}</td>
                          <td>{{ row.finish_date || '—' }}</td>
                        </tr>
                        <tr v-if="parsedRows.length > 5">
                          <td colspan="5" class="more-rows">… y {{ parsedRows.length - 5 }} más</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button class="btn-next" @click="startMatching">
                    {{ fileType === 'json' ? 'Continuar →' : 'Buscar en IGDB →' }}
                  </button>
                </div>
              </div>

              <!-- ── STEP 2: Matching ── -->
              <div v-if="importStep === 1" class="step-content">
                <div class="matching-header">
                  <p class="tab-desc">Revisando coincidencias en IGDB para cada título de tu archivo.</p>
                  <div class="matching-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: `${matchProgress}%` }"></div>
                    </div>
                    <span class="progress-label">{{ matchedCount }} / {{ matches.length }}</span>
                  </div>
                </div>

                <div class="matches-list">
                  <div
                    v-for="(match, i) in matches"
                    :key="i"
                    :class="['match-row', match.status]"
                  >
                    <!-- Status dot -->
                    <div class="match-status-dot" :title="statusLabel(match.status)">
                      <span v-if="match.status === 'matched'">🟢</span>
                      <span v-else-if="match.status === 'ambiguous'">🟡</span>
                      <span v-else-if="match.status === 'not_found'">🔴</span>
                      <span v-else class="spinner">⏳</span>
                    </div>

                    <!-- Game info -->
                    <div class="match-info">
                      <div class="match-query">{{ match.row.title }}</div>
                      <div v-if="match.selected" class="match-result">
                        <img v-if="match.selected.cover_url" :src="match.selected.cover_url" class="match-cover" />
                        <span class="match-name">{{ match.selected.title }}</span>
                        <span class="match-year">{{ match.selected.release_year }}</span>
                      </div>
                      <div v-else-if="match.status === 'not_found'" class="match-not-found">
                        No encontrado
                      </div>
                    </div>

                    <!-- Controls -->
                    <div class="match-controls">
                      <!-- Ambiguous: dropdown to pick or edit manually -->
                      <select
                        v-if="match.status === 'ambiguous' && !match.showCustomInput"
                        class="match-select"
                        @change="e => selectCandidate(i, (e.target as HTMLSelectElement).value)"
                      >
                        <option value="">— Elige una opción —</option>
                        <option v-for="c in match.candidates" :key="c.igdb_id" :value="c.igdb_id">
                          {{ c.title }} {{ c.release_year ? `(${c.release_year})` : '' }}
                        </option>
                        <option value="__custom__">✏️ Corregir nombre...</option>
                      </select>

                      <!-- Matched: option to change/edit -->
                      <button
                        v-if="match.status === 'matched' && !match.showCustomInput"
                        class="btn-change"
                        @click="toggleCustomInput(i)"
                        title="Cambiar o corregir nombre"
                      >
                        ✏️ Editar
                      </button>

                      <!-- Custom input / Not found: input box to search -->
                      <div v-if="match.status === 'not_found' || match.showCustomInput" class="retry-row">
                        <input
                          v-model="match.retryQuery"
                          class="retry-input"
                          placeholder="Corrige el título..."
                          @keyup.enter="retryMatch(i)"
                        />
                        <button class="btn-retry" @click="retryMatch(i)" title="Buscar">🔍</button>
                        <button
                          v-if="match.candidates.length > 0"
                          class="btn-cancel-retry"
                          @click="match.showCustomInput = false"
                          title="Cancelar"
                        >✕</button>
                      </div>

                      <!-- Skip checkbox -->
                      <label class="skip-label" :title="match.skipped ? 'Incluir' : 'Omitir'">
                        <input type="checkbox" v-model="match.skipped" />
                        Omitir
                      </label>
                    </div>
                  </div>
                </div>

                <div v-if="matchingDone" class="matching-actions">
                  <div class="matching-summary">
                    <span class="s-green">🟢 {{ readyCount }} listos</span>
                    <span class="s-yellow">🟡 {{ ambiguousCount }} requieren atención</span>
                    <span class="s-red">🔴 {{ notFoundCount }} no encontrados</span>
                    <span class="s-skip">⏭ {{ skippedCount }} omitidos</span>
                  </div>
                  <button class="btn-next" :disabled="ambiguousCount > 0 || checkingDuplicates" @click="goToConfirmStep">
                    <span v-if="checkingDuplicates">Verificando duplicados…</span>
                    <span v-else-if="ambiguousCount > 0">Resuelve {{ ambiguousCount }} pendientes</span>
                    <span v-else>Confirmar Importación →</span>
                  </button>
                </div>
              </div>

              <!-- ── STEP 3: Confirm & Conflict Resolution ── -->
              <div v-if="importStep === 2" class="step-content">

                <!-- Import Result (Success state) -->
                <div v-if="importDone" class="import-result">
                  <div class="result-icon">🎉</div>
                  <h3>¡Importación completada!</h3>
                  <div class="result-stats">
                    <p v-if="importedCount > 0">✨ <strong>{{ importedCount }}</strong> juegos nuevos añadidos.</p>
                    <p v-if="updatedCount > 0">🔄 <strong>{{ updatedCount }}</strong> juegos existentes actualizados.</p>
                    <p v-if="skippedDuplicates > 0" class="result-note">⏭ <strong>{{ skippedDuplicates }}</strong> duplicados omitidos por tu elección.</p>
                  </div>
                  <button class="btn-next" @click="$emit('done')">Cerrar y actualizar →</button>
                </div>

                <!-- Pre-Import Confirmation & Conflicts -->
                <div v-else>

                  <!-- Stat Cards -->
                  <div class="confirm-summary">
                    <div class="confirm-stat primary">
                      <span class="confirm-number">{{ newItemsCount }}</span>
                      <span class="confirm-label">Nuevos juegos</span>
                    </div>
                    <div :class="['confirm-stat', duplicateCount > 0 ? 'warning' : 'muted']">
                      <span class="confirm-number">{{ duplicateCount }}</span>
                      <span class="confirm-label">Duplicados en tu biblioteca</span>
                    </div>
                    <div class="confirm-stat muted">
                      <span class="confirm-number">{{ skippedCount + notFoundCount }}</span>
                      <span class="confirm-label">Omitidos</span>
                    </div>
                  </div>

                  <!-- Conflict Resolution Box (if duplicates exist) -->
                  <div v-if="duplicateCount > 0" class="conflict-box">
                    <div class="conflict-header">
                      <div class="conflict-title-row">
                        <span class="conflict-title">⚠️ Conflictos detectados ({{ duplicateCount }})</span>
                        <button
                          class="btn-clear-lib"
                          @click="handleClearLibrary"
                          :disabled="clearingLibrary"
                          title="Elimina todos los juegos de tu biblioteca actual para importar todo de cero"
                        >
                          {{ clearingLibrary ? 'Eliminando...' : '🗑 Vaciar biblioteca y re-importar' }}
                        </button>
                      </div>
                      <span class="conflict-desc">Estos juegos ya existen en tu biblioteca para la misma plataforma. Puedes sobreescribirlos o vaciar la biblioteca para re-importar de cero.</span>
                    </div>

                    <!-- Global Bulk Controls -->
                    <div class="conflict-bulk-actions">
                      <span class="bulk-label">Acción global para duplicados:</span>
                      <div class="bulk-buttons">
                        <button
                          :class="['bulk-btn', { active: globalConflictAction === 'skip' }]"
                          @click="setGlobalConflictAction('skip')"
                        >
                          ⏭ Omitir todos
                        </button>
                        <button
                          :class="['bulk-btn', { active: globalConflictAction === 'overwrite' }]"
                          @click="setGlobalConflictAction('overwrite')"
                        >
                          🔄 Sobreescribir todos
                        </button>
                      </div>
                    </div>

                    <!-- Individual Conflict List -->
                    <div class="conflict-list">
                      <div
                        v-for="item in duplicateMatches"
                        :key="item.selected?.igdb_id + item.row.platform"
                        class="conflict-item"
                      >
                        <div class="conflict-game-info">
                          <img v-if="item.selected?.cover_url" :src="item.selected.cover_url" class="conflict-cover" />
                          <div>
                            <span class="conflict-name">{{ item.selected?.title }}</span>
                            <span class="conflict-platform">({{ item.row.platform }})</span>
                          </div>
                        </div>

                        <!-- Individual Action Selector -->
                        <div class="conflict-item-action">
                          <button
                            :class="['action-chip', { active: item.conflictAction === 'skip' }]"
                            @click="item.conflictAction = 'skip'"
                          >
                            Omitir
                          </button>
                          <button
                            :class="['action-chip danger', { active: item.conflictAction === 'overwrite' }]"
                            @click="item.conflictAction = 'overwrite'"
                          >
                            Sobreescribir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="importError" class="error-banner">⚠️ {{ importError }}</div>

                  <!-- Final Action Button -->
                  <button class="btn-next" @click="runImport" :disabled="importing">
                    <span v-if="importing">Importando… ({{ processedCount }}/{{ activeToImportCount }})</span>
                    <span v-else>
                      Confirmar Importación ({{ activeToImportCount }} juegos)
                    </span>
                  </button>
                  <button class="btn-back" @click="importStep = 1">← Volver a revisar</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { supabase, getLibraryItems, addLibraryItemToDB, updateLibraryItemInDB, clearUserLibraryInDB } from '../lib/supabase';

type GameStatus = 'Pendiente' | 'En curso' | 'Jugado' | 'Abandonado' | 'Prestado';

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

interface ParsedRow {
  title: string;
  platform: string;
  status: GameStatus;
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  playtime_hours: number;
  notes: string | null;
  // For JSON imports, already resolved
  igdb_id?: number;
  cover_url?: string | null;
  genres?: string[];
  developers?: string[];
}

interface MatchEntry {
  row: ParsedRow;
  status: 'pending' | 'matched' | 'ambiguous' | 'not_found';
  candidates: IGDBGame[];
  selected: IGDBGame | null;
  skipped: boolean;
  retryQuery: string;
  showCustomInput?: boolean;
  // Conflict / Duplicate detection
  existingId?: string | null;
  conflictAction?: 'overwrite' | 'skip';
}

// ── State ──────────────────────────────────────────
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'done'): void;
}>();

const activeTab = ref<'export' | 'import'>('export');
const exporting = ref<'json' | 'csv' | null>(null);

// Import state
const importStep = ref(0);
const stepLabels = ['Subir archivo', 'Verificar coincidencias', 'Confirmar e importar'];
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parseError = ref('');
const fileType = ref<'csv' | 'json'>('csv');
const parsedRows = ref<ParsedRow[]>([]);
const matches = ref<MatchEntry[]>([]);
const matchedCount = ref(0);
const matchingDone = ref(false);
const checkingDuplicates = ref(false);

// Conflict resolution state
const globalConflictAction = ref<'skip' | 'overwrite'>('overwrite');
const clearingLibrary = ref(false);

async function handleClearLibrary() {
  if (!confirm('¿Estás seguro de que deseas eliminar TODOS los juegos actuales de tu biblioteca para volver a importar desde cero?')) return;
  clearingLibrary.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await clearUserLibraryInDB(user.id);
      await goToConfirmStep();
    }
  } catch (err: any) {
    alert('Error al vaciar la biblioteca: ' + (err.message || 'Error de permisos o conexión.'));
  } finally {
    clearingLibrary.value = false;
  }
}

// Execution state
const importing = ref(false);
const importDone = ref(false);
const importedCount = ref(0);
const updatedCount = ref(0);
const skippedDuplicates = ref(0);
const processedCount = ref(0);
const importError = ref('');

// ── Computed ────────────────────────────────────────
const matchProgress = computed(() =>
  matches.value.length ? Math.round((matchedCount.value / matches.value.length) * 100) : 0
);
const readyCount = computed(() => matches.value.filter(m => m.status === 'matched' && !m.skipped).length);
const ambiguousCount = computed(() => matches.value.filter(m => m.status === 'ambiguous' && !m.skipped).length);
const notFoundCount = computed(() => matches.value.filter(m => m.status === 'not_found').length);
const skippedCount = computed(() => matches.value.filter(m => m.skipped).length);

// Matches that are selected and not manually skipped
const validMatches = computed(() => matches.value.filter(m => m.selected && !m.skipped));

// Duplicate matches
const duplicateMatches = computed(() => validMatches.value.filter(m => !!m.existingId));

const duplicateCount = computed(() => duplicateMatches.value.length);
const newItemsCount = computed(() => validMatches.value.filter(m => !m.existingId).length);

// Count of items that will actually be imported or updated
const activeToImportCount = computed(() =>
  validMatches.value.filter(m => !m.existingId || m.conflictAction === 'overwrite').length
);

// ── Helpers ──────────────────────────────────────────
function switchTab(tab: 'export' | 'import') {
  activeTab.value = tab;
  importStep.value = 0;
  parsedRows.value = [];
  matches.value = [];
  parseError.value = '';
}

function statusLabel(s: string) {
  if (s === 'matched') return 'Coincidencia exacta';
  if (s === 'ambiguous') return 'Múltiples opciones';
  if (s === 'not_found') return 'No encontrado';
  return 'Buscando…';
}

function normalizeTitle(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return 0;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Try DD/MM/YYYY
  const m = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // Try MM/DD/YYYY
  const m2 = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;
  return null;
}

function parseStatusField(raw: string, hasFinishDate: boolean): GameStatus {
  const s = raw?.trim().toLowerCase();
  if (s === 'jugado' || s === 'completed' || s === 'finished') return 'Jugado';
  if (s === 'en curso' || s === 'playing') return 'En curso';
  if (s === 'abandonado' || s === 'dropped') return 'Abandonado';
  if (s === 'prestado' || s === 'lent') return 'Prestado';
  if (s === 'pendiente' || s === 'pending') return 'Pendiente';
  return hasFinishDate ? 'Jugado' : 'Pendiente';
}

function normalizePlatform(raw: string): string {
  if (!raw) return 'PC';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower === 'gameboy' || lower === 'gb') return 'Game Boy';
  if (lower === 'gameboy color' || lower === 'gbc') return 'Game Boy Color';
  if (lower === 'gameboy advance' || lower === 'gba') return 'Game Boy Advance';
  if (lower === 'game cube' || lower === 'gc' || lower === 'gamecube') return 'GameCube';
  if (lower === 'nintendo ds' || lower === 'nds' || lower === 'ds') return 'Nintendo DS';
  if (lower === 'nintendo 3ds' || lower === '3ds') return 'Nintendo 3DS';
  if (lower === 'ps1' || lower === 'psx' || lower === 'playstation 1') return 'PlayStation';
  if (lower === 'ps2' || lower === 'playstation 2') return 'PlayStation 2';
  if (lower === 'ps3' || lower === 'playstation 3') return 'PlayStation 3';
  if (lower === 'ps4' || lower === 'playstation 4') return 'PlayStation 4';
  if (lower === 'ps5' || lower === 'playstation 5') return 'PlayStation 5';
  if (lower === 'switch' || lower === 'nintendo switch') return 'Nintendo Switch';
  if (lower === 'snes' || lower === 'super nintendo') return 'SNES';
  if (lower === 'nes') return 'NES';

  return clean;
}

function sanitizeTitleForSearch(raw: string): string {
  let cleaned = raw.trim();
  // Quitar contadores tipo " x4", " x2"
  cleaned = cleaned.replace(/\s+x\s*\d+$/i, '');
  // Quitar coletillas tipo "+ Expansions", "+ DLC"
  cleaned = cleaned.replace(/\s*\+\s*(expansions|dlc|expansion).*$/i, '');
  // Normalizar espaciados en dos puntos: "Mario Kart : Double Dash" -> "Mario Kart: Double Dash"
  cleaned = cleaned.replace(/\s+:\s+/g, ': ');
  return cleaned.trim();
}

// ── CSV Parser ───────────────────────────────────────
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('El CSV debe tener al menos una fila de datos.');

  const delimiters = [',', ';', '\t'];
  let delimiter = ',';
  let maxCols = 0;
  for (const d of delimiters) {
    const cols = lines[0].split(d).length;
    if (cols > maxCols) { maxCols = cols; delimiter = d; }
  }

  const headers = parseCSVLine(lines[0], delimiter).map(h =>
    h.trim().toLowerCase().replace(/[^a-záéíóú0-9 _]/gi, '').trim()
  );

  const getCol = (row: string[], keys: string[]): string => {
    for (const k of keys) {
      const idx = headers.indexOf(k);
      if (idx !== -1 && row[idx]) return row[idx].trim();
    }
    return '';
  };

  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const cols = parseCSVLine(line, delimiter);
      const title = getCol(cols, ['titulo', 'nombre', 'title', 'name', 'juego', 'game']);
      if (!title) return null;

      const startRaw = getCol(cols, ['fecha inicio', 'fecha_inicio', 'start_date', 'inicio', 'started']);
      const start_date = parseDate(startRaw);
      const finishRaw = getCol(cols, ['fecha fin', 'fecha_fin', 'finish_date', 'fecha', 'date', 'completado']);
      const finish_date = parseDate(finishRaw);
      const statusRaw = getCol(cols, ['estado', 'status', 'state']);
      const platformRaw = getCol(cols, ['plataforma', 'platform', 'plat']);
      const platform = normalizePlatform(platformRaw);
      const ratingRaw = getCol(cols, ['puntuacion', 'puntuación', 'rating', 'nota', 'score', 'stars']);
      const hoursRaw = getCol(cols, ['horas', 'hours', 'tiempo', 'playtime']);
      const notes = getCol(cols, ['notas', 'notes', 'resena', 'reseña', 'comentario', 'comment']) || null;

      return {
        title,
        platform,
        status: parseStatusField(statusRaw, !!finish_date),
        start_date,
        finish_date,
        rating: ratingRaw ? Math.min(5, parseFloat(ratingRaw)) || null : null,
        playtime_hours: hoursRaw ? parseFloat(hoursRaw) || 0 : 0,
        notes,
      } as ParsedRow;
    })
    .filter(Boolean) as ParsedRow[];
}

// ── File handling ────────────────────────────────────
async function processFile(file: File) {
  parseError.value = '';
  parsedRows.value = [];
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    const text = await file.text();

    if (ext === 'json') {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : data.items ?? [];
      if (!items.length) throw new Error('El JSON no contiene entradas válidas.');
      parsedRows.value = items.map((item: any) => ({
        title: item.game?.title ?? item.title,
        platform: normalizePlatform(item.platform),
        status: item.status,
        start_date: item.start_date ?? null,
        finish_date: item.finish_date ?? null,
        rating: item.rating ?? null,
        playtime_hours: item.playtime_hours ?? 0,
        notes: item.notes ?? null,
        igdb_id: item.game?.igdb_id ?? item.igdb_id,
        cover_url: item.game?.cover_url ?? item.cover_url,
        genres: item.game?.genres ?? [],
        developers: item.game?.developers ?? [],
      }));

      fileType.value = 'json';
    } else {
      parsedRows.value = parseCSV(text);
      fileType.value = 'csv';
    }
  } catch (err: any) {
    parseError.value = err.message || 'Error al leer el archivo.';
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
}

// ── Matching ──────────────────────────────────────────
async function startMatching() {
  importStep.value = 1;
  matchingDone.value = false;
  matchedCount.value = 0;

  if (fileType.value === 'json') {
    matches.value = parsedRows.value.map(row => ({
      row,
      status: 'matched' as const,
      candidates: [],
      selected: {
        igdb_id: row.igdb_id!,
        title: row.title,
        cover_url: row.cover_url ?? null,
        release_year: null,
        genres: row.genres ?? [],
        developers: row.developers ?? [],
        platforms: [row.platform],
        summary: null,
        steam_appid: null,
      },
      skipped: false,
      retryQuery: '',
    }));
    matchedCount.value = matches.value.length;
    matchingDone.value = true;
    await goToConfirmStep();
    return;
  }

  matches.value = parsedRows.value.map(row => ({
    row,
    status: 'pending' as const,
    candidates: [],
    selected: null,
    skipped: false,
    retryQuery: sanitizeTitleForSearch(row.title),
  }));

  for (let i = 0; i < matches.value.length; i++) {
    await searchForMatch(i, matches.value[i].row.title);
    matchedCount.value = i + 1;
    if (i < matches.value.length - 1) await new Promise(r => setTimeout(r, 200));
  }

  matchingDone.value = true;
}

async function searchForMatch(i: number, rawQuery: string) {
  const cleanQuery = sanitizeTitleForSearch(rawQuery);
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'es';
  try {
    let res = await fetch(`/api/igdb/search?q=${encodeURIComponent(cleanQuery)}&limit=5&lang=${lang}`);
    let results: IGDBGame[] = await res.json();

    // Fallback: if sanitized query yields no results, try raw query or base title before colon
    if (!results.length && cleanQuery !== rawQuery) {
      res = await fetch(`/api/igdb/search?q=${encodeURIComponent(rawQuery)}&limit=5&lang=${lang}`);
      results = await res.json();
    }

    if (!results.length && cleanQuery.includes(':')) {
      const baseTitle = cleanQuery.split(':')[0].trim();
      res = await fetch(`/api/igdb/search?q=${encodeURIComponent(baseTitle)}&limit=5&lang=${lang}`);
      results = await res.json();
    }

    if (!results.length) {
      matches.value[i].status = 'not_found';
      return;
    }

    const top = results[0];
    const sim = titleSimilarity(cleanQuery, top.title);

    if (sim >= 0.85 || results.length === 1) {
      matches.value[i].status = 'matched';
      matches.value[i].selected = top;
      matches.value[i].candidates = results;
    } else {
      matches.value[i].status = 'ambiguous';
      matches.value[i].candidates = results;
    }
  } catch {
    matches.value[i].status = 'not_found';
  }
}


function selectCandidate(i: number, igdbId: string) {
  if (igdbId === '__custom__') {
    matches.value[i].showCustomInput = true;
    matches.value[i].retryQuery = matches.value[i].row.title;
    return;
  }
  const id = parseInt(igdbId, 10);
  const candidate = matches.value[i].candidates.find(c => c.igdb_id === id);
  if (candidate) {
    matches.value[i].selected = candidate;
    matches.value[i].status = 'matched';
    matches.value[i].showCustomInput = false;
  }
}

function toggleCustomInput(i: number) {
  matches.value[i].showCustomInput = !matches.value[i].showCustomInput;
  if (matches.value[i].showCustomInput) {
    matches.value[i].retryQuery = matches.value[i].row.title;
  }
}

async function retryMatch(i: number) {
  const q = matches.value[i].retryQuery;
  if (!q.trim()) return;
  matches.value[i].status = 'pending';
  matches.value[i].selected = null;
  matches.value[i].showCustomInput = false;
  await searchForMatch(i, q);
}

// ── Duplicate Detection & Transition to Confirm Step ─
async function goToConfirmStep() {
  checkingDuplicates.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const existingItems = await getLibraryItems(user.id);
      // Map key: igdbId_platform (lowercase)
      const map = new Map<string, string>();
      existingItems.forEach(item => {
        if (item.game?.igdb_id) {
          const key = `${item.game.igdb_id}_${item.platform.toLowerCase().trim()}`;
          map.set(key, item.id);
        }
      });

      // Annotate each match entry with existingId and conflict action
      matches.value.forEach(m => {
        if (m.selected) {
          const key = `${m.selected.igdb_id}_${m.row.platform.toLowerCase().trim()}`;
          if (map.has(key)) {
            m.existingId = map.get(key);
            m.conflictAction = globalConflictAction.value;
          } else {
            m.existingId = null;
          }
        }
      });
    }
  } catch (err) {
    console.error('Error checking duplicates:', err);
  } finally {
    checkingDuplicates.value = false;
    importStep.value = 2;
  }
}

function setGlobalConflictAction(action: 'skip' | 'overwrite') {
  globalConflictAction.value = action;
  matches.value.forEach(m => {
    if (m.existingId) {
      m.conflictAction = action;
    }
  });
}

// ── Import Execution ──────────────────────────────────
async function runImport() {
  importing.value = true;
  importError.value = '';
  importedCount.value = 0;
  updatedCount.value = 0;
  skippedDuplicates.value = 0;
  processedCount.value = 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { importError.value = 'Sesión expirada. Vuelve a iniciar sesión.'; importing.value = false; return; }

  const toProcess = validMatches.value;

  for (const m of toProcess) {
    processedCount.value++;
    const game = m.selected!;
    const itemData = {
      platform: m.row.platform,
      status: m.row.status,
      start_date: m.row.start_date,
      finish_date: m.row.finish_date,
      playtime_hours: m.row.playtime_hours,
      rating: m.row.rating,
      lent_to: null as string | null,
      notes: m.row.notes,
    };

    if (m.existingId) {
      if (m.conflictAction === 'overwrite') {
        try {
          await updateLibraryItemInDB(m.existingId, itemData);
          updatedCount.value++;
        } catch (err) {
          console.error('Error updating library item:', err);
        }
      } else {
        skippedDuplicates.value++;
      }
    } else {
      try {
        const gameSnapshot = {
          id: game.igdb_id,
          title: game.title,
          cover_url: game.cover_url,
          release_year: game.release_year,
          genres: game.genres,
          developers: game.developers,
          steam_appid: game.steam_appid,
        };
        await addLibraryItemToDB(user.id, gameSnapshot, itemData);
        importedCount.value++;
      } catch (err: any) {
        if (err?.code === '23505' || err?.message?.includes('unique')) {
          skippedDuplicates.value++;
        }
      }
    }
  }

  importing.value = false;
  importDone.value = true;
}

// ── Export ────────────────────────────────────────────
async function exportJSON() {
  exporting.value = 'json';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const items = await getLibraryItems(user.id);
    const json = JSON.stringify(items, null, 2);
    downloadBlob(json, `librarytracker-backup-${today()}.json`, 'application/json');
  } catch (err) {
    console.error('Error exporting JSON:', err);
  } finally { exporting.value = null; }
}

async function exportCSV() {
  exporting.value = 'csv';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const items = await getLibraryItems(user.id);
    const header = 'Titulo;Plataforma;Estado;Fecha Inicio;Fecha Fin;Puntuacion;Horas;Notas';
    const rows = items.map(i => [
      csvEscape(i.game?.title),
      csvEscape(i.platform),
      csvEscape(i.status),
      csvEscape(i.start_date),
      csvEscape(i.finish_date),
      csvEscape(i.rating),
      csvEscape(i.playtime_hours),
      csvEscape(i.notes),
    ].join(';'));
    const csv = [header, ...rows].join('\r\n');
    downloadBlob('\uFEFF' + csv, `librarytracker-${today()}.csv`, 'text/csv;charset=utf-8');
  } catch (err) {
    console.error('Error exporting CSV:', err);
  } finally {
    exporting.value = null;
  }
}

function csvEscape(val: any): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function today() {
  return new Date().toISOString().split('T')[0];
}
</script>

<style scoped>
/* ── Overlay & Container ─────────────────────────── */
.ie-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.ie-container {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

/* ── Header ─────────────────────────────────────── */
.ie-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.ie-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 0.1rem 0;
}

.ie-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}

.ie-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}
.ie-close:hover { background: var(--color-bg-card); color: var(--color-text-primary); }

/* ── Tabs ───────────────────────────────────────── */
.ie-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.ie-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.875rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}
.ie-tab:hover { color: var(--color-text-primary); }
.ie-tab.active {
  color: var(--color-accent-primary);
  border-bottom-color: var(--color-accent-primary);
}

/* ── Body ───────────────────────────────────────── */
.ie-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.tab-desc {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

/* ── Export cards ───────────────────────────────── */
.export-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.export-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: border-color 0.2s;
}
.export-card:hover { border-color: var(--color-accent-primary); }

.export-card-icon { font-size: 1.75rem; flex-shrink: 0; }
.export-card-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.export-card-info strong { font-size: 0.9rem; color: var(--color-text-primary); }
.export-card-info span { font-size: 0.75rem; color: var(--color-text-muted); }

.btn-dl {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
  font-family: var(--font-family-base);
}
.btn-dl:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Steps bar ──────────────────────────────────── */
.steps-bar {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: all 0.3s;
}
.step-item.active .step-dot {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-primary);
  color: white;
}
.step-item.done .step-dot {
  border-color: #22c55e;
  background: #22c55e;
  color: white;
}

.step-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.step-item.active .step-label { color: var(--color-accent-primary); font-weight: 600; }
.step-item.done .step-label { color: #22c55e; }

.step-line {
  flex: 1;
  height: 2px;
  background: var(--color-border);
  margin: 0 0.375rem;
  margin-bottom: 1rem;
  transition: background 0.3s;
}
.step-line.done { background: #22c55e; }

/* ── Drop zone ──────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 14px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg-card);
  margin-bottom: 1rem;
}
.drop-zone:hover, .drop-zone.drag-over {
  border-color: var(--color-accent-primary);
  background: rgba(109, 40, 217, 0.05);
}

.drop-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.drop-label { font-size: 0.9rem; color: var(--color-text-secondary); margin: 0 0 0.375rem 0; }
.drop-link { color: var(--color-accent-primary); font-weight: 600; }
.drop-hint { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }

/* ── Parse preview ──────────────────────────────── */
.parse-preview { margin-top: 0.75rem; }
.preview-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.preview-badge {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-radius: 20px;
  padding: 0.2rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.preview-type { font-size: 0.8rem; color: var(--color-text-muted); }

.preview-table-wrap { overflow-x: auto; margin-bottom: 1rem; }
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.preview-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}
.preview-table td {
  padding: 0.5rem 0.75rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-rows { text-align: center; color: var(--color-text-muted); font-style: italic; }

/* ── Matching ───────────────────────────────────── */
.matching-header { margin-bottom: 1rem; }
.matching-progress { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
.progress-bar { flex: 1; height: 6px; background: var(--color-bg-card); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-accent-primary); border-radius: 99px; transition: width 0.3s ease; }
.progress-label { font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; }

.matches-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; max-height: 40vh; overflow-y: auto; }

.match-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-card);
  border-radius: 10px;
  border: 1px solid var(--color-border);
}
.match-row.matched { border-color: rgba(34,197,94,0.2); }
.match-row.ambiguous { border-color: rgba(234,179,8,0.2); }
.match-row.not_found { border-color: rgba(244,63,94,0.2); }

.match-status-dot { font-size: 1rem; flex-shrink: 0; }
.match-info { flex: 1; min-width: 0; }
.match-query { font-size: 0.8rem; color: var(--color-text-muted); }
.match-result { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }
.match-cover { width: 24px; height: 32px; object-fit: cover; border-radius: 3px; }
.match-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.match-year { font-size: 0.75rem; color: var(--color-text-muted); }
.match-not-found { font-size: 0.8rem; color: var(--color-accent-rose); margin-top: 0.2rem; }

.match-controls { display: flex; flex-direction: column; gap: 0.375rem; align-items: flex-end; }
.match-select {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
  font-family: var(--font-family-base);
  max-width: 200px;
}

.retry-row { display: flex; gap: 0.375rem; }
.retry-input {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
  width: 130px;
  font-family: var(--font-family-base);
}
.btn-retry {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
  transition: border-color 0.2s;
}
.btn-retry:hover { border-color: var(--color-accent-primary); }

.btn-change {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  font-family: var(--font-family-base);
  transition: all 0.2s;
}
.btn-change:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-text-primary);
}

.btn-cancel-retry {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
  transition: all 0.2s;
}
.btn-cancel-retry:hover {
  color: var(--color-accent-rose);
  border-color: var(--color-accent-rose);
}

.skip-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

/* ── Matching summary ────────────────────────────── */
.matching-actions { border-top: 1px solid var(--color-border); padding-top: 1rem; }
.matching-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
}
.s-green { color: #22c55e; }
.s-yellow { color: #eab308; }
.s-red { color: var(--color-accent-rose); }
.s-skip { color: var(--color-text-muted); }

/* ── Confirm step ────────────────────────────────── */
.confirm-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.confirm-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.875rem 1rem;
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.confirm-stat.primary { border-color: var(--color-accent-primary); }
.confirm-stat.warning { border-color: rgba(234, 179, 8, 0.4); background: rgba(234, 179, 8, 0.05); }
.confirm-stat.warning .confirm-number { color: #eab308; }
.confirm-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-accent-primary);
}
.confirm-stat.muted .confirm-number { color: var(--color-text-muted); }
.confirm-label { font-size: 0.7rem; color: var(--color-text-muted); margin-top: 0.1rem; }

/* ── Conflict Box ────────────────────────────────── */
.conflict-box {
  background: rgba(234, 179, 8, 0.04);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.conflict-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.conflict-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.conflict-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #eab308;
}

.btn-clear-lib {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-accent-rose);
  background: rgba(244, 63, 94, 0.1);
  color: var(--color-accent-rose);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}
.btn-clear-lib:hover:not(:disabled) {
  background: var(--color-accent-rose);
  color: #fff;
}
.btn-clear-lib:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.conflict-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.conflict-bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-card);
  border-radius: 10px;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
}

.bulk-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.bulk-buttons {
  display: flex;
  gap: 0.5rem;
}

.bulk-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-family-base);
}

.bulk-btn:hover {
  color: var(--color-text-primary);
}

.bulk-btn.active {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 25vh;
  overflow-y: auto;
}

.conflict-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-bg-card);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.conflict-game-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.conflict-cover {
  width: 24px;
  height: 32px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.conflict-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.conflict-platform {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: 0.3rem;
}

.conflict-item-action {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

.action-chip {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: none;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-family-base);
}

.action-chip.active {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.action-chip.danger.active {
  background: var(--color-accent-rose);
  border-color: var(--color-accent-rose);
  color: white;
}

/* ── Import result ───────────────────────────────── */
.import-result {
  text-align: center;
  padding: 2rem 1rem;
}
.result-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.import-result h3 { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.75rem 0; }
.result-stats { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; font-size: 0.9rem; }
.result-stats p { margin: 0; color: var(--color-text-secondary); }
.result-note { font-size: 0.8rem; color: var(--color-text-muted) !important; }

/* ── Buttons ─────────────────────────────────────── */
.btn-next {
  display: block;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: opacity 0.2s;
  font-family: var(--font-family-base);
  margin-top: 0.75rem;
}
.btn-next:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-back {
  display: block;
  width: 100%;
  padding: 0.625rem 1.5rem;
  background: none;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 0.875rem;
  cursor: pointer;
  text-align: center;
  margin-top: 0.5rem;
  transition: all 0.2s;
  font-family: var(--font-family-base);
}
.btn-back:hover { color: var(--color-text-primary); border-color: var(--color-text-muted); }

/* ── Error banner ────────────────────────────────── */
.error-banner {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-accent-rose);
  margin-bottom: 0.75rem;
}

/* ── Spinner ─────────────────────────────────────── */
.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transition ──────────────────────────────────── */
.ie-fade-enter-active, .ie-fade-leave-active { transition: opacity 0.2s ease; }
.ie-fade-enter-from, .ie-fade-leave-to { opacity: 0; }

/* ── Mobile ──────────────────────────────────────── */
@media (max-width: 640px) {
  .ie-container { max-height: 95vh; }
  .ie-body { padding: 1rem; }
  .export-card { flex-wrap: wrap; }
  .match-row { flex-wrap: wrap; }
  .match-controls { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .confirm-summary { flex-direction: column; }
  .conflict-bulk-actions { flex-direction: column; align-items: flex-start; }
}
</style>
