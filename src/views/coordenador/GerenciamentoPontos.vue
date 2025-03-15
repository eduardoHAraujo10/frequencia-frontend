<template>
  <div class="gerenciamento-container">
    <h2>Gerenciamento de Pontos</h2>

    <div class="secao-status">
      <div class="secao-header" @click="toggleSecao('todos')">
        <h3>Todos os Status</h3>
        <span class="contador">{{ todosCount }}</span>
        <i class="fas fa-chevron-down" :class="{'expanded': expanded === 'todos'}"></i>
      </div>
      <div class="secao-content" v-if="expanded === 'todos'">
        <div class="solicitacoes-list">
          <div v-for="item in solicitacoesFiltradas('todos')" :key="item.id" class="solicitacao-card">
            <div class="solicitacao-header">
              <div class="aluno-info">
                <i class="fas fa-user"></i>
                <span>{{ item.aluno_nome }}</span>
              </div>
              <div class="tipo-badge">
                {{ item.tipo === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
              </div>
              <span :class="['status-badge', item.status]">{{ traduzirStatus(item.status) }}</span>
            </div>

            <div class="solicitacao-content">
              <template v-if="item.tipo === 'alerta'">
                <div class="info-row">
                  <span class="label">Data:</span>
                  <span class="value">{{ formatarData(item.data) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Previsto:</span>
                  <span class="value">{{ formatarHora(item.horario_previsto) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="value">{{ item.tipo_registro === 'entrada' ? 'Entrada' : 'Saída' }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="label">Horário Atual:</span>
                  <span class="value">{{ formatarDataHora(item.horario_atual) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Solicitado:</span>
                  <span class="value">{{ formatarDataHora(item.horario_solicitado) }}</span>
                </div>
              </template>
              <div class="info-row">
                <span class="label">Justificativa:</span>
                <p class="justificativa">{{ item.justificativa }}</p>
              </div>
            </div>

            <div v-if="item.status === 'pendente'" class="solicitacao-actions">
              <div class="observacao-field">
                <label>Observação:</label>
                <textarea 
                  v-model="item.observacao_coordenador" 
                  placeholder="Adicione uma observação (opcional)"
                  rows="2"
                ></textarea>
              </div>
              <div class="action-buttons">
                <button 
                  @click="responderSolicitacao(item)"
                  class="btn-aprovar"
                >
                  <i class="fas fa-check"></i>
                  Aprovar
                </button>
                <button 
                  @click="responderSolicitacao(item, false)"
                  class="btn-rejeitar"
                >
                  <i class="fas fa-times"></i>
                  Rejeitar
                </button>
              </div>
            </div>

            <div v-else class="solicitacao-feedback">
              <div v-if="item.observacao_coordenador" class="observacao">
                <strong>Observação do Coordenador:</strong>
                <p>{{ item.observacao_coordenador }}</p>
              </div>
              <div class="feedback-info">
                <span>Respondido em: {{ formatarDataHora(item.data_resposta || item.data_aprovacao) }}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

    <div class="secao-status">
      <div class="secao-header" @click="toggleSecao('pendente')">
        <h3>Pendentes</h3>
        <span class="contador">{{ pendentesCount }}</span>
        <i class="fas fa-chevron-down" :class="{'expanded': expanded === 'pendente'}"></i>
      </div>
      <div class="secao-content" v-if="expanded === 'pendente'">
        <div class="solicitacoes-list">
          <div v-for="item in solicitacoesFiltradas('pendente')" :key="item.id" class="solicitacao-card">
            <div class="solicitacao-header">
              <div class="aluno-info">
                <i class="fas fa-user"></i>
                <span>{{ item.aluno_nome }}</span>
              </div>
              <div class="tipo-badge">
                {{ item.tipo === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
              </div>
              <span :class="['status-badge', item.status]">{{ traduzirStatus(item.status) }}</span>
            </div>

            <div class="solicitacao-content">
              <template v-if="item.tipo === 'alerta'">
                <div class="info-row">
                  <span class="label">Data:</span>
                  <span class="value">{{ formatarData(item.data) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Previsto:</span>
                  <span class="value">{{ formatarHora(item.horario_previsto) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="value">{{ item.tipo_registro === 'entrada' ? 'Entrada' : 'Saída' }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="label">Horário Atual:</span>
                  <span class="value">{{ formatarDataHora(item.horario_atual) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Solicitado:</span>
                  <span class="value">{{ formatarDataHora(item.horario_solicitado) }}</span>
                </div>
              </template>
              <div class="info-row">
                <span class="label">Justificativa:</span>
                <p class="justificativa">{{ item.justificativa }}</p>
              </div>
            </div>

            <div v-if="item.status === 'pendente'" class="solicitacao-actions">
              <div class="observacao-field">
                <label>Observação:</label>
                <textarea 
                  v-model="item.observacao_coordenador" 
                  placeholder="Adicione uma observação (opcional)"
                  rows="2"
                ></textarea>
              </div>
              <div class="action-buttons">
                <button 
                  @click="responderSolicitacao(item)"
                  class="btn-aprovar"
                >
                  <i class="fas fa-check"></i>
                  Aprovar
                </button>
                <button 
                  @click="responderSolicitacao(item, false)"
                  class="btn-rejeitar"
                >
                  <i class="fas fa-times"></i>
                  Rejeitar
                </button>
              </div>
      </div>

            <div v-else class="solicitacao-feedback">
              <div v-if="item.observacao_coordenador" class="observacao">
                <strong>Observação do Coordenador:</strong>
                <p>{{ item.observacao_coordenador }}</p>
              </div>
              <div class="feedback-info">
                <span>Respondido em: {{ formatarDataHora(item.data_resposta || item.data_aprovacao) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

    <div class="secao-status">
      <div class="secao-header" @click="toggleSecao('aprovado')">
        <h3>Aprovados</h3>
        <span class="contador">{{ aprovadosCount }}</span>
        <i class="fas fa-chevron-down" :class="{'expanded': expanded === 'aprovado'}"></i>
      </div>
      <div class="secao-content" v-if="expanded === 'aprovado'">
        <div class="solicitacoes-list">
          <div v-for="item in solicitacoesFiltradas('aprovado')" :key="item.id" class="solicitacao-card">
            <div class="solicitacao-header">
            <div class="aluno-info">
              <i class="fas fa-user"></i>
                <span>{{ item.aluno_nome }}</span>
              </div>
              <div class="tipo-badge">
                {{ item.tipo === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
              </div>
              <span :class="['status-badge', item.status]">{{ traduzirStatus(item.status) }}</span>
          </div>

            <div class="solicitacao-content">
              <template v-if="item.tipo === 'alerta'">
            <div class="info-row">
              <span class="label">Data:</span>
                  <span class="value">{{ formatarData(item.data) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Horário Previsto:</span>
                  <span class="value">{{ formatarHora(item.horario_previsto) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo:</span>
                  <span class="value">{{ item.tipo_registro === 'entrada' ? 'Entrada' : 'Saída' }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="label">Horário Atual:</span>
                  <span class="value">{{ formatarDataHora(item.horario_atual) }}</span>
            </div>
                <div class="info-row">
                  <span class="label">Horário Solicitado:</span>
                  <span class="value">{{ formatarDataHora(item.horario_solicitado) }}</span>
                </div>
              </template>
            <div class="info-row">
              <span class="label">Justificativa:</span>
                <p class="justificativa">{{ item.justificativa }}</p>
              </div>
          </div>

            <div v-if="item.status === 'pendente'" class="solicitacao-actions">
            <div class="observacao-field">
              <label>Observação:</label>
              <textarea 
                  v-model="item.observacao_coordenador" 
                placeholder="Adicione uma observação (opcional)"
                rows="2"
              ></textarea>
            </div>
            <div class="action-buttons">
              <button 
                  @click="responderSolicitacao(item)"
                class="btn-aprovar"
              >
                <i class="fas fa-check"></i>
                Aprovar
              </button>
              <button 
                  @click="responderSolicitacao(item, false)"
                class="btn-rejeitar"
              >
                <i class="fas fa-times"></i>
                Rejeitar
              </button>
            </div>
          </div>

            <div v-else class="solicitacao-feedback">
              <div v-if="item.observacao_coordenador" class="observacao">
              <strong>Observação do Coordenador:</strong>
                <p>{{ item.observacao_coordenador }}</p>
            </div>
            <div class="feedback-info">
                <span>Respondido em: {{ formatarDataHora(item.data_resposta || item.data_aprovacao) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="secao-status">
      <div class="secao-header" @click="toggleSecao('rejeitado')">
        <h3>Rejeitados</h3>
        <span class="contador">{{ rejeitadosCount }}</span>
        <i class="fas fa-chevron-down" :class="{'expanded': expanded === 'rejeitado'}"></i>
      </div>
      <div class="secao-content" v-if="expanded === 'rejeitado'">
        <div class="solicitacoes-list">
          <div v-for="item in solicitacoesFiltradas('rejeitado')" :key="item.id" class="solicitacao-card">
            <div class="solicitacao-header">
              <div class="aluno-info">
                <i class="fas fa-user"></i>
                <span>{{ item.aluno_nome }}</span>
              </div>
              <div class="tipo-badge">
                {{ item.tipo === 'alerta' ? 'Alerta de Esquecimento' : 'Ajuste de Horário' }}
              </div>
              <span :class="['status-badge', item.status]">{{ traduzirStatus(item.status) }}</span>
            </div>

            <div class="solicitacao-content">
              <template v-if="item.tipo === 'alerta'">
                <div class="info-row">
                  <span class="label">Data:</span>
                  <span class="value">{{ formatarData(item.data) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Previsto:</span>
                  <span class="value">{{ formatarHora(item.horario_previsto) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="value">{{ item.tipo_registro === 'entrada' ? 'Entrada' : 'Saída' }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="label">Horário Atual:</span>
                  <span class="value">{{ formatarDataHora(item.horario_atual) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Horário Solicitado:</span>
                  <span class="value">{{ formatarDataHora(item.horario_solicitado) }}</span>
                </div>
              </template>
              <div class="info-row">
                <span class="label">Justificativa:</span>
                <p class="justificativa">{{ item.justificativa }}</p>
        </div>
      </div>

            <div v-if="item.status === 'pendente'" class="solicitacao-actions">
              <div class="observacao-field">
                <label>Observação:</label>
                <textarea 
                  v-model="item.observacao_coordenador" 
                  placeholder="Adicione uma observação (opcional)"
                  rows="2"
                ></textarea>
              </div>
              <div class="action-buttons">
        <button 
                  @click="responderSolicitacao(item)"
                  class="btn-aprovar"
        >
                  <i class="fas fa-check"></i>
                  Aprovar
        </button>
        <button 
                  @click="responderSolicitacao(item, false)"
                  class="btn-rejeitar"
        >
                  <i class="fas fa-times"></i>
                  Rejeitar
        </button>
              </div>
            </div>

            <div v-else class="solicitacao-feedback">
              <div v-if="item.observacao_coordenador" class="observacao">
                <strong>Observação do Coordenador:</strong>
                <p>{{ item.observacao_coordenador }}</p>
              </div>
              <div class="feedback-info">
                <span>Respondido em: {{ formatarDataHora(item.data_resposta || item.data_aprovacao) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-indicator" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando solicitações...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="solicitacoesFiltradas('todos').length === 0" class="no-data">
      <i class="fas fa-clock"></i>
      <p>Nenhuma solicitação encontrada</p>
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
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
    const successMessage = ref('');
    const solicitacoes = ref([]);
    const expanded = ref('todos');

    const solicitacoesFiltradas = computed(() => {
      return (status) => {
        if (status === 'todos') {
          return solicitacoes.value;
        }
        return solicitacoes.value.filter(s => s.status === status);
      };
    });

    const todosCount = computed(() => solicitacoes.value.length);
    const pendentesCount = computed(() => solicitacoes.value.filter(s => s.status === 'pendente').length);
    const aprovadosCount = computed(() => solicitacoes.value.filter(s => s.status === 'aprovado').length);
    const rejeitadosCount = computed(() => solicitacoes.value.filter(s => s.status === 'rejeitado').length);

    const carregarSolicitacoes = async () => {
      loading.value = true;
      error.value = '';
      try {
        const [alertasResponse, ajustesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/coordenador/alertas-esquecimento', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:8000/api/v1/coordenador/solicitacoes-ajuste', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        const alertas = alertasResponse.data.status === 'success' 
          ? alertasResponse.data.data.alertas.map(a => ({ ...a, tipo: 'alerta' }))
          : [];

        const ajustes = ajustesResponse.data.status === 'success'
          ? ajustesResponse.data.data.solicitacoes.map(s => ({ ...s, tipo: 'ajuste' }))
          : [];

        // Combina e ordena por data de criação
        solicitacoes.value = [...alertas, ...ajustes].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      } catch (err) {
        error.value = 'Erro ao carregar solicitações. Tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const responderSolicitacao = async (item, aprovar = true) => {
      const status = aprovar ? 'aprovado' : 'rejeitado';
      const endpoint = item.tipo === 'alerta'
        ? `alertas-esquecimento/${item.id}/responder`
        : `solicitacoes-ajuste/${item.id}/responder`;

      try {
        const response = await axios.post(
          `http://localhost:8000/api/v1/coordenador/${endpoint}`,
          {
          status,
            observacao_coordenador: item.observacao_coordenador
          },
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );

        if (response.data.status === 'success') {
          successMessage.value = aprovar 
            ? 'Solicitação aprovada com sucesso! O registro foi atualizado.' 
            : 'Solicitação rejeitada com sucesso!';
          
          // Limpa a mensagem após 3 segundos
          setTimeout(() => {
            successMessage.value = '';
          }, 3000);

          await carregarSolicitacoes();
        } else {
          error.value = response.data.message || 'Erro ao responder solicitação';
        }
      } catch (err) {
        error.value = 'Erro ao responder solicitação. Tente novamente.';
        console.error(err);
      }
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

    const traduzirStatus = (status) => {
      const traducoes = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
      };
      return traducoes[status] || status;
    };

    const toggleSecao = (status) => {
      expanded.value = expanded.value === status ? null : status;
    };

    // Carregar dados iniciais
    carregarSolicitacoes();

    return {
      loading,
      error,
      successMessage,
      solicitacoes,
      expanded,
      solicitacoesFiltradas,
      responderSolicitacao,
      formatarData,
      formatarHora,
      formatarDataHora,
      traduzirStatus,
      toggleSecao,
      todosCount,
      pendentesCount,
      aprovadosCount,
      rejeitadosCount
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

h2 {
  margin-bottom: 2rem;
}

.secao-status {
  margin-bottom: 1.5rem;
}

.secao-header {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  transition: all 0.3s ease;
}

.secao-header:hover {
  background: #f8f9fa;
}

.secao-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.secao-header .contador {
  background: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #495057;
}

.secao-header i {
  transition: transform 0.3s ease;
}

.secao-header.expanded i {
  transform: rotate(180deg);
}

.secao-content {
  margin-top: 1rem;
}

.solicitacoes-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.solicitacao-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #eee;
}

.solicitacao-header {
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

.tipo-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  background-color: #e9ecef;
  color: #495057;
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

.solicitacao-content {
  padding: 1rem;
}

.info-row {
  margin-bottom: 0.5rem;
}

.info-row .label {
  font-weight: 500;
  color: #666;
  display: block;
  margin-bottom: 0.25rem;
}

.justificativa {
  margin: 0.5rem 0;
  color: #333;
}

.solicitacao-actions {
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

.btn-aprovar,
.btn-rejeitar {
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

.solicitacao-feedback {
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

.success-message {
  text-align: center;
  color: #28a745;
  padding: 1rem;
  background-color: #d4edda;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .gerenciamento-container {
    padding: 1rem;
  }

  .solicitacoes-list {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .info-row {
    flex-direction: column;
  }

  .info-row .label {
    min-width: auto;
    margin-bottom: 0.25rem;
  }
}
</style>