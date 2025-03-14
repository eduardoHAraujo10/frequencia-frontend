<template>
  <div class="historico-alertas-container">
    <div class="page-header">
      <h2>Histórico de Alertas de Esquecimento</h2>
      <router-link to="/registro-ponto" class="btn-voltar">
        <i class="fas fa-arrow-left"></i>
        Voltar
      </router-link>
    </div>

    <div class="filtros-section">
      <div class="filtro-grupo">
        <label>Status:</label>
        <select v-model="filtroStatus" class="filtro-select">
          <option value="todos">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovado">Aprovados</option>
          <option value="rejeitado">Rejeitados</option>
        </select>
      </div>

      <div class="filtro-grupo">
        <label>Período:</label>
        <div class="periodo-inputs">
          <input 
            type="date" 
            v-model="filtroDataInicio" 
            class="filtro-input"
          >
          <span>até</span>
          <input 
            type="date" 
            v-model="filtroDataFim" 
            class="filtro-input"
          >
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Carregando alertas...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="alertasFiltrados.length === 0" class="no-data">
      <i class="fas fa-bell-slash"></i>
      <p>Nenhum alerta encontrado para os filtros selecionados</p>
    </div>

    <div v-else class="alertas-grid">
      <div v-for="alerta in alertasFiltrados" :key="alerta.id" class="alerta-card">
        <div class="alerta-header">
          <div class="alerta-data">
            <i class="fas fa-calendar"></i>
            {{ formatarData(alerta.data) }}
          </div>
          <div class="alerta-horario">
            <i class="fas fa-clock"></i>
            {{ formatarHora(alerta.horario_previsto) }}
          </div>
          <div class="alerta-tipo">
            <i class="fas fa-sign-in-alt" v-if="alerta.tipo === 'entrada'"></i>
            <i class="fas fa-sign-out-alt" v-else></i>
            {{ alerta.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
          </div>
          <div class="alerta-status" :class="alerta.status">
            {{ traduzirStatus(alerta.status) }}
          </div>
        </div>

        <div class="alerta-body">
          <strong>Justificativa:</strong>
          <p>{{ alerta.justificativa }}</p>
        </div>

        <div v-if="alerta.observacao_coordenador" class="alerta-feedback">
          <strong>Feedback do Coordenador:</strong>
          <p>{{ alerta.observacao_coordenador }}</p>
          <small class="feedback-data">
            Respondido em: {{ formatarDataHora(alerta.data_aprovacao) }}
          </small>
        </div>
      </div>
    </div>

    <div v-if="totalPaginas > 1" class="paginacao">
      <button 
        :disabled="paginaAtual === 1"
        @click="mudarPagina(paginaAtual - 1)"
        class="page-button"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="page-info">Página {{ paginaAtual }} de {{ totalPaginas }}</span>
      <button 
        :disabled="paginaAtual === totalPaginas"
        @click="mudarPagina(paginaAtual + 1)"
        class="page-button"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HistoricoAlertas',
  data() {
    return {
      alertas: [],
      loading: false,
      error: null,
      filtroStatus: 'todos',
      filtroDataInicio: '',
      filtroDataFim: '',
      paginaAtual: 1,
      totalPaginas: 1,
      itensPorPagina: 6
    };
  },
  computed: {
    alertasFiltrados() {
      let alertasFiltrados = [...this.alertas];

      if (this.filtroStatus !== 'todos') {
        alertasFiltrados = alertasFiltrados.filter(alerta => alerta.status === this.filtroStatus);
      }

      if (this.filtroDataInicio) {
        alertasFiltrados = alertasFiltrados.filter(alerta => 
          new Date(alerta.data) >= new Date(this.filtroDataInicio)
        );
      }

      if (this.filtroDataFim) {
        alertasFiltrados = alertasFiltrados.filter(alerta => 
          new Date(alerta.data) <= new Date(this.filtroDataFim)
        );
      }

      return alertasFiltrados;
    }
  },
  methods: {
    async carregarAlertas() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/alerta-esquecimento', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          this.alertas = response.data.data || [];
          // Ordena os alertas por data em ordem decrescente
          this.alertas.sort((a, b) => new Date(b.data) - new Date(a.data));
          this.totalPaginas = Math.ceil(this.alertas.length / this.itensPorPagina);
        }
      } catch (error) {
        this.error = 'Erro ao carregar alertas. Tente novamente mais tarde.';
        console.error('Erro ao carregar alertas:', error);
      } finally {
        this.loading = false;
      }
    },
    formatarData(data) {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR');
    },
    formatarHora(hora) {
      if (!hora) return '';
      const date = new Date(hora);
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${horas}:${minutos}`;
    },
    formatarDataHora(dataHora) {
      if (!dataHora) return '';
      return new Date(dataHora).toLocaleString('pt-BR');
    },
    traduzirStatus(status) {
      const traducoes = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
      };
      return traducoes[status] || status;
    },
    mudarPagina(novaPagina) {
      this.paginaAtual = novaPagina;
    }
  },
  created() {
    this.carregarAlertas();
  },
  watch: {
    filtroStatus() {
      this.paginaAtual = 1;
    },
    filtroDataInicio() {
      this.paginaAtual = 1;
    },
    filtroDataFim() {
      this.paginaAtual = 1;
    }
  }
};
</script>

<style scoped>
.historico-alertas-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-voltar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-voltar:hover {
  background-color: #f0f0f0;
}

.filtros-section {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filtro-grupo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filtro-select,
.filtro-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.periodo-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alertas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.alerta-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.alerta-header {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.alerta-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.alerta-status.pendente {
  background-color: #fff3cd;
  color: #856404;
}

.alerta-status.aprovado {
  background-color: #d4edda;
  color: #155724;
}

.alerta-status.rejeitado {
  background-color: #f8d7da;
  color: #721c24;
}

.alerta-body {
  margin-bottom: 1rem;
}

.alerta-feedback {
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.feedback-data {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  color: #dc3545;
  padding: 1rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #aaa;
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

@media (max-width: 768px) {
  .alertas-grid {
    grid-template-columns: 1fr;
  }

  .filtros-section {
    flex-direction: column;
    gap: 1rem;
  }

  .filtro-grupo {
    flex-direction: column;
    align-items: flex-start;
  }

  .periodo-inputs {
    flex-direction: column;
    width: 100%;
  }

  .filtro-select,
  .filtro-input {
    width: 100%;
  }
}
</style> 