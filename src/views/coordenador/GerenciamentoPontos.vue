<template>
  <div class="gerenciamento-container">
    <h2>Gerenciamento de Pontos</h2>

    <!-- Seção de Alertas de Esquecimento -->
    <div class="alertas-section">
      <div class="section-header">
        <h3>Alertas de Esquecimento</h3>
        <div class="filtros">
          <select v-model="filtroStatus" class="filter-select">
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="rejeitado">Rejeitados</option>
          </select>
        </div>
      </div>

      <div class="loading-indicator" v-if="loading">
        <div class="spinner"></div>
        <p>Carregando alertas...</p>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="alertasFiltrados.length === 0" class="no-data">
        <i class="fas fa-bell-slash"></i>
        <p>Nenhum alerta de esquecimento encontrado</p>
      </div>

      <div v-else class="alertas-list">
        <div v-for="alerta in alertasFiltrados" :key="alerta.id" class="alerta-card">
          <div class="alerta-header">
            <div class="aluno-info">
              <i class="fas fa-user"></i>
              <span>{{ alerta.aluno.nome }}</span>
            </div>
            <span :class="['status-badge', alerta.status]">{{ alerta.status }}</span>
          </div>

          <div class="alerta-content">
            <div class="info-row">
              <span class="label">Data:</span>
              <span class="value">{{ formatarData(alerta.data) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Horário Previsto:</span>
              <span class="value">{{ formatarHora(alerta.horario_previsto) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo:</span>
              <span class="value">{{ alerta.tipo === 'entrada' ? 'Entrada' : 'Saída' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Justificativa:</span>
              <p class="justificativa">{{ alerta.justificativa }}</p>
            </div>
          </div>

          <div v-if="alerta.status === 'pendente'" class="alerta-actions">
            <div class="observacao-field">
              <label>Observação:</label>
              <textarea 
                v-model="alerta.observacao_coordenador" 
                placeholder="Adicione uma observação (opcional)"
                rows="2"
              ></textarea>
            </div>
            <div class="action-buttons">
              <button 
                @click="responderAlerta(alerta.id, 'aprovado', alerta.observacao_coordenador)"
                class="btn-aprovar"
              >
                <i class="fas fa-check"></i>
                Aprovar
              </button>
              <button 
                @click="responderAlerta(alerta.id, 'rejeitado', alerta.observacao_coordenador)"
                class="btn-rejeitar"
              >
                <i class="fas fa-times"></i>
                Rejeitar
              </button>
            </div>
          </div>

          <div v-else class="alerta-feedback">
            <div v-if="alerta.observacao_coordenador" class="observacao">
              <strong>Observação do Coordenador:</strong>
              <p>{{ alerta.observacao_coordenador }}</p>
            </div>
            <div class="feedback-info">
              <span>Respondido em: {{ formatarDataHora(alerta.data_aprovacao) }}</span>
            </div>
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
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import axios from 'axios';

export default {
  name: 'GerenciamentoPontos',
  
  setup() {
    const loading = ref(false);
    const error = ref('');
    const alertas = ref([]);
    const filtroStatus = ref('todos');
    const paginaAtual = ref(1);
    const totalPaginas = ref(1);
    const itensPorPagina = 10;

    const alertasFiltrados = computed(() => {
      if (filtroStatus.value === 'todos') {
        return alertas.value;
      }
      return alertas.value.filter(alerta => alerta.status === filtroStatus.value);
    });

    const buscarAlertas = async (pagina = 1) => {
      loading.value = true;
      error.value = '';

      try {
        const response = await axios.get('http://localhost:8000/api/v1/coordenador/alertas-esquecimento', {
          params: { page: pagina },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          alertas.value = response.data.data.alertas;
          totalPaginas.value = Math.ceil(response.data.data.total / itensPorPagina);
          paginaAtual.value = pagina;
        } else {
          error.value = response.data.message || 'Erro ao carregar alertas';
        }
      } catch (err) {
        error.value = 'Erro ao carregar alertas. Tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const responderAlerta = async (alertaId, status, observacao) => {
      try {
        const response = await axios.post(`http://localhost:8000/api/v1/coordenador/alertas-esquecimento/${alertaId}/responder`, {
          status,
          observacao_coordenador: observacao
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          await buscarAlertas(paginaAtual.value);
        } else {
          error.value = response.data.message || 'Erro ao responder alerta';
        }
      } catch (err) {
        error.value = 'Erro ao responder alerta. Tente novamente.';
        console.error(err);
      }
    };

    const mudarPagina = (novaPagina) => {
      buscarAlertas(novaPagina);
    };

    const formatarData = (data) => {
      if (!data) return '';
      try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return '';
      }
    };

    const formatarHora = (hora) => {
      if (!hora) return '';
      try {
        const date = new Date(hora);
        if (isNaN(date.getTime())) return '';
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      } catch (error) {
        console.error('Erro ao formatar hora:', error);
        return '';
      }
    };

    const formatarDataHora = (dataHora) => {
      if (!dataHora) return '';
      try {
        const date = new Date(dataHora);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('pt-BR');
      } catch (error) {
        console.error('Erro ao formatar data e hora:', error);
        return '';
      }
    };

    // Carregar alertas iniciais
    buscarAlertas();

    return {
      loading,
      error,
      alertas,
      filtroStatus,
      paginaAtual,
      totalPaginas,
      alertasFiltrados,
      responderAlerta,
      mudarPagina,
      formatarData,
      formatarHora,
      formatarDataHora
    };
  }
};
</script>

<style scoped>
.gerenciamento-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.alertas-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.alerta-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.alerta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.aluno-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pendente {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.aprovado {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.rejeitado {
  background-color: #f8d7da;
  color: #721c24;
}

.alerta-content {
  padding: 1rem;
}

.info-row {
  display: flex;
  margin-bottom: 0.5rem;
}

.info-row .label {
  font-weight: 500;
  min-width: 140px;
  color: #666;
}

.justificativa {
  margin: 0.5rem 0;
  color: #333;
}

.alerta-actions {
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.observacao-field {
  margin-bottom: 1rem;
}

.observacao-field textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-aprovar, .btn-rejeitar {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-aprovar {
  background-color: #28a745;
  color: white;
}

.btn-aprovar:hover {
  background-color: #218838;
}

.btn-rejeitar {
  background-color: #dc3545;
  color: white;
}

.btn-rejeitar:hover {
  background-color: #c82333;
}

.alerta-feedback {
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.observacao {
  margin-bottom: 0.5rem;
}

.feedback-info {
  font-size: 0.875rem;
  color: #666;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
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
  .gerenciamento-container {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
  }

  .info-row {
    flex-direction: column;
  }

  .info-row .label {
    min-width: auto;
    margin-bottom: 0.25rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .alertas-list {
    grid-template-columns: 1fr;
  }
}
</style>