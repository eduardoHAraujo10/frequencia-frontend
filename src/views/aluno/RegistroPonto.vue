<template>
  <div class="registro-ponto-container">
    <!-- Modal de Solicitação de Ajuste -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Solicitar Ajuste de Registro</h3>
        
        <div class="form-group">
          <label>Registro Atual:</label>
          <div class="registro-atual">
            <span>{{ formatDate(registroParaAjuste?.horario) }} - {{ formatTime(registroParaAjuste?.horario) }}</span>
            <span :class="['registro-tipo', registroParaAjuste?.tipo.toLowerCase()]">
              {{ registroParaAjuste?.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Nova Data/Hora:</label>
          <input 
            type="datetime-local" 
            v-model="novoHorario"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Justificativa:</label>
          <textarea 
            v-model="justificativa"
            class="form-control"
            rows="3"
            placeholder="Explique o motivo do ajuste..."
          ></textarea>
        </div>

        <div class="modal-actions">
          <button 
            @click="enviarSolicitacaoAjuste" 
            class="btn-primary"
            :disabled="!novoHorario || !justificativa || loadingAjuste"
          >
            <span v-if="loadingAjuste" class="spinner"></span>
            {{ loadingAjuste ? 'Enviando...' : 'Enviar Solicitação' }}
          </button>
          <button @click="fecharModal" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Alerta de Esquecimento -->
    <div v-if="showModalEsquecimento" class="modal-overlay">
      <div class="modal-content">
        <h3>Registrar Esquecimento de Ponto</h3>
        
        <div class="form-group">
          <label>Data:</label>
          <input 
            type="date" 
            v-model="alertaData"
            class="form-control"
            :max="hoje"
          >
        </div>

        <div class="form-group">
          <label>Horário Previsto:</label>
          <input 
            type="time" 
            v-model="alertaHorario"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Tipo:</label>
          <select v-model="alertaTipo" class="form-control">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div class="form-group">
          <label>Justificativa:</label>
          <textarea 
            v-model="alertaJustificativa"
            class="form-control"
            rows="3"
            placeholder="Explique o motivo do esquecimento..."
          ></textarea>
        </div>

        <div class="modal-actions">
          <button 
            @click="enviarAlertaEsquecimento" 
            class="btn-primary"
            :disabled="!alertaData || !alertaHorario || !alertaTipo || !alertaJustificativa || loadingAlerta"
          >
            <span v-if="loadingAlerta" class="spinner"></span>
            {{ loadingAlerta ? 'Enviando...' : 'Enviar Alerta' }}
          </button>
          <button @click="fecharModalEsquecimento" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="registro-grid">
      <div class="registro-card">
        <h2>Registro de Presença</h2>
        
        <div class="status-section">
          <div class="time-display">
            {{ currentTime }}
          </div>
          <div class="date-display">
            {{ currentDate }}
          </div>
        </div>

        <div v-if="mensagemRegistro" class="registro-status info">
          {{ mensagemRegistro }}
        </div>

        <div v-if="statusMessage" :class="['registro-status', statusClass]">
          {{ statusMessage }}
        </div>

        <div class="button-group">
          <button 
            @click="registrarPresenca()" 
            class="registro-button"
            :class="botaoClasse"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            {{ botaoTexto }}
          </button>
          <button 
            @click="abrirModalEsquecimento" 
            class="registro-button esquecimento"
            title="Registrar esquecimento de ponto"
          >
            <i class="fas fa-exclamation-triangle"></i>
            Esqueci de Registrar
          </button>
        </div>

        <div class="resumo-section">
          <div class="resumo-card">
            <i class="fas fa-clock"></i>
            <div class="resumo-info">
              <span class="resumo-valor">{{ horasTrabalhadas.hoje }}h</span>
              <span class="resumo-label">Horas Hoje</span>
            </div>
          </div>
          <div class="resumo-card">
            <i class="fas fa-calendar-check"></i>
            <div class="resumo-info">
              <span class="resumo-valor">{{ registrosHoje.length }}</span>
              <span class="resumo-label">Registros Hoje</span>
            </div>
          </div>
        </div>
      </div>

      <div class="registros-hoje-card">
        <h3>Registros de Hoje</h3>
        
        <div v-if="registrosHoje.length > 0" class="registros-list">
          <div v-for="(registro, index) in registrosHoje" :key="index" class="registro-item">
            <div class="registro-info">
              <span class="registro-hora">{{ formatTime(registro.horario) }}</span>
              <span :class="['registro-tipo', registro.tipo.toLowerCase()]">
                {{ registro.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
              </span>
            </div>
            <button 
              @click="abrirModalAjuste(registro)" 
              class="btn-ajuste"
              title="Solicitar ajuste deste registro"
            >
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        <p v-else class="no-registros">Nenhum registro hoje</p>

        <!-- Alertas de Esquecimento -->
        <div class="alertas-section">
          <div class="card">
            <div class="card-header">
              <h3>Último Alerta de Esquecimento</h3>
              <router-link to="/historico-alertas" class="btn-historico">
                <i class="fas fa-history"></i>
                Ver Todos
              </router-link>
            </div>
            
            <div v-if="loadingAlertas" class="loading-spinner">
              <span class="spinner dark"></span>
              Carregando alertas...
            </div>

            <div v-else-if="!alertaMaisRecente" class="no-data">
              Nenhum alerta de esquecimento registrado.
            </div>

            <div v-else class="alertas-list">
              <div class="alerta-card">
                <div class="alerta-header">
                  <div class="alerta-data">
                    <i class="fas fa-calendar"></i>
                    {{ formatarData(alertaMaisRecente.data) }}
                  </div>
                  <div class="alerta-horario">
                    <i class="fas fa-clock"></i>
                    {{ formatTime(alertaMaisRecente.horario_previsto) }}
                  </div>
                  <div class="alerta-tipo">
                    <i class="fas fa-sign-in-alt" v-if="alertaMaisRecente.tipo === 'entrada'"></i>
                    <i class="fas fa-sign-out-alt" v-else></i>
                    {{ alertaMaisRecente.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                  </div>
                  <div class="alerta-status" :class="alertaMaisRecente.status">
                    {{ traduzirStatus(alertaMaisRecente.status) }}
                  </div>
                </div>

                <div class="alerta-body">
                  <strong>Justificativa:</strong>
                  <p>{{ alertaMaisRecente.justificativa }}</p>
                </div>

                <div v-if="alertaMaisRecente.observacao_coordenador" class="alerta-feedback">
                  <strong>Feedback do Coordenador:</strong>
                  <p>{{ alertaMaisRecente.observacao_coordenador }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="resumo-periodo-section">
      <button class="resumo-toggle" @click="toggleResumo">
        <span>Resumo do Período</span>
        <i :class="['fas', isResumoExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
      </button>
      
      <div v-show="isResumoExpanded" class="resumo-content">
        <div class="periodo-info">
          <span class="periodo-label">{{ formatDate(resumoMes.periodo?.inicio) }} até {{ formatDate(resumoMes.periodo?.fim) }}</span>
        </div>
        <div class="resumo-info-mes">
          <div class="info-item">
            <span class="info-label">Horas na Semana:</span>
            <span class="info-valor">{{ horasTrabalhadas.semana }}h</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dias Presentes:</span>
            <span class="info-valor">{{ resumoMes.diasTrabalhados }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Taxa de Frequência:</span>
            <span class="info-valor">{{ resumoMes.frequencia }}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Primeiro Registro:</span>
            <span class="info-valor">{{ formatDate(resumoMes.primeiroRegistro) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Último Registro:</span>
            <span class="info-valor">{{ formatDate(resumoMes.ultimoRegistro) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { onMounted, onUnmounted } from 'vue';
import { websocketService } from '../../services/websocket';

export default {
  name: 'RegistroPonto',
  data() {
    return {
      currentTime: '',
      currentDate: '',
      loading: false,
      statusMessage: '',
      statusClass: '',
      registrosHoje: [],
      clockInterval: null,
      horasTrabalhadas: { hoje: '0h', semana: '0h' },
      resumoDia: {},
      resumoMes: {},
      showModal: false,
      registroParaAjuste: null,
      novoHorario: '',
      justificativa: '',
      loadingAjuste: false,
      showModalEsquecimento: false,
      alertaData: '',
      alertaHorario: '',
      alertaTipo: 'entrada',
      alertaJustificativa: '',
      loadingAlerta: false,
      alertas: [],
      loadingAlertas: false,
      isResumoExpanded: false,
      alertaMaisRecente: null
    };
  },
  computed: {
    ultimoRegistro() {
      if (this.registrosHoje.length === 0) return null;
      return this.registrosHoje[this.registrosHoje.length - 1];
    },
    proximoTipoRegistro() {
      if (!this.ultimoRegistro) return 'entrada';
      return this.ultimoRegistro.tipo === 'entrada' ? 'saida' : 'entrada';
    },
    mensagemRegistro() {
      if (!this.ultimoRegistro) return 'Nenhum registro hoje';
      return `Último registro: ${this.ultimoRegistro.tipo === 'entrada' ? 'Entrada' : 'Saída'} às ${this.formatTime(this.ultimoRegistro.horario)}`;
    },
    botaoTexto() {
      if (this.loading) return 'Registrando...';
      return `Registrar ${this.proximoTipoRegistro === 'entrada' ? 'Entrada' : 'Saída'}`;
    },
    botaoClasse() {
      return this.proximoTipoRegistro === 'entrada' ? 'entrada' : 'saida';
    },
    hoje() {
      return new Date().toISOString().split('T')[0];
    }
  },
  created() {
    this.updateDateTime();
    this.clockInterval = setInterval(this.updateDateTime, 1000);
    this.carregarDados();
  },
  beforeUnmount() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  },
  methods: {
    updateDateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('pt-BR');
      this.currentDate = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    async registrarPresenca() {
      this.loading = true;
      this.statusMessage = '';
      this.statusClass = '';

      try {
        const tipoRegistro = this.ultimoRegistro ? 
          (this.ultimoRegistro.tipo === 'entrada' ? 'saida' : 'entrada') : 
          'entrada';

        const response = await axios.post('http://localhost:8000/api/v1/registros', {
          tipo: tipoRegistro
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          this.statusMessage = `${tipoRegistro === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`;
          this.statusClass = 'success';
          await this.carregarDados();
        } else {
          this.statusMessage = response.data.message || 'Erro ao registrar ponto';
          this.statusClass = 'error';
        }
      } catch (err) {
        this.statusMessage = err.response?.data?.message || 'Erro ao registrar ponto';
        this.statusClass = 'error';
      } finally {
        this.loading = false;
        
        // Limpar a mensagem após 3 segundos
        if (this.statusClass === 'success') {
          setTimeout(() => {
            this.statusMessage = '';
            this.statusClass = '';
          }, 3000);
        }
      }
    },
    async carregarRegistrosHoje() {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/hoje', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          this.registrosHoje = response.data.data || [];
        }
      } catch (err) {
        console.error('Erro ao carregar registros:', err);
      }
    },
    async carregarHorasTrabalhadas() {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/horas', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          this.horasTrabalhadas = {
            hoje: response.data.data.horasHoje,
            semana: response.data.data.horasSemana
          };
        }
      } catch (err) {
        console.error('Erro ao carregar horas trabalhadas:', err);
      }
    },
    async carregarResumo() {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/resumo', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const meuResumo = response.data.data.resumos[0] || {};
          this.resumoDia = {
            registros: this.registrosHoje.length,
            horasHoje: this.horasTrabalhadas.hoje || 0
          };
          this.resumoMes = {
            diasTrabalhados: meuResumo.dias_presenca || 0,
            frequencia: meuResumo.porcentagem_presenca || 0,
            periodo: response.data.data.periodo,
            primeiroRegistro: meuResumo.primeiro_registro,
            ultimoRegistro: meuResumo.ultimo_registro
          };
        }
      } catch (err) {
        console.error('Erro ao carregar resumo:', err);
      }
    },
    async carregarDados() {
      try {
        // Carregar todos os dados necessários
        await Promise.all([
          this.carregarRegistrosHoje(),
          this.carregarHorasTrabalhadas(),
          this.carregarResumo()
        ]);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    },
    formatTime(timeString) {
      if (!timeString) return '';
      // Se a hora já estiver no formato HH:MM, retorna ela mesma
      if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      // Se for um objeto Date ou string ISO, converte para HH:MM
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        // Se não for uma data válida, tenta extrair as horas e minutos da string
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${horas}:${minutos}`;
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('pt-BR');
    },
    abrirModalAjuste(registro) {
      this.registroParaAjuste = registro;
      // Formata a data/hora atual do registro para o formato do input datetime-local
      const dataHora = new Date(registro.horario);
      this.novoHorario = dataHora.toISOString().slice(0, 16);
      this.showModal = true;
    },
    fecharModal() {
      this.showModal = false;
      this.registroParaAjuste = null;
      this.novoHorario = '';
      this.justificativa = '';
    },
    async enviarSolicitacaoAjuste() {
      if (!this.novoHorario || !this.justificativa) return;
      
      this.loadingAjuste = true;
      try {
        // Garante que o ID seja um número inteiro usando + para conversão
        const registroId = +this.registroParaAjuste.id;
        
        // Verifica se é um número válido
        if (isNaN(registroId) || !Number.isInteger(registroId)) {
          throw new Error('ID do registro inválido');
        }

        // Log para debug
        console.log('ID original:', this.registroParaAjuste.id);
        console.log('ID convertido:', registroId);
        console.log('Tipo do ID:', typeof registroId);
        
        const payload = {
          registro_id: registroId,
          novo_horario: this.novoHorario,
          justificativa: this.justificativa
        };

        // Log do payload final
        console.log('Payload final:', JSON.stringify(payload));
        
        const response = await axios.post('http://localhost:8000/api/v1/registros/ajuste', payload, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.data.success) {
          this.statusMessage = 'Solicitação enviada com sucesso!';
          this.statusClass = 'success';
          this.fecharModal();
          await this.carregarRegistrosHoje();
        } else {
          this.statusMessage = response.data.message || 'Erro ao enviar solicitação';
          this.statusClass = 'error';
        }
      } catch (error) {
        this.statusMessage = error.response?.data?.message || error.message || 'Erro ao enviar solicitação';
        this.statusClass = 'error';
        console.error('Erro detalhado:', error.response?.data || error);
      } finally {
        this.loadingAjuste = false;
      }
    },
    abrirModalEsquecimento() {
      this.alertaData = new Date().toISOString().split('T')[0];
      this.alertaHorario = '';
      this.alertaTipo = 'entrada';
      this.alertaJustificativa = '';
      this.showModalEsquecimento = true;
    },
    fecharModalEsquecimento() {
      this.showModalEsquecimento = false;
      this.alertaData = '';
      this.alertaHorario = '';
      this.alertaTipo = 'entrada';
      this.alertaJustificativa = '';
    },
    async enviarAlertaEsquecimento() {
      if (!this.alertaData || !this.alertaHorario || !this.alertaTipo || !this.alertaJustificativa) return;

      this.loadingAlerta = true;
      try {
        const response = await axios.post('http://localhost:8000/api/v1/registros/alerta-esquecimento', {
          data: this.alertaData,
          horario_previsto: this.alertaHorario,
          tipo: this.alertaTipo,
          justificativa: this.alertaJustificativa
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          this.statusMessage = 'Alerta enviado com sucesso!';
          this.statusClass = 'success';
          this.fecharModalEsquecimento();
          await this.carregarAlertas();
        } else {
          this.statusMessage = response.data.message || 'Erro ao enviar alerta';
          this.statusClass = 'error';
        }
      } catch (error) {
        this.statusMessage = error.response?.data?.message || 'Erro ao enviar alerta';
        this.statusClass = 'error';
      } finally {
        this.loadingAlerta = false;
      }
    },
    async carregarAlertas() {
      console.log('Iniciando carregamento de alertas...');
      this.loadingAlertas = true;
      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/alerta-esquecimento', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Resposta da API:', response.data);

        if (response.data.success) {
          this.alertas = response.data.data || [];
          console.log('Alertas antes da ordenação:', this.alertas);
          
          // Ordena os alertas por data e pega o mais recente
          this.alertas.sort((a, b) => new Date(b.data) - new Date(a.data));
          console.log('Alertas após ordenação:', this.alertas);
          
          this.alertaMaisRecente = this.alertas[0] || null;
          console.log('Alerta mais recente antes da formatação:', this.alertaMaisRecente);
          
          // Se tiver um alerta mais recente, formata o horário
          if (this.alertaMaisRecente) {
            const horarioFormatado = this.formatarHora(this.alertaMaisRecente.horario_previsto);
            console.log('Horário formatado:', horarioFormatado);
            
            this.alertaMaisRecente = {
              ...this.alertaMaisRecente,
              horario_previsto: horarioFormatado
            };
          }
          
          console.log('Alerta mais recente após formatação:', this.alertaMaisRecente);
        } else {
          console.log('Resposta da API não foi bem-sucedida:', response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        if (error.response) {
          console.error('Detalhes do erro:', error.response.data);
        }
      } finally {
        this.loadingAlertas = false;
      }
    },
    formatarHora(hora) {
      if (!hora) return '';
      // Se a hora já estiver no formato HH:MM, retorna ela mesma
      if (typeof hora === 'string' && hora.match(/^\d{2}:\d{2}$/)) {
        return hora;
      }
      // Se for um objeto Date ou string ISO, converte para HH:MM
      const date = new Date(hora);
      if (isNaN(date.getTime())) {
        // Se não for uma data válida, tenta extrair as horas e minutos da string
        const [hours, minutes] = hora.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${horas}:${minutos}`;
    },
    formatarData(data) {
      return new Date(data).toLocaleDateString('pt-BR');
    },
    traduzirStatus(status) {
      const traducoes = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
      };
      return traducoes[status] || status;
    },
    toggleResumo() {
      this.isResumoExpanded = !this.isResumoExpanded;
    }
  },
  async mounted() {
    await this.carregarDados();
    await this.carregarAlertas();
    this.updateDateTime();
    this.clockInterval = setInterval(this.updateDateTime, 1000);

    const handleWebSocketMessage = (payload) => {
      if (payload.type === 'registro_atualizado') {
        this.carregarDados();
      }
    };

    onMounted(() => {
      websocketService.subscribe('registro_atualizado', handleWebSocketMessage);
    });

    onUnmounted(() => {
      websocketService.unsubscribe('registro_atualizado', handleWebSocketMessage);
    });
  }
};
</script>

<style scoped>
.registro-ponto-container {
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
}

.registro-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.registro-card,
.registros-hoje-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.registro-card h2,
.registros-hoje-card h3 {
  margin: 0 0 2rem 0;
  color: #333;
  font-size: 1.5rem;
  text-align: center;
}

.registros-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.alertas-section {
  margin-top: auto;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.alertas-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.1rem;
}

.no-registros {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 1rem 0;
}

.status-section {
  text-align: center;
  margin-bottom: 2rem;
}

.time-display {
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.date-display {
  font-size: 1.2rem;
  color: #666;
  text-transform: capitalize;
}

.registro-status {
  text-align: center;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.registro-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.registro-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.registro-status.info {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.registro-button {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.registro-button.entrada {
  background-color: #28a745;
}

.registro-button.entrada:hover:not(:disabled) {
  background-color: #218838;
}

.registro-button.saida {
  background-color: #dc3545;
}

.registro-button.saida:hover:not(:disabled) {
  background-color: #c82333;
}

.registro-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.resumo-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.resumo-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.resumo-card i {
  font-size: 1.5rem;
  color: #007bff;
}

.resumo-info {
  display: flex;
  flex-direction: column;
}

.resumo-valor {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}

.resumo-label {
  font-size: 0.875rem;
  color: #666;
}

.registro-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.registro-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.registro-hora {
  font-weight: 600;
  color: #007bff;
}

.registro-tipo {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.registro-tipo.entrada {
  background-color: #d4edda;
  color: #155724;
}

.registro-tipo.saida {
  background-color: #f8d7da;
  color: #721c24;
}

.resumo-info-mes {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
}

.info-valor {
  font-weight: 600;
  color: #333;
}

.periodo-info {
  text-align: center;
  margin-bottom: 1rem;
}

.periodo-label {
  font-size: 0.9rem;
  color: #666;
  background-color: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
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

.modal-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.form-control:focus {
  outline: none;
  border-color: #FF6B00;
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.1);
}

textarea.form-control {
  min-height: 120px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B00 0%, #FF9E4F 100%);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: var(--text-color);
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #d0d0d0;
}

.registro-atual {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.05) 0%, rgba(255, 158, 79, 0.05) 100%);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-ajuste {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-ajuste:hover {
  color: #FF6B00;
  background: rgba(255, 107, 0, 0.1);
  transform: scale(1.1);
}

.btn-ajuste i {
  font-size: 1.25rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.spinner.dark {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: var(--text-color);
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: #f8f9fa;
  border-radius: 16px;
  font-weight: 500;
}

.alertas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alerta-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.alerta-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.alerta-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.alerta-header > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.alerta-header i {
  font-size: 1rem;
  color: #FF6B00;
}

.alerta-status {
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  text-align: center;
  font-size: 0.875rem;
}

.alerta-status.pendente {
  background: linear-gradient(135deg, #FFF3CD 0%, #FFE5A3 100%);
  color: #856404;
}

.alerta-status.aprovado {
  background: linear-gradient(135deg, #D4EDDA 0%, #C3E6CB 100%);
  color: #155724;
}

.alerta-status.rejeitado {
  background: linear-gradient(135deg, #F8D7DA 0%, #F5C6CB 100%);
  color: #721C24;
}

.alerta-body,
.alerta-feedback {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.alerta-body strong,
.alerta-feedback strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 600;
}

.alerta-body p,
.alerta-feedback p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.resumo-periodo-section {
  max-width: 1200px;
  margin: 2rem auto 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.resumo-toggle {
  width: 100%;
  padding: 1rem 2rem;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  transition: background-color 0.3s ease;
}

.resumo-toggle:hover {
  background-color: #f8f9fa;
}

.resumo-toggle i {
  transition: transform 0.3s ease;
}

.resumo-content {
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
}

.alertas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-ver-todos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #007bff;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-ver-todos:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.btn-ver-todos i {
  font-size: 0.875rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-historico {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-historico:hover {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
    border-radius: 20px;
    width: 95%;
  }

  .alerta-header {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    min-width: 100px;
  }
}

.registro-button.esquecimento {
  background: linear-gradient(135deg, #4A5568 0%, #2D3748 100%);
  color: white;
  margin-left: 1rem;
}

.registro-button.esquecimento:hover:not(:disabled) {
  background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(45, 55, 72, 0.2);
}

.registro-button.esquecimento i {
  margin-right: 0.5rem;
  color: #FCD34D;
}
</style> 