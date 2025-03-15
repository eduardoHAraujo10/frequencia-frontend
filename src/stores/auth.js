import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: !!localStorage.getItem('token'),
    userRole: localStorage.getItem('userRole'),
    userName: localStorage.getItem('userName'),
    userEmail: localStorage.getItem('userEmail')
  }),

  actions: {
    async login(userData) {
      // Primeiro atualiza o localStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userRole', userData.tipo);
      localStorage.setItem('userName', userData.nome);
      localStorage.setItem('userEmail', userData.email);

      // Depois atualiza o estado reativo
      this.isAuthenticated = true;
      this.userRole = userData.tipo;
      this.userName = userData.nome;
      this.userEmail = userData.email;

      // Retorna uma Promise resolvida para garantir que tudo foi atualizado
      return Promise.resolve();
    },

    async logout() {
      // Primeiro limpa o localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');

      // Depois atualiza o estado reativo
      this.isAuthenticated = false;
      this.userRole = null;
      this.userName = null;
      this.userEmail = null;

      // Retorna uma Promise resolvida para garantir que tudo foi atualizado
      return Promise.resolve();
    }
  },

  getters: {
    getToken: () => localStorage.getItem('token'),
    getUserRole: (state) => state.userRole,
    getUserName: (state) => state.userName,
    getUserEmail: (state) => state.userEmail
  }
}); 