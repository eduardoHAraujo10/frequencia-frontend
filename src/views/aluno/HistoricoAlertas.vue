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
        <label>Tipo:</label>
        <select v-model="filtroTipo" class="filtro-select">
          <option value="todos">Todos</option>
          <option value="alerta">Alertas de Esquecimento</option>
          <option value="ajuste">Ajustes de Horário</option>
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
        <div class="alerta-header">
          <div class="tipo-badge" :class="item.tipoSolicitacao">
            {{ item.tipoSolicitacao === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
          </div>
          <div class="alerta-status" :class="item.status">
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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h2 {
  color: #2c3e50;
  margin: 0;
}

.btn-voltar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  transition: background-color 0.3s;
}

.btn-voltar:hover {
  background-color: #e0e0e0;
}

.filtros-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filtro-grupo label {
  color: #495057;
  font-weight: 500;
  min-width: 80px;
}

.filtro-select,
.filtro-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.periodo-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alertas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.alerta-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alerta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tipo-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.tipo-badge.alerta {
  background-color: #fef3c7;
  color: #92400e;
}

.tipo-badge.ajuste {
  background-color: #e0e7ff;
  color: #3730a3;
}

.alerta-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.alerta-status.pendente {
  background-color: #f3f4f6;
  color: #374151;
}

.alerta-status.aprovado {
  background-color: #d1fae5;
  color: #065f46;
}

.alerta-status.rejeitado {
  background-color: #fee2e2;
  color: #991b1b;
}

.alerta-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row .label {
  font-weight: 500;
  color: #6b7280;
}

.info-row .value {
  color: #111827;
}

.justificativa {
  margin: 0;
  color: #374151;
  font-size: 0.95em;
  line-height: 1.5;
}

.alerta-feedback {
  background-color: #f9fafb;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.95em;
}

.feedback-data {
  display: block;
  margin-top: 8px;
  color: #6b7280;
  font-size: 0.9em;
}

.paginacao {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 30px;
}

.page-button {
  padding: 8px 16px;
  border: none;
  background-color: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.page-button:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #4b5563;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  color: #dc2626;
  padding: 20px;
  background-color: #fee2e2;
  border-radius: 8px;
  margin: 20px 0;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.no-data i {
  font-size: 2em;
  opacity: 0.5;
}
</style> 