<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <h3 v-if="!isCollapsed">Sistema de Ponto</h3>
      <Button 
        icon="pi pi-bars" 
        @click="toggleSidebar" 
        class="p-button-text p-button-rounded"
        :aria-label="isCollapsed ? 'Expandir menu' : 'Recolher menu'"
      />
    </div>

    <div class="user-info" v-if="!isCollapsed">
      <Avatar :label="userInitials" class="mb-2" size="large" shape="circle" />
      <div class="user-details">
        <p class="user-name">{{ userName }}</p>
        <Tag :value="userRole === 'coordenador' ? 'Coordenador' : 'Aluno'" 
             :severity="userRole === 'coordenador' ? 'success' : 'info'" />
      </div>
    </div>

    <div class="menu-container">
      <div v-for="(item, index) in menuItems" :key="index" class="menu-item">
        <Button
          :icon="item.icon"
          :label="isCollapsed ? undefined : item.label"
          class="p-button-text w-full justify-content-start"
          @click="item.command"
          :tooltip="isCollapsed ? item.label : undefined"
          tooltipOptions="{ position: 'right' }"
        />
      </div>
    </div>

    <div class="sidebar-footer">
      <Button 
        @click="handleLogout" 
        icon="pi pi-sign-out" 
        :label="isCollapsed ? undefined : 'Sair'"
        class="p-button-danger p-button-text w-full"
        :tooltip="isCollapsed ? 'Sair' : undefined"
        tooltipOptions="{ position: 'right' }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';

const router = useRouter();
const isCollapsed = ref(false);
const userRole = ref(localStorage.getItem('userRole'));
const userName = ref(localStorage.getItem('userName') || 'Usuário');

const userInitials = computed(() => {
  return userName.value
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const menuItems = computed(() => {
  const items = [];

  if (userRole.value === 'coordenador') {
    items.push(
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-line',
        command: () => router.push('/dashboard-coordenador')
      },
      {
        label: 'Gerenciar Alunos',
        icon: 'pi pi-users',
        command: () => router.push('/alunos')
      },
      {
        label: 'Controle de Frequência',
        icon: 'pi pi-calendar',
        command: () => router.push('/frequencias')
      },
      {
        label: 'Gerenciamento de Pontos',
        icon: 'pi pi-clock',
        command: () => router.push('/gerenciamento-pontos')
      },
      {
        label: 'Relatórios',
        icon: 'pi pi-file',
        command: () => router.push('/relatorios')
      }
    );
  } else if (userRole.value === 'aluno') {
    items.push(
      {
        label: 'Registro de Ponto',
        icon: 'pi pi-clock',
        command: () => router.push('/registro-ponto')
      },
      {
        label: 'Histórico de Presença',
        icon: 'pi pi-calendar-check',
        command: () => router.push('/historico-presenca')
      }
    );
  }

  items.push({
    label: 'Meu Perfil',
    icon: 'pi pi-user',
    command: () => router.push('/perfil')
  });

  return items;
});

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const handleLogout = async () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    userRole.value = null;
    userName.value = 'Usuário';
    
    await router.push('/login');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--surface-section);
  color: var(--text-color);
  position: fixed;
  left: 0;
  top: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: var(--card-shadow);
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--surface-border);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.user-info {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.user-details {
  text-align: center;
  width: 100%;
}

.user-name {
  margin: 0.5rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.menu-container {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-item {
  width: 100%;
}

.menu-item :deep(.p-button) {
  height: 3.5rem;
}

.menu-item :deep(.p-button-label) {
  flex-grow: 1;
  text-align: left;
  margin-left: 1rem;
  font-size: 1rem;
}

.menu-item :deep(.p-button-icon) {
  font-size: 1.2rem;
  width: 1.5rem;
}

.menu-item :deep(.p-button.p-button-text:enabled:hover) {
  background: var(--surface-hover);
  color: var(--text-color);
}

.menu-item :deep(.p-button.p-button-text) {
  color: var(--text-color);
  padding: 0.75rem 1.25rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

.sidebar-collapsed .menu-item :deep(.p-button) {
  justify-content: center;
  padding: 0.75rem;
}

.sidebar-collapsed .menu-item :deep(.p-button-icon) {
  font-size: 1.4rem;
  margin: 0;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.show {
    transform: translateX(0);
  }
}
</style> 