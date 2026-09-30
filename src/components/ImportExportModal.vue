<template>
  <Teleport to="body">
    <Transition name="ie-fade">
      <div class="ie-overlay">
        <div class="ie-container">

          <!-- Header -->
          <div class="ie-header">
            <div>
              <h2 class="ie-title">📦 Copia de Seguridad & Datos</h2>
              <p class="ie-subtitle">Exporta, restaura o sincroniza tu biblioteca con Google Drive o CSV/JSON</p>
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
              Importar / Restaurar
            </button>
            <button :class="['ie-tab', { active: activeTab === 'gdrive' }]" @click="switchTab('gdrive')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11H5m14 0a2 2 0 0 12 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 12-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              Google Drive Cloud ☁️
            </button>
          </div>

          <div class="ie-body">

            <!-- ══════════ EXPORT TAB ══════════ -->
            <div v-if="activeTab === 'export'" class="export-tab">
              <p class="tab-desc">Descarga una copia completa de tus datos o súbela directamente a tu nube privada de Google Drive.</p>

              <!-- Google Drive Direct Cloud Export Banner -->
              <div class="gdrive-quick-card">
                <div class="gdrive-card-content">
                  <div class="gdrive-icon-wrap">☁️</div>
                  <div>
                    <strong>Sincronizar en Google Drive</strong>
                    <p class="gdrive-status-text">
                      <span v-if="lastBackupDate">Última copia en Google Drive: <strong>{{ formatDateTime(lastBackupDate) }}</strong></span>
                      <span v-else>Guarda una copia segura en tu espacio privado <code>appDataFolder</code>.</span>
                    </p>
                  </div>
                </div>
                <button class="btn-gdrive-action" @click="handleUploadToDrive" :disabled="gdriveSyncing">
                  <span v-if="gdriveSyncing" class="spinner">⏳ Sincronizando...</span>
                  <span v-else>☁️ Copiar a Google Drive Ahora</span>
                </button>
              </div>

              <div class="export-cards">
                <div class="export-card">
                  <div class="export-card-icon">📦</div>
                  <div class="export-card-info">
                    <strong>JSON Nativo Completo (con SHA-256)</strong>
                    <span>Todos los juegos, notas y puntuaciones firmados con algoritmo de integridad SHA-256. Ideal para backups locales.</span>
                  </div>
                  <button class="btn-dl" @click="exportJSON" :disabled="exporting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ exporting === 'json' ? 'Generando...' : 'Descargar JSON' }}
                  </button>
                </div>

                <div class="export-card">
                  <div class="export-card-icon">📄</div>
                  <div class="export-card-info">
                    <strong>CSV para Excel / Google Sheets</strong>
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

              <!-- ── STEP 1: Upload or Select Drive ── -->
              <div v-if="importStep === 0" class="step-content">
                <p class="tab-desc">Restaura una copia de seguridad desde <strong>Google Drive</strong> o sube un archivo <strong>.csv / .tsv / .json</strong> local.</p>

                <!-- Google Drive Backups Selector Section -->
                <div class="gdrive-restore-box">
                  <div class="gdrive-restore-header">
                    <span class="gdrive-title">☁️ Copias Disponibles en Google Drive</span>
                    <button class="btn-refresh-drive" @click="loadDriveBackups" :disabled="loadingDriveList">
                      🔄 {{ loadingDriveList ? 'Buscando...' : 'Actualizar lista' }}
                    </button>
                  </div>

                  <div v-if="driveError" class="gdrive-error-msg">⚠️ {{ driveError }}</div>

                  <div v-if="loadingDriveList" class="loading-state">
                    <span class="spinner">⏳</span> Consultando appDataFolder de Google Drive...
                  </div>

                  <div v-else-if="driveBackups.length > 0" class="drive-file-list">
                    <div
                      v-for="bFile in driveBackups"
                      :key="bFile.id"
                      class="drive-file-card"
                      :class="{ selected: selectedDriveFile?.id === bFile.id }"
                      @click="selectDriveBackup(bFile)"
                    >
                      <div class="drive-file-info">
                        <span class="drive-file-name">📄 {{ bFile.name }}</span>
                        <span class="drive-file-meta">
                          📅 {{ formatDateTime(bFile.createdTime) }} • 💾 {{ formatBytes(bFile.size) }}
                        </span>
                      </div>
                      <div class="drive-file-actions">
                        <button class="btn-download-drive" @click.stop="downloadDriveBackupFile(bFile)" title="Descargar copia JSON a tu ordenador">
                          📥 Descargar JSON
                        </button>
                        <button class="btn-restore-drive" @click.stop="restoreDriveBackup(bFile)">
                          ⚡ Restaurar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="no-drive-backups">
                    <p>No se encontraron copias de seguridad anteriores en tu Google Drive.</p>
                    <button class="btn-connect-drive" @click="handleConnectDrive">🔗 Conectar Google Drive</button>
                  </div>
                </div>

                <div class="divider-text"><span>O SUBE UN ARCHIVO LOCAL (.CSV, .TSV, .JSON)</span></div>

                <!-- Drop zone -->
                <div
                  class="drop-zone"
                  :class="{ 'drag-over': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave="isDragging = false"
                  @drop.prevent="handleDrop"
                  @click="fileInput?.click()"
                >
                  <input ref="fileInput" type="file" accept=".csv,.tsv,.json" style="display:none" @change="handleFileSelect" />
                  <div class="drop-icon">📂</div>
                  <p class="drop-label">Arrastra tu archivo aquí o <span class="drop-link">haz clic para seleccionarlo</span></p>
                  <p class="drop-hint">Acepta: .csv / .tsv (Excel / Sheets), .json (backup LibraryTracker)</p>
                </div>

                <div v-if="parseError" class="error-banner">⚠️ {{ parseError }}</div>

                <!-- Preview after parse -->
                <div v-if="jsonBackupPayload || parsedRows.length > 0" class="parse-preview">
                  <div class="preview-header">
                    <span class="preview-badge">{{ jsonBackupPayload ? jsonBackupPayload.items.length : parsedRows.length }} entradas detectadas</span>
                    <span class="preview-type" :class="fileType">{{ fileType === 'json' ? '📦 JSON Nativo (SHA-256 verificado)' : '📄 CSV / TSV' }}</span>
                  </div>

                  <!-- Diff summary box for JSON backups -->
                  <div v-if="fileType === 'json' && diffSummary" class="diff-summary-card">
                    <div class="diff-title">🔍 Previsualización Diferencial (Diff View)</div>
                    <div class="diff-stats-grid">
                      <div class="diff-stat-item add">
                        <span class="diff-num">+{{ diffSummary.toAdd.length }}</span>
                        <span class="diff-label">Juegos Nuevos</span>
                      </div>
                      <div class="diff-stat-item update">
                        <span class="diff-num">🔄 {{ diffSummary.toUpdate.length }}</span>
                        <span class="diff-label">Actualizaciones</span>
                      </div>
                      <div class="diff-stat-item same">
                        <span class="diff-num">✓ {{ diffSummary.unchangedCount }}</span>
                        <span class="diff-label">Idénticos</span>
                      </div>
                    </div>
                  </div>

                  <!-- CSV / TSV Step 1 Preview Table -->
                  <div v-if="fileType === 'csv' && parsedRows.length > 0" class="preview-table-wrap">
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
                    {{ fileType === 'json' ? 'Continuar a Configurar Modo de Restauración →' : 'Buscar en IGDB →' }}
                  </button>
                </div>
              </div>

              <!-- ── STEP 2: Matching (CSV) or JSON Mode Selector ── -->
              <div v-if="importStep === 1" class="step-content">
                
                <!-- If JSON Backup: Select Restore Mode -->
                <div v-if="fileType === 'json'" class="json-restore-mode-box">
                  <h3 class="step-heading">Elige el Modo de Restauración</h3>
                  <p class="tab-desc">Selecciona cómo deseas aplicar esta copia de seguridad sobre tu biblioteca actual.</p>

                  <div class="mode-options">
                    <label :class="['mode-card', { active: restoreMode === 'merge' }]">
                      <input type="radio" v-model="restoreMode" value="merge" />
                      <div class="mode-info">
                        <strong>🔀 Fusión Inteligente (Merge / Upsert) — Recomendado</strong>
                        <p>Conserva todos tus juegos actuales, añade los nuevos del backup y actualiza aquellos que hayan cambiado. Sin riesgo de perder juegos.</p>
                      </div>
                    </label>

                    <label :class="['mode-card danger-mode', { active: restoreMode === 'overwrite' }]">
                      <input type="radio" v-model="restoreMode" value="overwrite" />
                      <div class="mode-info">
                        <strong>⚠️ Reemplazo Completo (Overwrite)</strong>
                        <p>Elimina todos los datos actuales de tu biblioteca e instala la copia exacta del backup. Requiere confirmación.</p>
                      </div>
                    </label>
                  </div>

                  <div v-if="restoreMode === 'overwrite'" class="overwrite-warning-box">
                    🚨 <strong>Advertencia:</strong> El modo Reemplazo Completo borrará de tu biblioteca actual cualquier juego que no esté presente en esta copia.
                  </div>

                  <div class="matching-actions">
                    <button class="btn-back" @click="importStep = 0">← Volver</button>
                    <button class="btn-next" @click="importStep = 2">Continuar a Confirmación →</button>
                  </div>
                </div>

                <!-- If CSV/TSV: IGDB Matching step -->
                <div v-else>
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
                      <div class="match-status-dot" :title="statusLabel(match.status)">
                        <span v-if="match.status === 'matched'">🟢</span>
                        <span v-else-if="match.status === 'ambiguous'">🟡</span>
                        <span v-else-if="match.status === 'not_found'">🔴</span>
                        <span v-else class="spinner">⏳</span>
                      </div>

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

                      <div class="match-controls">
                        <select
                          v-if="(match.status === 'matched' || match.status === 'ambiguous') && !match.showCustomInput"
                          class="match-select"
                          :value="match.selected?.igdb_id ?? ''"
                          @change="e => selectCandidate(i, (e.target as HTMLSelectElement).value)"
                        >
                          <option value="" disabled>— Elige una opción —</option>
                          <option v-for="c in match.candidates" :key="c.igdb_id" :value="c.igdb_id">
                            {{ c.title }} {{ c.release_year ? `(${c.release_year})` : '' }}
                          </option>
                          <option value="__custom__">✏️ Buscar otro nombre...</option>
                        </select>

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

              </div>

              <!-- ── STEP 3: Final Execution Confirmation ── -->
              <div v-if="importStep === 2" class="step-content">

                <!-- Success State -->
                <div v-if="importDone" class="import-result">
                  <div class="result-icon">🎉</div>
                  <h3>¡Importación completada con éxito!</h3>
                  <div class="result-stats">
                    <p v-if="importedCount > 0">✨ <strong>{{ importedCount }}</strong> juegos nuevos añadidos.</p>
                    <p v-if="updatedCount > 0">🔄 <strong>{{ updatedCount }}</strong> juegos existentes actualizados.</p>
                    <p v-if="skippedDuplicates > 0" class="result-note">⏭ <strong>{{ skippedDuplicates }}</strong> duplicados omitidos.</p>
                  </div>
                  <button class="btn-next" @click="handleDone">Cerrar y actualizar →</button>
                </div>

                <!-- Pre-Import Confirmation -->
                <div v-else>

                  <!-- Confirmation summary for JSON -->
                  <div v-if="fileType === 'json' && jsonBackupPayload" class="confirm-json-box">
                    <h3>Confirmar Restauración del Backup</h3>
                    <p>Vas a restaurar un archivo con <strong>{{ jsonBackupPayload.items.length }} juegos</strong>.</p>
                    <div class="mode-summary-badge">
                      Modo activo: <strong>{{ restoreMode === 'merge' ? '🔀 Fusión Inteligente (Merge)' : '⚠️ Reemplazo Completo (Overwrite)' }}</strong>
                    </div>

                    <button class="btn-next big-btn" @click="runJsonRestore" :disabled="importing">
                      <span v-if="importing">Restaurando biblioteca...</span>
                      <span v-else>Ejecutar Restauración Ahora →</span>
                    </button>
                  </div>

                  <!-- Confirmation summary for CSV / TSV -->
                  <div v-else>
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
                        <span class="conflict-desc">Estos juegos ya existen en tu biblioteca para la misma plataforma.</span>
                      </div>

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

                    <button class="btn-next" @click="runImport" :disabled="importing">
                      <span v-if="importing">Importando… ({{ processedCount }}/{{ activeToImportCount }})</span>
                      <span v-else>Confirmar Importación ({{ activeToImportCount }} juegos)</span>
                    </button>
                  </div>

                  <div v-if="importError" class="error-banner">⚠️ {{ importError }}</div>
                  <button class="btn-back" @click="importStep = 1">← Volver a revisar</button>
                </div>
              </div>

            </div>

            <!-- ══════════ GOOGLE DRIVE TAB ══════════ -->
            <div v-if="activeTab === 'gdrive'" class="gdrive-tab">
              <div class="gdrive-banner-hero">
                <div class="hero-icon">☁️</div>
                <div class="hero-text">
                  <h3>Copias de Seguridad en Google Drive</h3>
                  <p>Guarda automáticamente tus datos de juego en tu carpeta privada <code>appDataFolder</code>. Sin dar acceso a tus archivos personales.</p>
                </div>
              </div>

              <!-- Visible Error Banner -->
              <div v-if="driveError" class="error-banner">
                ⚠️ {{ driveError }}
              </div>

              <div class="gdrive-settings-card">
                <div class="setting-row">
                  <div>
                    <strong>Estado de Conexión</strong>
                    <p class="setting-sub">
                      <span v-if="driveConnected" class="status-online">🟢 Conectado con Google Drive</span>
                      <span v-else class="status-offline">⚪ No conectado</span>
                    </p>
                  </div>
                  <button v-if="!driveConnected" class="btn-connect" @click="handleConnectDrive" :disabled="connectingDrive">
                    <span v-if="connectingDrive">⏳ Abriendo Google...</span>
                    <span v-else>🔗 Conectar Google Drive</span>
                  </button>
                  <button v-else class="btn-disconnect" @click="handleDisconnectDrive">
                    Desconectar
                  </button>
                </div>

                <div class="setting-row border-top">
                  <div>
                    <strong>Auto-Backup Automático</strong>
                    <p class="setting-sub">Realiza una copia limpia en la nube cada vez que exportes datos.</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="autoBackupSetting" @change="toggleAutoBackup" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-row border-top">
                  <div>
                    <strong>Frecuencia y Rotación de Versiones</strong>
                    <p class="setting-sub">Se conservan automáticamente las <strong>últimas 5 copias</strong> de seguridad en la nube.</p>
                  </div>
                  <span class="rot-badge">Máx. 5 Versiones</span>
                </div>
              </div>

              <div class="gdrive-actions-row">
                <button class="btn-action-primary" @click="handleUploadToDrive" :disabled="gdriveSyncing">
                  <span v-if="gdriveSyncing">⏳ Guardando en la nube...</span>
                  <span v-else>☁️ Crear Nueva Copia en Google Drive Ahora</span>
                </button>
                <button class="btn-action-secondary" @click="activeTab = 'import'; loadDriveBackups()">
                  📂 Ver e Importar Copias Guardadas
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase, getLibraryItems, addLibraryItemToDB, updateLibraryItemInDB, clearUserLibraryInDB } from '../lib/supabase';
import {
  createBackupPayload,
  validateBackupPayload,
  calculateBackupDiff,
  executeRestore,
  type BackupPayload,
  type DiffSummary,
} from '../lib/backupService';
import {
  requestGoogleDriveAccess,
  ensureValidDriveToken,
  isDriveConnectedInStorage,
  listDriveBackups,
  uploadDriveBackup,
  downloadDriveBackup,
  getSavedDriveToken,
  clearDriveToken,
  getLastBackupTimestamp,
  isAutoBackupEnabled,
  setAutoBackupEnabled,
  type DriveBackupFile,
} from '../lib/googleDrive';

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
  existingId?: string | null;
  conflictAction?: 'overwrite' | 'skip';
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'done'): void;
}>();

const activeTab = ref<'export' | 'import' | 'gdrive'>('export');
const exporting = ref<'json' | 'csv' | null>(null);

// Import state
const importStep = ref(0);
const stepLabels = ['Subir archivo / Google Drive', 'Configurar Coincidencias', 'Confirmar e Importar'];
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parseError = ref('');
const fileType = ref<'csv' | 'json'>('csv');
const parsedRows = ref<ParsedRow[]>([]);
const matches = ref<MatchEntry[]>([]);
const matchedCount = ref(0);
const matchingDone = ref(false);
const checkingDuplicates = ref(false);

// JSON Backup specific state
const jsonBackupPayload = ref<BackupPayload | null>(null);
const diffSummary = ref<DiffSummary | null>(null);
const restoreMode = ref<'merge' | 'overwrite'>('merge');

// Google Drive state
const driveConnected = ref(false);
const connectingDrive = ref(false);
const driveBackups = ref<DriveBackupFile[]>([]);
const selectedDriveFile = ref<DriveBackupFile | null>(null);
const loadingDriveList = ref(false);
const gdriveSyncing = ref(false);
const driveError = ref('');
const lastBackupDate = ref<string | null>(getLastBackupTimestamp());
const autoBackupSetting = ref(isAutoBackupEnabled());

// Conflict resolution state
const globalConflictAction = ref<'skip' | 'overwrite'>('overwrite');
const clearingLibrary = ref(false);

// Execution state
const importing = ref(false);
const importDone = ref(false);
const importedCount = ref(0);
const updatedCount = ref(0);
const skippedDuplicates = ref(0);
const processedCount = ref(0);
const importError = ref('');

onMounted(async () => {
  if (isDriveConnectedInStorage()) {
    driveConnected.value = true;
    const token = await ensureValidDriveToken(true);
    if (token) {
      loadDriveBackups();
    }
  }
});

// ── Computed ────────────────────────────────────────
const matchProgress = computed(() =>
  matches.value.length ? Math.round((matchedCount.value / matches.value.length) * 100) : 0
);
const readyCount = computed(() => matches.value.filter(m => m.status === 'matched' && !m.skipped).length);
const ambiguousCount = computed(() => matches.value.filter(m => m.status === 'ambiguous' && !m.skipped).length);
const notFoundCount = computed(() => matches.value.filter(m => m.status === 'not_found').length);
const skippedCount = computed(() => matches.value.filter(m => m.skipped).length);
const validMatches = computed(() => matches.value.filter(m => m.selected && !m.skipped));
const duplicateMatches = computed(() => validMatches.value.filter(m => !!m.existingId));
const duplicateCount = computed(() => duplicateMatches.value.length);
const newItemsCount = computed(() => validMatches.value.filter(m => !m.existingId).length);
const activeToImportCount = computed(() =>
  validMatches.value.filter(m => !m.existingId || m.conflictAction === 'overwrite').length
);

// ── Google Drive Integration ────────────────────────
async function handleConnectDrive() {
  driveError.value = '';
  connectingDrive.value = true;
  try {
    const token = await requestGoogleDriveAccess();
    if (token) {
      driveConnected.value = true;
      await loadDriveBackups();
    }
  } catch (err: any) {
    driveError.value = err.message || 'No se pudo conectar a Google Drive.';
    console.error('Drive connection error:', err);
  } finally {
    connectingDrive.value = false;
  }
}

function handleDisconnectDrive() {
  clearDriveToken();
  driveConnected.value = false;
  driveBackups.value = [];
}

function toggleAutoBackup() {
  setAutoBackupEnabled(autoBackupSetting.value);
}

async function loadDriveBackups() {
  driveError.value = '';
  loadingDriveList.value = true;
  try {
    let token = await ensureValidDriveToken(true);
    if (!token) {
      token = await requestGoogleDriveAccess();
    }
    if (token) {
      driveConnected.value = true;
      driveBackups.value = await listDriveBackups(token);
    }
  } catch (err: any) {
    driveError.value = err.message || 'Error al cargar copias de seguridad de Google Drive.';
  } finally {
    loadingDriveList.value = false;
  }
}

async function handleUploadToDrive() {
  gdriveSyncing.value = true;
  driveError.value = '';
  try {
    let token = await ensureValidDriveToken(true);
    if (!token) {
      token = await requestGoogleDriveAccess();
    }
    const { data: { user } } = await supabase.auth.getUser();
    const currentItems = await getLibraryItems(user?.id || '');
    const payload = await createBackupPayload(user?.id, currentItems);

    await uploadDriveBackup(token, payload);
    lastBackupDate.value = getLastBackupTimestamp();
    await loadDriveBackups();
    alert('¡Copia de seguridad guardada con éxito en Google Drive! ☁️');
  } catch (err: any) {
    driveError.value = err.message || 'Falló la subida a Google Drive.';
    alert('⚠️ Error al subir la copia: ' + (err.message || 'Inténtalo de nuevo.'));
  } finally {
    gdriveSyncing.value = false;
  }
}

function selectDriveBackup(file: DriveBackupFile) {
  selectedDriveFile.value = file;
}

async function restoreDriveBackup(file: DriveBackupFile) {
  selectedDriveFile.value = file;
  parseError.value = '';
  try {
    let token = await ensureValidDriveToken(true);
    if (!token) {
      token = await requestGoogleDriveAccess();
    }
    const rawData = await downloadDriveBackup(token, file.id);
    await processParsedJSON(rawData);
  } catch (err: any) {
    parseError.value = 'No se pudo descargar la copia desde Google Drive: ' + err.message;
  }
}

async function downloadDriveBackupFile(file: DriveBackupFile) {
  try {
    let token = await ensureValidDriveToken(true);
    if (!token) {
      token = await requestGoogleDriveAccess();
    }
    const rawData = await downloadDriveBackup(token, file.id);
    const jsonStr = JSON.stringify(rawData, null, 2);
    downloadBlob(jsonStr, file.name, 'application/json');
  } catch (err: any) {
    alert('Error al descargar el archivo desde Google Drive: ' + (err.message || 'Inténtalo de nuevo.'));
  }
}

// ── File & Payload Parsing ──────────────────────────
async function processFile(file: File) {
  parseError.value = '';
  parsedRows.value = [];
  jsonBackupPayload.value = null;
  diffSummary.value = null;
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    const text = await file.text();
    if (ext === 'json') {
      try {
        const raw = JSON.parse(text);
        await processParsedJSON(raw);
      } catch (e: any) {
        if (e.message && e.message.includes('JSON')) throw e;
        // Fallback for legacy simple JSON array
        const rawArray = JSON.parse(text);
        const items = Array.isArray(rawArray) ? rawArray : rawArray.items ?? [];
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
      }
    } else {
      parsedRows.value = parseCSV(text);
      fileType.value = 'csv';
    }
  } catch (err: any) {
    parseError.value = err.message || 'Error al procesar el archivo.';
  }
}

async function processParsedJSON(rawObj: any) {
  const validation = await validateBackupPayload(rawObj);
  if (!validation.valid || !validation.payload) {
    const items = Array.isArray(rawObj) ? rawObj : rawObj.items;
    if (Array.isArray(items) && items.length > 0) {
      fileType.value = 'json';
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
      return;
    }
    throw new Error(validation.error || 'Formato JSON no válido.');
  }

  jsonBackupPayload.value = validation.payload;
  fileType.value = 'json';

  // Calculate Diff View
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const currentItems = await getLibraryItems(user.id);
    diffSummary.value = calculateBackupDiff(currentItems, validation.payload.items);
  }

  parsedRows.value = validation.payload.items.map(item => ({
    title: item.title,
    platform: normalizePlatform(item.platform),
    status: item.status,
    start_date: item.start_date,
    finish_date: item.finish_date,
    rating: item.rating,
    playtime_hours: item.playtime_hours,
    notes: item.notes,
    igdb_id: item.game_id,
    cover_url: item.cover_url,
    genres: item.genres,
    developers: item.developers,
  }));
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

// ── Restore JSON Action ──────────────────────────────
async function runJsonRestore() {
  if (!jsonBackupPayload.value) return;
  importing.value = true;
  importError.value = '';
  importedCount.value = 0;
  updatedCount.value = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión expirada.');

    const res = await executeRestore(
      user.id,
      jsonBackupPayload.value.items,
      restoreMode.value,
      diffSummary.value || undefined
    );

    importedCount.value = res.added;
    updatedCount.value = res.updated;
    importDone.value = true;
  } catch (err: any) {
    importError.value = err.message || 'Falló la restauración.';
  } finally {
    importing.value = false;
  }
}

// ── Matching & CSV Helpers ───────────────────────────
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
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
  cleaned = cleaned.replace(/\s+x\s*\d+$/i, '');
  cleaned = cleaned.replace(/\s*\+\s*(expansions|dlc|expansion).*$/i, '');
  cleaned = cleaned.replace(/\s+:\s+/g, ': ');
  return cleaned.trim();
}

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
  if (lines.length < 2) throw new Error('El CSV/TSV debe tener al menos una fila de datos.');

  const delimiters = [',', ';', '\t'];
  let delimiter = ',';
  let maxCols = 0;
  for (const d of delimiters) {
    const cols = lines[0].split(d).length;
    if (cols > maxCols) { maxCols = cols; delimiter = d; }
  }

  const headers = parseCSVLine(lines[0], delimiter).map(h =>
    h.trim().toLowerCase().replace(/[^a-z0-9 _]/gi, '').trim()
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
      const ratingRaw = getCol(cols, ['puntuacion', 'rating', 'nota', 'score', 'stars']);
      const hoursRaw = getCol(cols, ['horas', 'hours', 'tiempo', 'playtime']);
      const notes = getCol(cols, ['notas', 'notes', 'resena', 'comentario', 'comment']) || null;

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

async function startMatching() {
  importStep.value = 1;
  matchingDone.value = false;
  matchedCount.value = 0;

  if (fileType.value === 'json') {
    return; // JSON uses Step 1 mode selection
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
    if (i < matches.value.length - 1) await new Promise(r => setTimeout(r, 150));
  }

  matchingDone.value = true;
}

async function searchForMatch(i: number, rawQuery: string) {
  const cleanQuery = sanitizeTitleForSearch(rawQuery);
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'es';
  try {
    let res = await fetch(`/api/igdb/search?q=${encodeURIComponent(cleanQuery)}&limit=15&lang=${lang}`);
    let results: IGDBGame[] = await res.json();

    if (!results.length && cleanQuery !== rawQuery) {
      res = await fetch(`/api/igdb/search?q=${encodeURIComponent(rawQuery)}&limit=15&lang=${lang}`);
      results = await res.json();
    }

    if (!results.length && cleanQuery.includes(':')) {
      const baseTitle = cleanQuery.split(':')[0].trim();
      res = await fetch(`/api/igdb/search?q=${encodeURIComponent(baseTitle)}&limit=15&lang=${lang}`);
      results = await res.json();
    }

    if (!results.length) {
      matches.value[i].status = 'not_found';
      return;
    }

    results.sort((a, b) => {
      const isExactA = cleanQuery.toLowerCase() === a.title.toLowerCase();
      const isExactB = cleanQuery.toLowerCase() === b.title.toLowerCase();
      if (isExactA && !isExactB) return -1;
      if (!isExactA && isExactB) return 1;

      const simA = titleSimilarity(cleanQuery, a.title);
      const simB = titleSimilarity(cleanQuery, b.title);
      const lenDiffA = Math.abs(a.title.length - cleanQuery.length);
      const lenDiffB = Math.abs(b.title.length - cleanQuery.length);

      if (Math.abs(simA - simB) > 0.08) {
        return simB - simA;
      }
      return lenDiffA - lenDiffB;
    });

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

async function retryMatch(i: number) {
  const q = matches.value[i].retryQuery;
  if (!q.trim()) return;
  matches.value[i].status = 'pending';
  matches.value[i].selected = null;
  matches.value[i].showCustomInput = false;
  await searchForMatch(i, q);
}

async function goToConfirmStep() {
  checkingDuplicates.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const existingItems = await getLibraryItems(user.id);
      const map = new Map<string, string>();
      existingItems.forEach(item => {
        const gameId = item.game_id || item.game?.id;
        if (gameId) {
          map.set(`${gameId}_${item.platform.toLowerCase().trim()}`, item.id);
        }
      });

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
  } finally {
    checkingDuplicates.value = false;
    importStep.value = 2;
  }
}

function setGlobalConflictAction(action: 'skip' | 'overwrite') {
  globalConflictAction.value = action;
  matches.value.forEach(m => {
    if (m.existingId) m.conflictAction = action;
  });
}

async function handleClearLibrary() {
  if (!confirm('¿Seguro que deseas eliminar TODOS los juegos de tu biblioteca para volver a importar desde cero?')) return;
  clearingLibrary.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await clearUserLibraryInDB(user.id);
      await goToConfirmStep();
    }
  } finally {
    clearingLibrary.value = false;
  }
}

async function runImport() {
  importing.value = true;
  importError.value = '';
  importedCount.value = 0;
  updatedCount.value = 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { importError.value = 'Sesión expirada.'; importing.value = false; return; }

  for (const m of validMatches.value) {
    processedCount.value++;
    const game = m.selected!;
    const itemData = {
      platform: m.row.platform || 'PC',
      status: m.row.status || 'Jugado',
      start_date: m.row.start_date || null,
      finish_date: m.row.finish_date || null,
      playtime_hours: m.row.playtime_hours || 0,
      rating: m.row.rating || null,
      notes: m.row.notes || null,
      lent_to: null,
    };

    if (m.existingId) {
      if (m.conflictAction === 'overwrite') {
        await updateLibraryItemInDB(m.existingId, itemData);
        updatedCount.value++;
      } else {
        skippedDuplicates.value++;
      }
    } else {
      await addLibraryItemToDB(user.id, {
        id: game.igdb_id,
        title: game.title,
        cover_url: game.cover_url,
        release_year: game.release_year,
        genres: game.genres,
        developers: game.developers,
        steam_appid: game.steam_appid,
      }, itemData);
      importedCount.value++;
    }
  }

  importing.value = false;
  importDone.value = true;
}

function handleDone() {
  emit('done');
  if (typeof window !== 'undefined') window.location.reload();
}

async function exportJSON() {
  exporting.value = 'json';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const items = await getLibraryItems(user.id);
    const payload = await createBackupPayload(user.id, items);
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadBlob(jsonStr, `librarytracker-backup-${today()}.json`, 'application/json');

    if (isAutoBackupEnabled() && getSavedDriveToken()) {
      handleUploadToDrive().catch(() => {});
    }
  } finally {
    exporting.value = null;
  }
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
  } finally {
    exporting.value = null;
  }
}

function switchTab(tab: 'export' | 'import' | 'gdrive') {
  activeTab.value = tab;
  importStep.value = 0;
  parsedRows.value = [];
  matches.value = [];
  parseError.value = '';
}

function formatBytes(bytes?: string): string {
  if (!bytes) return 'N/A';
  const num = parseInt(bytes, 10);
  if (num < 1024) return num + ' B';
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
  return (num / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'Desconocida';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return isoStr; }
}

function statusLabel(s: string) {
  if (s === 'matched') return 'Coincidencia exacta';
  if (s === 'ambiguous') return 'Múltiples opciones';
  if (s === 'not_found') return 'No encontrado';
  return 'Buscando…';
}

function csvEscape(val: any): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
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
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function today() {
  return new Date().toISOString().split('T')[0];
}
</script>

<style scoped>
.ie-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.ie-container {
  background: var(--color-bg-secondary, #161b22);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 18px;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  color: var(--color-text-primary, #f0f6fc);
}

.ie-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #30363d);
}

.ie-title { font-size: 1.2rem; font-weight: 800; margin: 0; }
.ie-subtitle { font-size: 0.825rem; color: var(--color-text-muted, #8b949e); margin: 0; }
.ie-close { background: none; border: none; color: #8b949e; font-size: 1.2rem; cursor: pointer; }
.ie-close:hover { color: #fff; }

.ie-tabs { display: flex; border-bottom: 1px solid var(--color-border, #30363d); }
.ie-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.85rem; background: none; border: none; color: #8b949e; font-weight: 600; cursor: pointer;
  border-bottom: 2px solid transparent; transition: all 0.2s;
}
.ie-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; background: rgba(56, 139, 253, 0.08); }

.ie-body { padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem; }
.tab-desc { font-size: 0.875rem; color: #8b949e; margin-bottom: 1rem; }

/* Quick Google Drive Card */
.gdrive-quick-card {
  background: linear-gradient(135deg, rgba(26, 115, 232, 0.15), rgba(56, 139, 253, 0.05));
  border: 1px solid rgba(56, 139, 253, 0.3);
  border-radius: 12px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.gdrive-card-content { display: flex; align-items: center; gap: 1rem; }
.gdrive-icon-wrap { font-size: 1.8rem; }
.gdrive-status-text { font-size: 0.8rem; color: #8b949e; margin-top: 0.25rem; }

.btn-gdrive-action {
  background: #1a73e8; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-weight: 700;
  cursor: pointer; transition: background 0.2s;
}
.btn-gdrive-action:hover { background: #1557b0; }

.export-cards { display: flex; flex-direction: column; gap: 1rem; }
.export-card {
  display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.03); border: 1px solid var(--color-border, #30363d); border-radius: 12px;
}
.export-card-icon { font-size: 1.5rem; margin-right: 0.75rem; }
.export-card-info { flex: 1; display: flex; flex-direction: column; }
.export-card-info strong { font-size: 0.95rem; }
.export-card-info span { font-size: 0.775rem; color: #8b949e; }

.btn-dl {
  display: flex; align-items: center; gap: 0.5rem; background: #238636; color: #fff; border: none;
  padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;
}
.btn-dl:hover { background: #2ea043; }

/* Steps indicator */
.steps-bar { display: flex; align-items: center; margin-bottom: 1.5rem; }
.step-item { display: flex; align-items: center; gap: 0.5rem; opacity: 0.5; }
.step-item.active, .step-item.done { opacity: 1; }
.step-dot {
  width: 24px; height: 24px; border-radius: 50%; background: #30363d; display: flex;
  align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;
}
.step-item.active .step-dot { background: #58a6ff; color: #0d1117; }
.step-item.done .step-dot { background: #238636; color: #fff; }
.step-line { flex: 1; height: 2px; background: #30363d; margin: 0 0.5rem; }
.step-line.done { background: #238636; }

/* Drive restore box */
.gdrive-restore-box {
  background: rgba(255, 255, 255, 0.02); border: 1px solid #30363d; border-radius: 12px; padding: 1rem;
}
.gdrive-restore-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.gdrive-title { font-weight: 700; font-size: 0.9rem; }
.btn-refresh-drive { background: none; border: 1px solid #30363d; color: #58a6ff; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; }
.drive-file-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto; }
.drive-file-card {
  display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.04); border: 1px solid #30363d; border-radius: 8px; cursor: pointer;
}
.drive-file-actions { display: flex; align-items: center; gap: 0.5rem; }
.btn-download-drive {
  background: rgba(255, 255, 255, 0.08); border: 1px solid #30363d; color: #f0f6fc;
  padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  font-size: 0.775rem;
}
.btn-download-drive:hover { background: rgba(255, 255, 255, 0.15); border-color: #58a6ff; color: #58a6ff; }
.btn-restore-drive { background: #1a73e8; color: #fff; border: none; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.775rem; transition: background 0.2s; }
.btn-restore-drive:hover { background: #1557b0; }

.divider-text {
  text-align: center; border-bottom: 1px solid #30363d; line-height: 0.1em; margin: 1.5rem 0 1rem 0;
}
.divider-text span { background: #161b22; padding: 0 10px; color: #8b949e; font-size: 0.75rem; font-weight: 700; }

.drop-zone {
  border: 2px dashed #30363d; border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s;
}
.drop-zone.drag-over, .drop-zone:hover { border-color: #58a6ff; background: rgba(56, 139, 253, 0.05); }
.drop-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.drop-link { color: #58a6ff; font-weight: 600; }
.drop-hint { font-size: 0.75rem; color: #8b949e; }

/* Preview Table */
.preview-table-wrap {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: 10px;
  border: 1px solid #30363d;
}
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.preview-table th {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.6rem 0.8rem;
  text-align: left;
  color: #8b949e;
  border-bottom: 1px solid #30363d;
}
.preview-table td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.more-rows {
  text-align: center;
  color: #8b949e;
  font-style: italic;
}

/* Matches List */
.matching-header { margin-bottom: 1rem; }
.matching-progress { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
.progress-bar { flex: 1; height: 8px; background: #30363d; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #58a6ff; transition: width 0.3s; }
.progress-label { font-size: 0.8rem; font-weight: 700; color: #8b949e; }

.matches-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 45vh; overflow-y: auto; padding-right: 0.25rem; }
.match-row {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02); border: 1px solid #30363d; border-radius: 10px;
}
.match-row.matched { border-color: rgba(35, 134, 54, 0.4); }
.match-row.ambiguous { border-color: rgba(210, 153, 34, 0.4); }
.match-row.not_found { border-color: rgba(248, 81, 73, 0.4); }

.match-status-dot { font-size: 1rem; flex-shrink: 0; }
.match-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.match-query { font-weight: 700; font-size: 0.9rem; }
.match-result { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #58a6ff; }
.match-cover { width: 22px; height: 30px; object-fit: cover; border-radius: 3px; }
.match-name { font-weight: 600; }
.match-year { color: #8b949e; font-size: 0.75rem; }
.match-not-found { font-size: 0.775rem; color: #f85149; }

.match-controls { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.match-select {
  background: #0d1117; border: 1px solid #30363d; color: #f0f6fc; padding: 0.4rem 0.6rem;
  border-radius: 6px; font-size: 0.8rem; max-width: 200px;
}
.retry-row { display: flex; align-items: center; gap: 0.35rem; }
.retry-input {
  background: #0d1117; border: 1px solid #30363d; color: #f0f6fc; padding: 0.35rem 0.5rem;
  border-radius: 6px; font-size: 0.8rem; width: 140px;
}
.btn-retry { background: #58a6ff; color: #0d1117; border: none; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
.btn-cancel-retry { background: none; border: 1px solid #30363d; color: #8b949e; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }

.skip-label { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #8b949e; cursor: pointer; }

/* Matching summary & actions */
.matching-actions { border-top: 1px solid #30363d; padding-top: 1rem; margin-top: 0.5rem; }
.matching-summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.8rem; }
.s-green { color: #3fb950; font-weight: 600; }
.s-yellow { color: #d29922; font-weight: 600; }
.s-red { color: #f85149; font-weight: 600; }
.s-skip { color: #8b949e; }

/* Confirm step */
.confirm-summary { display: flex; gap: 1rem; margin-bottom: 1rem; }
.confirm-stat {
  flex: 1; display: flex; flex-direction: column; padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.02); border-radius: 12px; border: 1px solid #30363d;
}
.confirm-stat.primary { border-color: #58a6ff; }
.confirm-stat.warning { border-color: rgba(210, 153, 34, 0.4); background: rgba(210, 153, 34, 0.05); }
.confirm-stat.warning .confirm-number { color: #d29922; }
.confirm-number { font-size: 1.6rem; font-weight: 800; color: #58a6ff; }
.confirm-stat.muted .confirm-number { color: #8b949e; }
.confirm-label { font-size: 0.75rem; color: #8b949e; margin-top: 0.1rem; }

/* Conflict Box */
.conflict-box {
  background: rgba(210, 153, 34, 0.04); border: 1px solid rgba(210, 153, 34, 0.3);
  border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
}
.conflict-header { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
.conflict-title-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
.conflict-title { font-size: 0.9rem; font-weight: 700; color: #d29922; }
.btn-clear-lib {
  padding: 0.35rem 0.75rem; border-radius: 8px; border: 1px solid #f85149; background: rgba(248, 81, 73, 0.1);
  color: #f85149; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-clear-lib:hover:not(:disabled) { background: #f85149; color: #fff; }
.conflict-desc { font-size: 0.75rem; color: #8b949e; }

.conflict-bulk-actions {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2); border-radius: 10px; margin-bottom: 1rem; border: 1px solid #30363d;
}
.bulk-label { font-size: 0.8rem; font-weight: 600; color: #c9d1d9; }
.bulk-buttons { display: flex; gap: 0.5rem; }
.bulk-btn {
  padding: 0.375rem 0.75rem; border-radius: 8px; border: 1px solid #30363d; background: #0d1117;
  color: #8b949e; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.bulk-btn.active { background: #58a6ff; border-color: #58a6ff; color: #0d1117; }

.conflict-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 25vh; overflow-y: auto; }
.conflict-item {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.6rem 0.75rem;
  background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);
}
.conflict-game-info { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.conflict-cover { width: 24px; height: 32px; object-fit: cover; border-radius: 3px; flex-shrink: 0; }
.conflict-name { font-size: 0.8rem; font-weight: 600; color: #f0f6fc; }
.conflict-platform { font-size: 0.75rem; color: #8b949e; margin-left: 0.3rem; }
.conflict-item-action { display: flex; gap: 0.375rem; flex-shrink: 0; }
.action-chip {
  padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid #30363d; background: none;
  color: #8b949e; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.action-chip.active { background: #58a6ff; border-color: #58a6ff; color: #0d1117; }
.action-chip.danger.active { background: #f85149; border-color: #f85149; color: #fff; }

/* Diff Summary Card */
.diff-summary-card {
  background: rgba(56, 139, 253, 0.08); border: 1px solid rgba(56, 139, 253, 0.3); border-radius: 12px; padding: 1rem; margin-top: 1rem;
}
.diff-title { font-weight: 700; font-size: 0.875rem; margin-bottom: 0.75rem; color: #58a6ff; }
.diff-stats-grid { display: flex; gap: 1rem; justify-content: space-around; text-align: center; }
.diff-stat-item { flex: 1; padding: 0.5rem; border-radius: 8px; background: rgba(0, 0, 0, 0.2); }
.diff-num { display: block; font-size: 1.2rem; font-weight: 800; }
.diff-stat-item.add .diff-num { color: #3fb950; }
.diff-stat-item.update .diff-num { color: #d29922; }
.diff-stat-item.same .diff-num { color: #8b949e; }
.diff-label { font-size: 0.75rem; color: #8b949e; }

/* JSON Restore Mode Selector */
.json-restore-mode-box { display: flex; flex-direction: column; gap: 1rem; }
.mode-options { display: flex; flex-direction: column; gap: 0.75rem; }
.mode-card {
  display: flex; gap: 1rem; padding: 1rem; border: 1px solid #30363d; border-radius: 10px; cursor: pointer; transition: all 0.2s;
}
.mode-card.active { border-color: #58a6ff; background: rgba(56, 139, 253, 0.06); }
.mode-card.danger-mode.active { border-color: #f85149; background: rgba(248, 81, 73, 0.08); }
.overwrite-warning-box {
  background: rgba(248, 81, 73, 0.15); border: 1px solid rgba(248, 81, 73, 0.4); border-radius: 8px; padding: 0.8rem; font-size: 0.825rem; color: #ff7b72;
}

/* Import Result */
.import-result { text-align: center; padding: 2rem 1rem; }
.result-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.import-result h3 { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.75rem 0; }
.result-stats { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; font-size: 0.9rem; }
.result-stats p { margin: 0; color: #c9d1d9; }
.result-note { font-size: 0.8rem; color: #8b949e !important; }

.btn-next {
  width: 100%; background: #238636; color: #fff; border: none; padding: 0.8rem; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.95rem; margin-top: 1rem;
}
.btn-next:hover { background: #2ea043; }
.btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-next.big-btn { font-size: 1.05rem; padding: 1rem; }
.btn-back { background: none; border: none; color: #8b949e; cursor: pointer; padding: 0.5rem; text-align: center; }
.btn-back:hover { color: #f0f6fc; }

/* Google Drive Settings Tab */
.gdrive-banner-hero { display: flex; gap: 1rem; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 1.2rem; border-radius: 12px; border: 1px solid #30363d; }
.hero-icon { font-size: 2.2rem; }
.hero-text h3 { margin: 0; font-size: 1.1rem; }
.hero-text p { margin: 0.2rem 0 0 0; font-size: 0.8rem; color: #8b949e; }
.gdrive-settings-card { border: 1px solid #30363d; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.setting-row { display: flex; justify-content: space-between; align-items: center; }
.setting-row.border-top { border-top: 1px solid #30363d; padding-top: 1rem; }
.setting-sub { font-size: 0.775rem; color: #8b949e; margin: 0.2rem 0 0 0; }
.status-online { color: #3fb950; font-weight: 600; }
.status-offline { color: #8b949e; }
.btn-connect { background: #1a73e8; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-disconnect { background: none; border: 1px solid #f85149; color: #f85149; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; }
.gdrive-actions-row { display: flex; flex-direction: column; gap: 0.75rem; }
.btn-action-primary { background: #1a73e8; color: #fff; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 700; cursor: pointer; text-align: center; }
.btn-action-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid #30363d; color: #f0f6fc; padding: 0.75rem; border-radius: 10px; font-weight: 600; cursor: pointer; text-align: center; }

/* Toggle Switch */
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background-color: #30363d; border-radius: 34px; transition: .3s; }
.toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; }
input:checked + .toggle-slider { background-color: #238636; }
input:checked + .toggle-slider:before { transform: translateX(20px); }

.error-banner { background: rgba(248, 81, 73, 0.15); color: #ff7b72; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-top: 0.5rem; }
.rot-badge { background: rgba(56, 139, 253, 0.15); color: #58a6ff; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }

.spinner { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.ie-fade-enter-active, .ie-fade-leave-active { transition: opacity 0.2s ease; }
.ie-fade-enter-from, .ie-fade-leave-to { opacity: 0; }

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
