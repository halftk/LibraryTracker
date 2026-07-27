<template>
  <div class="auth-menu">
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
          <button class="dropdown-item" @click="menuOpen = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Importar / Exportar datos</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const user = ref<User | null>(null);
const showModal = ref(false);
const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref('');
const registrationSuccess = ref(false);
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

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

onMounted(() => {
  checkUser();
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.auth-menu {
  display: flex;
  align-items: center;
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
