<template>
  <div class="historico-alertas-container">
    <div class="page-header">
      <h2>Histórico de Solicitações</h2>
      <router-link to="/registro-ponto" class="btn-voltar">
        <i class="fas fa-arrow-left"></i>
        Voltar
      </router-link>
    </div>

    <div class="filtros-section">
      <div class="filtros-grid">
        <div class="filtro-grupo">
          <label>
            <i class="fas fa-filter"></i>
            Status:
          </label>
          <select v-model="filtroStatus" class="filtro-select">
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="rejeitado">Rejeitados</option>
          </select>
        </div>

        <div class="filtro-grupo">
          <label>
            <i class="fas fa-tasks"></i>
            Tipo:
          </label>
          <select v-model="filtroTipo" class="filtro-select">
            <option value="todos">Todos</option>
            <option value="alerta">Alertas de Esquecimento</option>
            <option value="ajuste">Ajustes de Horário</option>
          </select>
        </div>

        <div class="filtro-grupo periodo-grupo">
          <label>
            <i class="fas fa-calendar-alt"></i>
            Período:
          </label>
          <div class="periodo-inputs">
            <input 
              type="date" 
              v-model="filtroDataInicio" 
              class="filtro-input"
            >
            <span class="periodo-separator">até</span>
            <input 
              type="date" 
              v-model="filtroDataFim" 
              class="filtro-input"
            >
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Carregando solicitações...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="solicitacoesFiltradas.length === 0" class="no-data">
      <i class="fas fa-bell-slash"></i>
      <p>Nenhuma solicitação encontrada para os filtros selecionados</p>
    </div>

    <div v-else class="alertas-grid">
      <div v-for="item in solicitacoesFiltradas" :key="item.id" class="alerta-card">
        <div class="alerta-header" :class="item.status">
          <div class="tipo-badge" :class="item.tipoSolicitacao">
            <i :class="item.tipoSolicitacao === 'alerta' ? 'fas fa-exclamation-circle' : 'fas fa-clock'"></i>
            {{ item.tipoSolicitacao === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
          </div>
          <div class="alerta-status" :class="item.status">
            <i :class="getStatusIcon(item.status)"></i>
            {{ traduzirStatus(item.status) }}
          </div>
        </div>

        <div class="alerta-content">
          <template v-if="item.tipoSolicitacao === 'alerta'">
            <div class="info-row">
              <span class="label">Data:</span>
              <span class="value">{{ formatarData(item.data) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Horário Previsto:</span>
              <span class="value">{{ formatarHora(item.horario_solicitado) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo:</span>
              <span class="value">{{ item.tipo === 'entrada' ? 'Entrada' : 'Saída' }}</span>
            </div>
          </template>
          <template v-else>
            <div class="info-row">
              <span class="label">Data:</span>
              <span class="value">{{ formatarData(item.data) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Horário Atual:</span>
              <span class="value">{{ formatarHora(item.horario_atual) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Horário Solicitado:</span>
              <span class="value">{{ formatarHora(item.horario_solicitado) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo:</span>
              <span class="value">{{ item.tipo === 'entrada' ? 'Entrada' : 'Saída' }}</span>
            </div>
          </template>

          <div class="info-row">
            <span class="label">Justificativa:</span>
            <p class="justificativa">{{ item.justificativa }}</p>
          </div>
        </div>

        <div v-if="item.observacao_coordenador" class="alerta-feedback">
          <strong>Feedback do Coordenador:</strong>
          <p>{{ item.observacao_coordenador }}</p>
          <small class="feedback-data" v-if="item.data_resposta">
            Respondido em: {{ formatarDataHora(item.data_resposta) }}
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
      solicitacoes: [],
      loading: false,
      error: null,
      filtroStatus: 'todos',
      filtroTipo: 'todos',
      filtroDataInicio: '',
      filtroDataFim: '',
      paginaAtual: 1,
      totalPaginas: 1,
      itensPorPagina: 6
    };
  },
  computed: {
    solicitacoesFiltradas() {
      let solicitacoesFiltradas = [...this.solicitacoes];

      if (this.filtroStatus !== 'todos') {
        solicitacoesFiltradas = solicitacoesFiltradas.filter(item => item.status === this.filtroStatus);
      }

      if (this.filtroTipo !== 'todos') {
        solicitacoesFiltradas = solicitacoesFiltradas.filter(item => item.tipoSolicitacao === this.filtroTipo);
      }

      if (this.filtroDataInicio) {
        solicitacoesFiltradas = solicitacoesFiltradas.filter(item => {
          const dataItem = item.tipoSolicitacao === 'alerta' ? item.data : item.horario_atual;
          return new Date(dataItem) >= new Date(this.filtroDataInicio);
        });
      }

      if (this.filtroDataFim) {
        solicitacoesFiltradas = solicitacoesFiltradas.filter(item => {
          const dataItem = item.tipoSolicitacao === 'alerta' ? item.data : item.horario_atual;
          return new Date(dataItem) <= new Date(this.filtroDataFim);
        });
      }

      // Ordenar por data de criação (mais recentes primeiro)
      solicitacoesFiltradas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Aplicar paginação
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
      const fim = inicio + this.itensPorPagina;
      return solicitacoesFiltradas.slice(inicio, fim);
    }
  },
  methods: {
    async carregarSolicitacoes() {
      this.loading = true;
      this.error = null;

      try {
        // Carregar alertas de esquecimento
        const alertasResponse = await axios.get('http://localhost:8000/api/v1/registros/alerta-esquecimento', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        // Carregar solicitações de ajuste
        const ajustesResponse = await axios.get('http://localhost:8000/api/v1/registros/solicitacoes-ajuste', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        console.log('Alertas Response:', alertasResponse.data);
        console.log('Ajustes Response:', ajustesResponse.data);

        const alertas = alertasResponse.data.success 
          ? alertasResponse.data.data.map(alerta => ({
              id: alerta.id,
              tipoSolicitacao: 'alerta',
              data: alerta.data,
              horario_atual: null,
              horario_solicitado: alerta.horario_previsto,
              tipo: alerta.tipo,
              status: alerta.status || 'pendente',
              justificativa: alerta.justificativa,
              observacao_coordenador: alerta.observacao_coordenador,
              data_resposta: alerta.data_resposta,
              created_at: alerta.created_at
            }))
          : [];

        const ajustes = ajustesResponse.data.status === 'success'
          ? ajustesResponse.data.data.map(ajuste => ({
              id: ajuste.id,
              tipoSolicitacao: 'ajuste',
              data: new Date(ajuste.horario_atual).toISOString().split('T')[0],
              horario_atual: ajuste.horario_atual,
              horario_solicitado: ajuste.horario_solicitado,
              tipo: ajuste.tipo_registro,
              status: ajuste.status || 'pendente',
              justificativa: ajuste.justificativa,
              observacao_coordenador: ajuste.observacao_coordenador,
              data_resposta: ajuste.data_resposta,
              created_at: ajuste.created_at,
              nome_aluno: ajuste.nome_aluno,
              matricula: ajuste.matricula
            }))
          : [];

        console.log('Alertas processados:', alertas);
        console.log('Ajustes processados:', ajustes);

        // Combinar as duas listas
        this.solicitacoes = [...alertas, ...ajustes];
        
        console.log('Solicitações combinadas:', this.solicitacoes);
        
        // Ordenar por data de criação (mais recentes primeiro)
        this.solicitacoes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        this.totalPaginas = Math.ceil(this.solicitacoes.length / this.itensPorPagina);

      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        } else {
          this.error = 'Erro ao carregar solicitações. Por favor, tente novamente mais tarde.';
        }
      } finally {
        this.loading = false;
      }
    },
    formatarData(data) {
      if (!data) return '';
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    },
    formatarHora(dataHora) {
      if (!dataHora) return '';
      const date = new Date(dataHora);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
    formatarDataHora(dataHora) {
      if (!dataHora) return '';
      const date = new Date(dataHora);
      return date.toLocaleString('pt-BR');
    },
    traduzirStatus(status) {
      const traducoes = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
      };
      return traducoes[status] || status;
    },
    getStatusIcon(status) {
      const icons = {
        'pendente': 'fas fa-clock',
        'aprovado': 'fas fa-check-circle',
        'rejeitado': 'fas fa-times-circle'
      };
      return icons[status] || 'fas fa-question-circle';
    },
    mudarPagina(pagina) {
      if (pagina >= 1 && pagina <= this.totalPaginas) {
        this.paginaAtual = pagina;
      }
    }
  },
  created() {
    this.carregarSolicitacoes();
  },
  watch: {
    filtroStatus() {
      this.paginaAtual = 1;
    },
    filtroTipo() {
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
  animation: fadeIn 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  color: #2d3748;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.btn-voltar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-radius: 8px;
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-voltar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 55, 72, 0.2);
}

.filtros-section {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filtro-grupo label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.95rem;
}

.filtro-grupo label i {
  color: #4299e1;
}

.filtro-select,
.filtro-input {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  width: 100%;
}

.filtro-select:focus,
.filtro-input:focus {
  border-color: #FF6B00;
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
  outline: none;
}

.periodo-grupo {
  grid-column: 1 / -1;
}

.periodo-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
}

.periodo-separator {
  color: #4a5568;
  font-weight: 500;
}

.alertas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  animation: slideUp 0.4s ease;
}

.alerta-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.alerta-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.alerta-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
}

.alerta-header.pendente {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.alerta-header.aprovado {
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
}

.alerta-header.rejeitado {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
}

.tipo-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.tipo-badge i {
  font-size: 1.1rem;
}

.tipo-badge.alerta {
  background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
  color: #92400e;
}

.tipo-badge.ajuste {
  background: linear-gradient(135deg, #FFE5CC 0%, #FF9E4F 100%);
  color: #B33D00;
}

.alerta-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.alerta-status i {
  font-size: 1.1rem;
}

.alerta-status.pendente {
  background: #f3f4f6;
  color: #374151;
}

.alerta-status.aprovado {
  background: #d1fae5;
  color: #065f46;
}

.alerta-status.rejeitado {
  background: #fee2e2;
  color: #991b1b;
}

.alerta-content {
  padding: 1.5rem;
  flex: 1;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.info-row .value {
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 600;
}

.justificativa {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.95rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.alerta-feedback {
  background: #f9fafb;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.alerta-feedback strong {
  display: block;
  margin-bottom: 0.75rem;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 600;
}

.alerta-feedback p {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.95rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.feedback-data {
  display: block;
  margin-top: 0.75rem;
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #FF6B00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  text-align: center;
  color: #e53e3e;
  padding: 1.5rem;
  background: #fff5f5;
  border-radius: 12px;
  border: 1px solid #feb2b2;
  margin: 2rem 0;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.no-data i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.paginacao {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.page-button {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #4299e1;
}

.page-button:hover:not(:disabled) {
  background: #4299e1;
  border-color: #4299e1;
  color: white;
  transform: translateY(-2px);
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f7fafc;
}

.page-info {
  color: #4a5568;
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .historico-alertas-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.25rem;
  }

  .btn-voltar {
    width: 100%;
    justify-content: center;
  }

  .filtros-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .periodo-inputs {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .periodo-separator {
    text-align: center;
  }

  .alertas-grid {
    grid-template-columns: 1fr;
  }

  .alerta-header {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .tipo-badge,
  .alerta-status {
    justify-content: center;
  }
}
</style> 