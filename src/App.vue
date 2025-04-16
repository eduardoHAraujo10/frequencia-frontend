<template>
  <div class="app">
    <LoadingOverlay :show="isLoading" />
    
    <Sidebar v-if="isAuthenticated" />
    
    <div class="content" :class="{ 'with-sidebar': isAuthenticated }">
      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="footer" v-if="showFooter">
        <p>&copy; 2024 - Sistema de Controle de Frequência</p>
      </footer>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import LoadingOverlay from './components/LoadingOverlay.vue';
import Sidebar from './components/Sidebar.vue';
import { isLoading } from './router';
import { websocketService } from './services/websocket';

export default {
  name: 'App',
  components: {
    LoadingOverlay,
    Sidebar
  },
  setup() {
    const route = useRoute();

    const isAuthenticated = computed(() => !!localStorage.getItem('token'));
    const showFooter = computed(() => !['login', 'register'].includes(route.name));

    onMounted(() => {
      if (isAuthenticated.value) {
        websocketService.connect();
      }
    });

    onUnmounted(() => {
      websocketService.disconnect();
    });

    return {
      isLoading,
      isAuthenticated,
      showFooter
    };
  }
};
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

:root {
  --primary-color: #FF6B00;
  --secondary-color: #FF9E4F;
  --background-color: #f5f6fa;
  --content-background: #ffffff;
  --text-color: #2B3674;
  --text-secondary: #A3AED0;
  --border-color: #E0E5F2;
  --shadow-color: rgba(112, 144, 176, 0.08);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  position: relative;
  background-color: var(--background-color);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  background-color: var(--background-color);
}

.content.with-sidebar {
  margin-left: 280px;
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background: var(--content-background);
  padding: 1.5rem;
  text-align: center;
  margin-top: auto;
  box-shadow: 0 -4px 12px var(--shadow-color);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .main {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .content.with-sidebar {
    margin-left: 70px;
  }

  .main {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .content.with-sidebar {
    margin-left: 0;
  }

  .main {
    padding: 1rem 0.75rem;
  }
}

/* Utilitários */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  background: var(--content-background);
  border-radius: 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.flex {
  display: flex;
  gap: 1rem;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.text-sm {
  font-size: 0.875rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-bold {
  font-weight: 600;
}

.text-primary {
  color: var(--primary-color);
}

.text-secondary {
  color: var(--text-secondary);
}

.rounded {
  border-radius: 12px;
}

.bg-white {
  background-color: var(--content-background);
}

.shadow {
  box-shadow: 0 4px 12px var(--shadow-color);
}

.p-4 {
  padding: 1rem;
}

.m-4 {
  margin: 1rem;
}
</style>
