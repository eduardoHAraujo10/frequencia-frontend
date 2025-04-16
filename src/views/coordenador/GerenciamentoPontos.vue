<template>
  <div class="gerenciamento-container">
    <h2>Gerenciamento de Pontos</h2>

    <div class="secao-status" data-status="todos">
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

    <div class="secao-status" data-status="pendente">
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

    <div class="secao-status" data-status="aprovado">
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

    <div class="secao-status" data-status="rejeitado">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { websocketService } from '../../services/websocket';

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

    const handleWebSocketMessage = (payload) => {
      if (payload.type === 'solicitacao_atualizada') {
        carregarSolicitacoes();
      }
    };

    onMounted(() => {
      websocketService.subscribe('solicitacao_atualizada', handleWebSocketMessage);
    });

    onUnmounted(() => {
      websocketService.unsubscribe('solicitacao_atualizada', handleWebSocketMessage);
    });

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
  color: var(--text-color);
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.secao-status {
  margin-bottom: 2rem;
  background: var(--content-background);
  border-radius: 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.secao-status:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.secao-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(to right, rgba(255, 107, 0, 0.05), rgba(255, 107, 0, 0.02));
  border-bottom: 2px solid var(--border-color);
}

.secao-header:hover {
  background: linear-gradient(to right, rgba(255, 107, 0, 0.1), rgba(255, 107, 0, 0.05));
}

.secao-header h3 {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.secao-header h3::before {
  content: '';
  display: block;
  width: 4px;
  height: 24px;
  background: #FF6B00;
  border-radius: 2px;
}

.contador {
  background: rgba(255, 107, 0, 0.1);
  color: #FF6B00;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.secao-header i {
  color: #FF6B00;
  transition: transform 0.3s ease;
  font-size: 1.1rem;
}

.secao-header i.expanded {
  transform: rotate(180deg);
}

.secao-content {
  padding: 1.5rem;
  background: var(--content-background);
  border-radius: 0 0 20px 20px;
}

.solicitacoes-list {
  display: grid;
  gap: 1.5rem;
}

.solicitacao-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.solicitacao-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.solicitacao-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.aluno-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.aluno-info i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.aluno-info span {
  font-weight: 600;
  color: var(--text-color);
}

.tipo-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: rgba(var(--va-primary), 0.1);
  color: var(--primary-color);
  font-weight: 600;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.pendente {
  background-color: #FFF4E5;
  color: #FF9800;
}

.status-badge.aprovado {
  background-color: #E6F4EA;
  color: #1E8E3E;
}

.status-badge.rejeitado {
  background-color: #FFF2F2;
  color: #FF3B3B;
}

.solicitacao-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
}

.info-row .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  min-width: 140px;
}

.info-row .value {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.justificativa {
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.5;
  margin: 0;
}

.solicitacao-actions {
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border-color);
}

.observacao-field {
  margin-bottom: 1rem;
}

.observacao-field label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.action-buttons button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-aprovar {
  background-color: var(--primary-color);
  color: white;
}

.btn-aprovar:hover {
  background-color: #3612D9;
  transform: translateY(-1px);
}

.btn-rejeitar {
  background-color: #FF3B3B;
  color: white;
}

.btn-rejeitar:hover {
  background-color: #E63535;
  transform: translateY(-1px);
}

.solicitacao-feedback {
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border-color);
}

.observacao {
  margin-bottom: 1rem;
}

.observacao strong {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.observacao p {
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.5;
  margin: 0;
}

.feedback-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

@media (max-width: 1200px) {
  .gerenciamento-container {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .gerenciamento-container {
    padding: 1rem;
  }

  .secao-header {
    padding: 1rem;
  }

  .secao-content {
    padding: 1rem;
  }

  .solicitacao-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .gerenciamento-container {
    padding: 0.75rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .secao-header h3 {
    font-size: 1.125rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-row .label {
    min-width: auto;
  }
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
</style>