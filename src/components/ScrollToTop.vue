<template>
  <Transition name="scroll-top-fade">
    <button
      v-if="visible"
      class="scroll-top-btn"
      @click="scrollToTop"
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const visible = ref(false);

function handleScroll() {
  visible.value = window.scrollY > 250;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.scroll-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-bg-secondary, #1a1a24);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
  color: var(--color-text-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 200;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(109, 40, 217, 0.2);
  backdrop-filter: blur(12px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-top-btn:hover {
  background: var(--color-accent-primary, #6d28d9);
  color: #ffffff;
  border-color: var(--color-accent-cyan, #06b6d4);
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 14px 36px rgba(109, 40, 217, 0.5), 0 0 20px rgba(6, 182, 212, 0.4);
}

.scroll-top-btn:active {
  transform: translateY(0) scale(0.96);
}

/* Animations */
.scroll-top-fade-enter-active,
.scroll-top-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.scroll-top-fade-enter-from,
.scroll-top-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.8);
}

@media (max-width: 640px) {
  .scroll-top-btn {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 42px;
    height: 42px;
  }
}
</style>
