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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LoadingOverlay from './components/LoadingOverlay.vue';
import Sidebar from './components/Sidebar.vue';
import { isLoading } from './router';

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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
  display: flex;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.content.with-sidebar {
  margin-left: 250px;
}

.main {
  flex: 1;
  padding: 2rem;
}

.footer {
  background: #f8f9fa;
  padding: 1rem;
  text-align: center;
  margin-top: auto;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .content.with-sidebar {
    margin-left: 60px;
  }
}
</style>
