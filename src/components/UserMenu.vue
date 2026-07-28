<template>
  <div class="auth-menu">
    <!-- Botón circular de idioma -->
    <button
      class="lang-btn"
      @click="toggleLang"
      :title="currentLang === 'es' ? 'Idioma: Español (Cambiar a English)' : 'Language: English (Switch to Español)'"
    >
      <span class="flag-icon">
        <!-- Bandera España -->
        <svg v-if="currentLang === 'es'" class="flag-svg" viewBox="0 0 36 36">
          <path fill="#C60B1E" d="M36 18c0-4.144-1.401-7.962-3.755-11.021H3.755C1.401 10.038 0 13.856 0 18s1.401 7.962 3.755 11.021h28.49C34.599 25.962 36 22.144 36 18z"/>
          <path fill="#FFC400" d="M.404 12.521h35.192c.621 1.705.964 3.541.964 5.479 0 1.938-.343 3.774-.964 5.479H.404C.143 21.774 0 19.938 0 18c0-1.938.143-3.774.404-5.479z"/>
          <path fill="#C60B1E" d="M32.245 6.979C28.847 2.697 23.743 0 18 0S7.153 2.697 3.755 6.979h28.49zM3.755 29.021C7.153 33.303 12.257 36 18 36s10.847-2.697 14.245-6.979H3.755z"/>
        </svg>

        <!-- Bandera Reino Unido -->
        <svg v-else class="flag-svg" viewBox="0 0 36 36">
          <path fill="#00247D" d="M18 36c9.941 0 18-8.059 18-18S27.941 0 18 0 0 8.059 0 18s8.059 18 18 18z"/>
          <path fill="#FFF" d="M22.062 13.938l12.441-8.295A17.915 17.915 0 0030.344 1.5L18 9.729 5.656 1.5A17.915 17.915 0 001.497 5.643l12.441 8.295L1.5 22.233a17.915 17.915 0 004.156 4.143L18 18.146l12.344 8.23a17.915 17.915 0 004.156-4.143l-12.438-8.295z"/>
          <path fill="#CF142B" d="M35.79 7.026L23.473 15.238h2.825l10.155-6.77A17.906 17.906 0 0035.79 7.026zM26.298 20.762l10.155 6.77c.414-.492.793-1.009 1.137-1.547l-12.417-8.277h-1.125v3.054zM9.702 15.238L-.453 8.468A17.906 17.906 0 00-1.59 10.015l12.417 8.277h1.125v-3.054zm3.007 5.524L2.554 27.532a17.906 17.906 0 002.825 1.442l12.316-8.212h-2.986z"/>
          <path fill="#FFF" d="M14 0v36h8V0h-8zM0 14v8h36v-8H0z"/>
          <path fill="#CF142B" d="M15 0v36h6V0h-6zM0 15v6h36v-6H0z"/>
        </svg>
      </span>
    </button>

    <!-- User is logged in -->
    <div v-if="user" class="user-info" ref="menuRef">
      <!-- Trigger: avatar + nombre -->
      <button class="user-trigger" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
        <div class="user-avatar">{{ userInitial }}</div>
        <span class="user-name">{{ userName }}</span>
        <svg class="chevron" :class="{ rotated: menuOpen }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <!-- Dropdown menu -->
      <Transition name="dropdown">
        <div v-if="menuOpen" class="user-dropdown">
          <!-- Header del menú -->
          <div class="dropdown-header">
            <div class="dropdown-avatar">{{ userInitial }}</div>
            <div class="dropdown-user-info">
              <span class="dropdown-name">{{ userName }}</span>
              <span class="dropdown-email">{{ user.email }}</span>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <!-- Acciones -->
          <button class="dropdown-item" @click="menuOpen = false; showImportExport = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Importar / Exportar datos</span>
          </button>

          <button class="dropdown-item" @click="handleInstallApp">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>Instalar App en tu dispositivo</span>
          </button>

          <div class="dropdown-divider"></div>

          <button class="dropdown-item danger" @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- User is not logged in -->
    <div v-else class="auth-buttons">
      <button class="btn-login" @click="showModal = true">
        <span>👤</span> Iniciar Sesión / Registrarse
      </button>
    </div>

    <!-- Auth Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-card">
            <button class="close-btn" @click="showModal = false">✕</button>

            <!-- Estado exitoso de registro -->
            <div v-if="registrationSuccess" class="registration-success">
              <div class="success-icon">✉️</div>
              <h3 class="success-title">¡Revisa tu email!</h3>
              <p class="success-body">
                Hemos enviado un enlace de confirmación a<br/>
                <strong>{{ form.email }}</strong>
              </p>
              <button class="btn-primary" style="width:100%; margin-top:1.5rem;" @click="isLogin = true; registrationSuccess = false; errorMsg = ''">
                Ir a Iniciar Sesión
              </button>
            </div>

            <!-- Formulario de login / registro -->
            <template v-else>
              <h2 class="auth-title">
                {{ isLogin ? 'Bienvenido de nuevo' : 'Crear Cuenta' }}
              </h2>
              <p class="auth-subtitle">
                {{ isLogin ? 'Inicia sesión para guardar tu biblioteca en la nube.' : 'Regístrate para mantener tu biblioteca sincronizada.' }}
              </p>

              <form @submit.prevent="handleSubmit" class="auth-form">
                <div v-if="!isLogin" class="form-group">
                  <label class="form-label">Nombre de usuario</label>
                  <input v-model="form.username" type="text" class="input-field" placeholder="ej. GamerPro" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input v-model="form.email" type="email" class="input-field" placeholder="tu@email.com" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Contraseña</label>
                  <input v-model="form.password" type="password" class="input-field" placeholder="••••••••" required minlength="6" />
                </div>

                <div v-if="errorMsg" class="auth-error">
                  ⚠️ {{ errorMsg }}
                </div>

                <button type="submit" class="btn-primary auth-submit" :disabled="loading">
                  {{ loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse') }}
                </button>
              </form>

              <div class="auth-toggle">
                <span>{{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}</span>
                <button class="toggle-btn" @click="isLogin = !isLogin; errorMsg = ''">
                  {{ isLogin ? 'Regístrate aquí' : 'Inicia sesión' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>

    </Teleport>

    <!-- Import/Export Modal -->
    <ImportExportModal
      v-if="showImportExport"
      @close="showImportExport = false"
      @done="showImportExport = false; $emit('library-updated')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import ImportExportModal from './ImportExportModal.vue';

const user = ref<User | null>(null);
const showModal = ref(false);
const showImportExport = ref(false);
const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref('');
const registrationSuccess = ref(false);
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const currentLang = ref<'es' | 'en'>('es');

function initLang() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_lang') as 'es' | 'en';
    if (saved === 'es' || saved === 'en') {
      currentLang.value = saved;
    }
  }
}

function toggleLang() {
  currentLang.value = currentLang.value === 'es' ? 'en' : 'es';
  localStorage.setItem('app_lang', currentLang.value);
  window.dispatchEvent(new CustomEvent('lang-changed', { detail: currentLang.value }));
}

const form = ref({
  username: '',
  email: '',
  password: '',
});

const userName = computed(() => {
  if (!user.value) return '';
  return user.value.user_metadata?.username || user.value.email?.split('@')[0] || 'Usuario';
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

async function checkUser() {
  const { data } = await supabase.auth.getUser();
  user.value = data.user;
}

async function handleSubmit() {
  errorMsg.value = '';
  registrationSuccess.value = false;
  loading.value = true;


  try {
    if (isLogin.value) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password,
      });

      if (error) throw error;
      user.value = data.user;
      showModal.value = false;
      window.location.reload(); // Recargar para sincronizar la biblioteca
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
        options: {
          data: {
            username: form.value.username,
          },
        },
      });

      if (error) throw error;
      
      if (data.session) {
        user.value = data.user;
        showModal.value = false;
        window.location.reload();
      } else {
        registrationSuccess.value = true;
      }
    }
  } catch (err: any) {
    console.error('Auth error:', err);
    errorMsg.value = err.message || 'Ocurrió un error al procesar la solicitud.';
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  menuOpen.value = false;
  await supabase.auth.signOut();
  user.value = null;
  window.location.reload();
}

// Cerrar el menú al clicar fuera
function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false;
  }
}

const deferredPrompt = ref<any>(null);

function handleInstallApp() {
  menuOpen.value = false;
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.then(() => {
      deferredPrompt.value = null;
    });
  } else {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      alert('📱 Para instalar en tu iPhone / iPad:\n\n1. Toca el botón "Compartir" de Safari (icono de la flecha ⬆️ en la barra inferior).\n2. Selecciona "Añadir a la pantalla de inicio" 📲');
    } else {
      alert('📱 Para instalar esta aplicación:\n\nAbre el menú de tu navegador (3 puntos arriba a la derecha) y pulsa en "Instalar aplicación" o "Añadir a la pantalla de inicio".');
    }
  }
}

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e;
}

onMounted(() => {
  initLang();
  checkUser();
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});
</script>

<style scoped>
.auth-menu {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

/* ── Botón circular de idioma ─────────────── */
.lang-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  user-select: none;
}

.lang-btn:hover {
  border-color: var(--color-accent-primary);
  transform: scale(1.08);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 12px rgba(109, 40, 217, 0.3);
}

.flag-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.flag-svg {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
}

/* ── Trigger button ───────────────────────── */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.375rem;
  border-radius: 10px;
  transition: background 0.2s ease;
  font-family: var(--font-family-base);
}

.user-trigger:hover {
  background: var(--color-bg-card);
}

.chevron {
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.chevron.rotated {
  transform: rotate(180deg);
}

/* ── Dropdown card ────────────────────────── */
.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 220px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  overflow: hidden;
  z-index: 100;
}

/* Header del dropdown */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.dropdown-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Separador */
.dropdown-divider {
  height: 1px;
  background: var(--color-border);
}

/* Items del menú */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  font-family: var(--font-family-base);
}

.dropdown-item:hover {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.dropdown-item.danger:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--color-accent-rose);
}

/* Animación dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}


.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .user-name {
    display: none;
  }
}

.btn-logout {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.btn-logout:hover {
  color: var(--color-accent-rose);
}

.btn-login {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.btn-login:hover {
  border-color: var(--color-accent-primary);
  background: var(--color-bg-card-hover);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.modal-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
}

.auth-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.auth-submit {
  width: 100%;
  margin-top: 0.5rem;
  height: 2.75rem;
}

.auth-error {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: var(--color-accent-rose);
  padding: 0.625rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.auth-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--color-accent-emerald);
  padding: 0.625rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.auth-toggle {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  justify-content: center;
  gap: 0.375rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--color-accent-cyan);
  font-weight: 600;
  cursor: pointer;
}

.toggle-btn:hover {
  text-decoration: underline;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.registration-success {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  animation: bounce-in 0.5s ease-out;
}

.success-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.success-body {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.success-body strong {
  color: var(--color-accent-cyan);
}

@keyframes bounce-in {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
