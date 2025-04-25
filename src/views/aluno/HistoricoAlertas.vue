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
      <div v-for="item in solicitacoesFiltradas" :key="item.id" class="alerta-card" :class="item.tipoSolicitacao">
        <div class="alerta-header">
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
              <span class="label">Horário de Entrada:</span>
              <span class="value">{{ formatarHora(item.horario_entrada) || 'Não informado' }}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Horário de Saída:</span>
              <span class="value">{{ formatarHora(item.horario_saida) || 'Não informado' }}</span>
            </div>
          </template>

          <template v-else>
            <div class="info-row">
              <span class="label">Data:</span>
              <span class="value">{{ formatarData(extrairData(item.horario_atual)) }}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Horário Atual:</span>
              <span class="value">{{ formatarHora(extrairHora(item.horario_atual)) }}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Horário Solicitado:</span>
              <span class="value">{{ formatarHora(extrairHora(item.horario_solicitado)) }}</span>
            </div>
          </template>

          <div class="info-row">
            <span class="label">Justificativa:</span>
            <p class="justificativa">{{ item.justificativa }}</p>
          </div>
        </div>

        <div v-if="item.observacao_coordenador" class="alerta-feedback">
          <div class="feedback-header">
            <strong>Feedback do Coordenador:</strong>
          </div>
          <div class="chat-message">
            <div class="chat-avatar">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="chat-content">
              <div class="chat-header">
                <span class="chat-name">{{ item.coordenador_nome }}</span>
                <span class="chat-time">{{ formatarDataHora(item.data_resposta) }}</span>
              </div>
              <p class="chat-text">{{ item.observacao_coordenador }}</p>
            </div>
          </div>
        </div>

        <template v-else-if="item.status === 'aprovado'" class="alerta-feedback">
          <div class="chat-message">
            <div class="chat-avatar">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="chat-content">
              <div class="chat-header">
                <span class="chat-name">{{ item.coordenador?.nome }}</span>
                <span class="chat-time">{{ formatarDataHora(item.data_aprovacao) }}</span>
              </div>
              <p class="chat-text">Solicitação aprovada</p>
            </div>
          </div>
        </template>
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
import { formatTime, formatDate, formatDateTime } from '../../utils/dateUtils';

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
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        // Buscar alertas de esquecimento e ajustes
        const [alertasResponse, ajustesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/registros/alerta-esquecimento', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            params: {
              page: this.paginaAtual,
              per_page: this.itensPorPagina,
              status: this.filtroStatus !== 'todos' ? this.filtroStatus : undefined,
              data_inicio: this.filtroDataInicio || undefined,
              data_fim: this.filtroDataFim || undefined
            }
          }),
          axios.get('http://localhost:8000/api/v1/registros/solicitacoes-ajuste', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            params: {
              page: this.paginaAtual,
              per_page: this.itensPorPagina,
              status: this.filtroStatus !== 'todos' ? this.filtroStatus : undefined,
              data_inicio: this.filtroDataInicio || undefined,
              data_fim: this.filtroDataFim || undefined
            }
          })
        ]);

        let todasSolicitacoes = [];

        if (alertasResponse.data.status === 'success' && alertasResponse.data.data) {
          const alertas = alertasResponse.data.data.alertas || [];
          todasSolicitacoes.push(...alertas.map(alerta => ({
            ...alerta,
            tipoSolicitacao: 'alerta'
          })));
        }

        if (ajustesResponse.data.status === 'success') {
          const ajustes = ajustesResponse.data.data || [];
          todasSolicitacoes.push(...ajustes.map(ajuste => ({
            ...ajuste,
            tipoSolicitacao: 'ajuste',
            aluno_nome: ajuste.nome_aluno,
            horario_atual: ajuste.horario_atual,
            horario_solicitado: ajuste.horario_solicitado,
            data_resposta: ajuste.data_resposta,
            observacao_coordenador: ajuste.observacao_coordenador
          })));
        }

        // Ordenar todas as solicitações por data de criação
        this.solicitacoes = todasSolicitacoes.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );

        // Atualizar paginação com o total combinado
        const totalItens = Math.max(
          alertasResponse.data.data?.paginacao?.total || 0,
          ajustesResponse.data.data?.length || 0
        );
        this.totalPaginas = Math.ceil(totalItens / this.itensPorPagina);
        this.paginaAtual = Math.min(this.paginaAtual, this.totalPaginas);

      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        if (error.response?.status === 401) {
          this.error = 'Sessão expirada. Por favor, faça login novamente.';
          this.$router.push('/login');
        } else if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else {
          this.error = 'Erro ao carregar solicitações. Por favor, tente novamente mais tarde.';
        }
        this.solicitacoes = [];
        this.totalPaginas = 1;
      } finally {
        this.loading = false;
      }
    },
    formatarData(data) {
      return formatDate(data);
    },
    formatarHora(hora) {
      return formatTime(hora);
    },
    formatarDataHora(dataHora) {
      return formatDateTime(dataHora);
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
    },
    extrairData(dataHora) {
      if (!dataHora) return '';
      return dataHora.split(' ')[0];
    },
    extrairHora(dataHora) {
      if (!dataHora) return '';
      return dataHora.split(' ')[1];
    }
  },
  created() {
    this.carregarSolicitacoes();
  },
  watch: {
    filtroStatus() {
      this.paginaAtual = 1;
      this.carregarSolicitacoes();
    },
    filtroTipo() {
      this.paginaAtual = 1;
      this.carregarSolicitacoes();
    },
    filtroDataInicio() {
      this.paginaAtual = 1;
      this.carregarSolicitacoes();
    },
    filtroDataFim() {
      this.paginaAtual = 1;
      this.carregarSolicitacoes();
    },
    paginaAtual() {
      this.carregarSolicitacoes();
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
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.alerta-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.alerta-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.tipo-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f97316;
}

.tipo-badge i {
  font-size: 1rem;
}

.alerta-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.alerta-status.pendente {
  background-color: #fff4e5;
  color: #ff9800;
}

.alerta-status.aprovado {
  background-color: #e6f4ea;
  color: #1e8e3e;
}

.alerta-status.rejeitado {
  background-color: #fee2e2;
  color: #dc2626;
}

.alerta-content {
  padding: 1.5rem;
}

.info-row {
  margin-bottom: 1rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.info-row .value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
}

.justificativa {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #4b5563;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin: 0;
}

.alerta-feedback {
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.chat-content {
  flex: 1;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.chat-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.chat-time {
  color: #6b7280;
  font-size: 0.75rem;
}

.chat-text {
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.5;
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

.tipo-badge.alerta {
  color: #f97316;
  background-color: #fff7ed;
}

.tipo-badge.ajuste {
  color: #0891b2;
  background-color: #ecfeff;
}

.alerta-card.alerta {
  border-left: 4px solid #f97316;
}

.alerta-card.ajuste {
  border-left: 4px solid #0891b2;
}
</style> 