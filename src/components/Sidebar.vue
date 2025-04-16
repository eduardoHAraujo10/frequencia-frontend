<template>
  <div v-if="authStore.isAuthenticated" class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <h3 v-if="!isCollapsed">
        <img src="@/assets/unifil.png" alt="Logo UNIFIL" class="logo-unifil" />
      </h3>
      <va-button @click="toggleSidebar" flat color="white">
        <va-icon :name="isCollapsed ? 'mdi-menu-unfold' : 'mdi-menu-fold'" />
      </va-button>
    </div>

    <div class="user-info" v-if="!isCollapsed">
      <va-avatar :src="userAvatar" size="large" class="clickable" @click="router.push('/perfil')" />
      <div class="user-details">
        <p class="user-name">{{ authStore.userName }}</p>
        <va-badge>
          {{ authStore.userRole === 'coordenador' ? 'Coordenador' : 'Aluno' }}
        </va-badge>
      </div>
    </div>

    <div class="menu-container">
      <div v-for="(item, index) in menuItems" :key="index" class="menu-item">
        <va-button 
          block 
          flat 
          @click="item.command"
          :class="{ 'active': isCurrentRoute(item.route) }"
        >
          <va-icon :name="item.icon" />
          <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
        </va-button>
      </div>
    </div>

    <div class="sidebar-footer">
      <va-button @click="handleLogout" block flat>
        <va-icon name="mdi-logout" />
        <span v-if="!isCollapsed">Sair do Sistema</span>
      </va-button>
    </div>
  </div>
  <div v-if="authStore.isAuthenticated" class="sidebar-overlay" :class="{ 'show': !isCollapsed && isMobile }" @click="closeSidebar"></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { VaButton, VaAvatar, VaBadge, VaIcon } from 'vuestic-ui';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isCollapsed = ref(false);
const isMobile = ref(false);
const avatarUrl = ref('');

const userInitials = computed(() => {
  return authStore.userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '';
});

const userAvatar = computed(() => {
  return avatarUrl.value || `https://ui-avatars.com/api/?name=${userInitials.value}&background=6979F8&color=fff`;
});

const loadUserAvatar = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/v1/usuarios/perfil', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data.status === 'success' && response.data.data.usuario.avatar_url) {
      const baseUrl = 'http://localhost:8000';
      avatarUrl.value = `${baseUrl}${response.data.data.usuario.avatar_url}`;
    }
  } catch (error) {
    console.error('Erro ao carregar avatar:', error);
  }
};

const menuItems = computed(() => {
  const items = [];

  if (authStore.userRole === 'coordenador') {
    items.push(
      {
        label: 'Dashboard',
        icon: 'mdi-view-dashboard',
        command: () => router.push('/dashboard-coordenador'),
        route: '/dashboard-coordenador'
      },
      {
        label: 'Gerenciar Alunos',
        icon: 'mdi-account-group',
        command: () => router.push('/alunos'),
        route: '/alunos'
      },
      {
        label: 'Controle de Frequência',
        icon: 'mdi-calendar-check',
        command: () => router.push('/frequencias'),
        route: '/frequencias'
      },
      {
        label: 'Solicitações de alteração',
        icon: 'mdi-clock-outline',
        command: () => router.push('/gerenciamento-pontos'),
        route: '/gerenciamento-pontos'
      },
      {
        label: 'Relatórios',
        icon: 'mdi-file-chart',
        command: () => router.push('/relatorios'),
        route: '/relatorios'
      }
    );
  } else if (authStore.userRole === 'aluno') {
    items.push(
      {
        label: 'Registro de Ponto',
        icon: 'mdi-clock-check',
        command: () => router.push('/registro-ponto'),
        route: '/registro-ponto'
      },
      {
        label: 'Histórico de Presença',
        icon: 'mdi-history',
        command: () => router.push('/historico-presenca'),
        route: '/historico-presenca'
      },
      {
        label: 'Histórico de Alertas',
        icon: 'mdi-bell',
        command: () => router.push('/historico-alertas'),
        route: '/historico-alertas'
      }
    );
  }

  return items;
});

const isCurrentRoute = (routePath) => {
  return route.path === routePath;
};

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value) {
    isCollapsed.value = true;
  }
};

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const closeSidebar = () => {
  if (isMobile.value) {
    isCollapsed.value = true;
  }
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    await router.push('/login');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('avatar-updated', ((event) => {
    avatarUrl.value = event.detail.avatarUrl;
  }));
  loadUserAvatar();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('avatar-updated', ((event) => {
    avatarUrl.value = event.detail.avatarUrl;
  }));
});
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #FF6B00 0%, #FF8C00 100%);
  color: white;
  position: fixed;
  left: 0;
  top: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 80px;
  background: rgba(255, 255, 255, 0.05);
  gap: 1rem;
  position: relative;
}

.sidebar-header h3 {
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 40px;
}

.logo-unifil {
  width: auto;
  height: 40px;
  object-fit: contain;
}

.user-info {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
}

.user-details {
  text-align: center;
  width: 100%;
}

.user-name {
  margin: 0.5rem 0;
  font-weight: 500;
  color: white;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.menu-container {
  flex: 1;
  padding: 1.25rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  overflow-y: auto;
}

.menu-item {
  width: 100%;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.menu-item :deep(.va-button) {
  height: 3.25rem;
  width: 100%;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
  border: none;
}

.menu-item :deep(.va-button:hover) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.menu-item :deep(.va-button__content) {
  justify-content: flex-start;
  gap: 1rem;
  padding: 0 1rem;
}

.menu-item :deep(.va-icon) {
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.menu-item:hover :deep(.va-icon) {
  transform: scale(1.1);
}

.menu-label {
  flex-grow: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-footer :deep(.va-button) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
}

.sidebar-footer :deep(.va-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-collapsed .menu-item :deep(.va-button__content) {
  justify-content: center;
}

.sidebar-collapsed .menu-label {
  display: none;
}

:deep(.va-badge) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.35rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .sidebar-collapsed {
    width: 60px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 100%;
    max-width: 280px;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
    width: 60px;
  }

  .sidebar.show-mobile {
    transform: translateX(0);
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    backdrop-filter: blur(4px);
    display: none;
  }

  .sidebar-overlay.show {
    display: block;
  }

  .sidebar-header {
    padding: 1rem;
    min-height: 60px;
  }

  .user-info {
    padding: 1rem;
  }

  .menu-container {
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    max-width: 100%;
    width: 100%;
  }

  .sidebar-header h3 {
    font-size: 1rem;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .menu-item :deep(.va-button) {
    height: 3rem;
  }

  .menu-item :deep(.va-icon) {
    font-size: 1.1rem;
  }
}

/* Scrollbar personalizada */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Animações */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.show-mobile {
  animation: slideIn 0.3s ease-out;
}

.menu-item :deep(.va-button.active) {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 500;
  transform: translateX(8px);
  position: relative;
}

.menu-item :deep(.va-button.active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: white;
  border-radius: 0 4px 4px 0;
}

.menu-item :deep(.va-button.active .va-icon) {
  transform: scale(1.1);
}

.menu-item :deep(.va-button.active:hover) {
  background: rgba(255, 255, 255, 1);
  transform: translateX(8px);
}

.sidebar-header :deep(.va-icon) {
  margin-right: 0.5rem;
  font-size: 1.25rem;
}

.user-info :deep(.va-avatar) {
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.user-info:hover :deep(.va-avatar) {
  transform: scale(1.05);
}

.logo-unifil {
  width: 100%;
  max-width: 200px;
  height: auto;
  align-items: center;
}
</style> 