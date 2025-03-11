import { createRouter, createWebHistory } from 'vue-router';
import { ref } from 'vue';

export const isLoading = ref(false);

// Importação dos componentes
import Login from './views/auth/Login.vue';
import RegistroPonto from './views/aluno/RegistroPonto.vue';
import HistoricoPresenca from './views/aluno/HistoricoPresenca.vue';
import GerenciarAlunos from './views/coordenador/GerenciarAlunos.vue';
import ControleFrequencia from './views/coordenador/ControleFrequencia.vue';
import Relatorios from './views/coordenador/Relatorios.vue';
import DashboardCoordenador from './views/coordenador/DashboardCoordenador.vue';
import Perfil from './views/common/Perfil.vue';
import DetalhesFrequencia from './views/coordenador/DetalhesFrequencia.vue';
import Register from './views/auth/Register.vue';
import GerenciamentoPontos from './views/coordenador/GerenciamentoPontos.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: 'Cadastro',
      requiresAuth: false
    }
  },
  {
    path: '/registro-ponto',
    name: 'RegistroPonto',
    component: RegistroPonto,
    meta: {
      title: 'Registro de Ponto',
      requiresAuth: true,
      role: 'aluno'
    }
  },
  {
    path: '/historico-presenca',
    name: 'HistoricoPresenca',
    component: HistoricoPresenca,
    meta: {
      title: 'Histórico de Presença',
      requiresAuth: true,
      role: 'aluno'
    }
  },
  {
    path: '/dashboard-coordenador',
    name: 'DashboardCoordenador',
    component: DashboardCoordenador,
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/alunos',
    name: 'GerenciarAlunos',
    component: GerenciarAlunos,
    meta: {
      title: 'Gerenciar Alunos',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/frequencias',
    name: 'ControleFrequencia',
    component: ControleFrequencia,
    meta: {
      title: 'Controle de Frequência',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/relatorios',
    name: 'Relatorios',
    component: Relatorios,
    meta: {
      title: 'Relatórios',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/gerenciamento-pontos',
    name: 'GerenciamentoPontos',
    component: GerenciamentoPontos,
    meta: {
      title: 'Gerenciamento de Pontos',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: Perfil,
    meta: {
      title: 'Meu Perfil',
      requiresAuth: true
    }
  },
  {
    path: '/aluno/:id/frequencia',
    name: 'DetalhesFrequencia',
    component: DetalhesFrequencia,
    meta: {
      title: 'Detalhes de Frequência',
      requiresAuth: true,
      role: 'coordenador'
    }
  },
  {
    path: '/',
    redirect: to => {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'coordenador') {
        return '/dashboard-coordenador';
      } else if (userRole === 'aluno') {
        return '/registro-ponto';
      } else {
        return '/login';
      }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./views/common/NotFound.vue'),
    meta: {
      title: 'Página não encontrada'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  // Iniciar loading
  isLoading.value = true;
  
  // Atualizar título da página
  document.title = `${to.meta.title || 'Sistema de Ponto'} - Sistema de Ponto`;
  
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // Rota requer autenticação
  if (to.meta.requiresAuth) {
    if (!token) {
      isLoading.value = false;
      next('/login');
      return;
    }

    // Rota requer role específica
    if (to.meta.role && to.meta.role !== userRole) {
      isLoading.value = false;
      next(userRole === 'coordenador' ? '/dashboard-coordenador' : '/registro-ponto');
      return;
    }
  }
  // Rota de login com usuário já autenticado
  else if (to.path === '/login' && token) {
    isLoading.value = false;
    next(userRole === 'coordenador' ? '/dashboard-coordenador' : '/registro-ponto');
    return;
  }

  next();
});

router.afterEach(() => {
  isLoading.value = false;
});

export default router;
