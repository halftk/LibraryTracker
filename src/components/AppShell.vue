<template>
  <div class="app-shell">

    <!-- ── ESTADO: Cargando auth ──────────────────────────────── -->
    <div v-if="authLoading" class="auth-loading">
      <div class="loading-spinner"></div>
      <p>Iniciando sesión...</p>
    </div>

    <!-- ── ESTADO: Sin sesión → Pantalla de bienvenida ──────── -->
    <div v-else-if="!user" class="landing">
      <div class="landing-bg"></div>

      <div class="landing-content">
        <!-- Logo -->
        <div class="landing-logo">
          <span class="logo-icon">🎮</span>
          <span class="logo-text">LibraryTracker</span>
        </div>

        <h1 class="landing-title">
          Tu biblioteca de<br/>
          <span class="landing-gradient">videojuegos</span>
        </h1>
        <p class="landing-subtitle">
          Busca, organiza y lleva el control de todos los juegos que has jugado,<br class="br-desktop"/>
          estás jugando o quieres jugar. Sincronizado en la nube.
        </p>

        <!-- Auth Card -->
        <div class="auth-card">
          <!-- Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab" :class="{ active: isLogin }" @click="isLogin = true; errorMsg = ''; registrationSuccess = false">
              Iniciar Sesión
            </button>
            <button class="auth-tab" :class="{ active: !isLogin }" @click="isLogin = false; errorMsg = ''; registrationSuccess = false">
              Registrarse
            </button>
          </div>

          <!-- Success screen tras registro -->
          <div v-if="registrationSuccess" class="reg-success">
            <div class="reg-success-icon">✉️</div>
            <h3>¡Revisa tu email!</h3>
            <p>Hemos enviado un enlace de confirmación a<br/><strong>{{ form.email }}</strong></p>
            <button class="btn-primary full-btn" @click="isLogin = true; registrationSuccess = false">
              Ir a Iniciar Sesión
            </button>
          </div>

          <!-- Formulario -->
          <form v-else @submit.prevent="handleSubmit" class="auth-form">
            <div v-if="!isLogin" class="form-group">
              <label class="form-label">Nombre de usuario</label>
              <input v-model="form.username" type="text" class="input-field" placeholder="ej. GamerPro" required autocomplete="username"/>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="input-field" placeholder="tu@email.com" required autocomplete="email"/>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input v-model="form.password" type="password" class="input-field" placeholder="••••••••" required minlength="6" autocomplete="current-password"/>
            </div>
            <div v-if="errorMsg" class="auth-error">⚠️ {{ errorMsg }}</div>
            <button type="submit" class="btn-primary full-btn" :disabled="loading">
              {{ loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta') }}
            </button>
          </form>
        </div>

        <p class="landing-footer">
          LibraryTracker &copy; {{ new Date().getFullYear() }} — Powered by IGDB
        </p>
      </div>
    </div>

    <!-- ── ESTADO: Con sesión → App completa ────────────────── -->
    <template v-else>
      <!-- Hero + Search -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            Tu biblioteca de
            <span class="hero-gradient">videojuegos</span>
          </h1>
          <p class="hero-subtitle">
            Busca, organiza y lleva el control de todos los juegos que has jugado, estás jugando o quieres jugar.
          </p>
        </div>
        <div class="search-wrapper">
          <GameSearch @game-added="refreshAll" />
        </div>
      </section>

      <div class="divider"></div>

      <!-- Stats -->
      <section class="section">
        <StatsDashboard ref="statsRef" />
      </section>

      <div class="divider"></div>

      <!-- Library -->
      <section class="section">
        <h2 class="section-title"><span>📚</span> Mi Biblioteca</h2>
        <LibraryGrid ref="gridRef" />
      </section>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import GameSearch from './GameSearch.vue';
import LibraryGrid from './LibraryGrid.vue';
import StatsDashboard from './StatsDashboard.vue';

const user = ref<User | null>(null);
const authLoading = ref(true);
const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref('');
const registrationSuccess = ref(false);

const gridRef = ref<any>(null);
const statsRef = ref<any>(null);

const form = ref({ username: '', email: '', password: '' });

async function handleSubmit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    if (isLogin.value) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password,
      });
      if (error) throw error;
      user.value = data.user;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
        options: { data: { username: form.value.username } },
      });
      if (error) throw error;
      if (data.session) {
        user.value = data.user;
      } else {
        registrationSuccess.value = true;
      }
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Ocurrió un error. Intenta de nuevo.';
  } finally {
    loading.value = false;
  }
}

function refreshAll() {
  gridRef.value?.refresh();
  statsRef.value?.refresh();
}

onMounted(async () => {
  const { data } = await supabase.auth.getUser();
  user.value = data.user;
  authLoading.value = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
    authLoading.value = false;
  });
});

// Ocultar el header del layout cuando no hay sesión
watchEffect(() => {
  if (!authLoading.value && !user.value) {
    document.body.classList.add('hide-header');
  } else {
    document.body.classList.remove('hide-header');
  }
});
</script>

<style scoped>
.app-shell {
  width: 100%;
}

/* ── Loading ──────────────────────────────────────── */
.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1rem;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Landing / Login ──────────────────────────────── */
.landing {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.landing-bg {
  position: absolute;
  inset: -50%;
  background: radial-gradient(ellipse at 60% 40%, rgba(124, 58, 237, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.landing-content {
  position: relative;
  text-align: center;
  width: 100%;
  max-width: 480px;
  padding: 2rem 1rem;
  animation: fade-in 0.5s ease-out;
}

.landing-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.landing-title {
  font-size: 2.25rem;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.landing-gradient {
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.landing-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: 2rem;
}

.br-desktop {
  display: none;
}
@media (min-width: 640px) {
  .br-desktop { display: block; }
}

/* ── Auth Card ──────────────────────────────────────── */
.auth-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  text-align: left;
  margin-bottom: 1.5rem;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
  gap: 0;
}

.auth-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.auth-tab.active {
  color: var(--color-accent-primary);
  border-bottom-color: var(--color-accent-primary);
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
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.full-btn {
  width: 100%;
  margin-top: 0.25rem;
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

/* ── Success post-registro ────────────────────────── */
.reg-success {
  text-align: center;
  padding: 1rem 0;
}

.reg-success-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  animation: bounce-in 0.4s ease-out;
}

.reg-success h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.reg-success p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 0.25rem;
}

.reg-success strong {
  color: var(--color-accent-cyan);
}

@keyframes bounce-in {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.landing-footer {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── App (logged in) ────────────────────────────── */
.hero {
  text-align: center;
  padding: 3rem 0 2rem;
  animation: fade-in 0.6s ease-out;
}

.hero-content {
  max-width: 640px;
  margin: 0 auto 2rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.hero-gradient {
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.6;
}

.search-wrapper {
  max-width: 640px;
  margin: 0 auto;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  margin: 2rem 0;
}

.section {
  padding: 1rem 0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .hero-title { font-size: 1.75rem; }
  .landing-title { font-size: 1.75rem; }
}
</style>
