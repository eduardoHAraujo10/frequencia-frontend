<template>
  <div class="registro-ponto-container">
    <div class="registro-card">
      <h2>Registro de Ponto</h2>
      
      <div class="status-section">
        <div class="time-display">
          {{ currentTime }}
        </div>
        <div class="date-display">
          {{ currentDate }}
        </div>
      </div>

      <div v-if="statusMessage" :class="['registro-status', statusClass]">
        {{ statusMessage }}
      </div>

      <div class="button-group">
        <button 
          @click="registrarPonto('entrada')" 
          class="registro-button entrada"
          :disabled="loading || !podeRegistrarEntrada"
        >
          <span v-if="loading && tipoRegistro === 'entrada'" class="spinner"></span>
          {{ loading && tipoRegistro === 'entrada' ? 'Registrando...' : 'Registrar Entrada' }}
        </button>

        <button 
          @click="registrarPonto('saida')" 
          class="registro-button saida"
          :disabled="loading || !podeRegistrarSaida"
        >
          <span v-if="loading && tipoRegistro === 'saida'" class="spinner"></span>
          {{ loading && tipoRegistro === 'saida' ? 'Registrando...' : 'Registrar Saída' }}
        </button>
      </div>

      <div class="registros-hoje">
        <h3>Registros de Hoje</h3>
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

        <div v-if="registrosHoje.length > 0" class="registros-list">
          <div v-for="(registro, index) in registrosHoje" :key="index" class="registro-item">
            <span class="registro-hora">{{ formatTime(registro.horario) }}</span>
            <span :class="['registro-tipo', registro.tipo.toLowerCase()]">
              {{ registro.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
            </span>
          </div>
        </div>
        <p v-else class="no-registros">Nenhum registro hoje</p>

        <div class="historico-section">
          <h3>Resumo do Período</h3>
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
  </div>
</template>

<script>
import axios from 'axios';

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
      tipoRegistro: null,
      horasTrabalhadas: { hoje: '0h', semana: '0h' },
      resumoDia: {},
      resumoMes: {},
    };
  },
  computed: {
    podeRegistrarEntrada() {
      if (this.registrosHoje.length === 0) return true;
      return this.registrosHoje[this.registrosHoje.length - 1].tipo === 'saida';
    },
    podeRegistrarSaida() {
      if (this.registrosHoje.length === 0) return false;
      return this.registrosHoje[this.registrosHoje.length - 1].tipo === 'entrada';
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
    async registrarPonto(tipo) {
      this.loading = true;
      this.tipoRegistro = tipo;
      this.statusMessage = '';
      this.statusClass = '';

      try {
        const response = await axios.post('http://localhost:8000/api/v1/registros', {
          tipo: tipo
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          this.statusMessage = `Ponto de ${tipo === 'entrada' ? 'entrada' : 'saída'} registrado com sucesso!`;
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
        this.tipoRegistro = null;
        
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
      return new Date(timeString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('pt-BR');
    }
  }
};
</script>

<style scoped>
.registro-ponto-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f5f5;
}

.registro-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

h2 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
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

.registros-hoje {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

h3 {
  color: #444;
  margin-bottom: 1rem;
  text-align: center;
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

.registros-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.registro-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
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

.no-registros {
  text-align: center;
  color: #666;
  font-style: italic;
}

.historico-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
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

@media (max-width: 480px) {
  .registro-card {
    padding: 1.5rem;
  }

  .time-display {
    font-size: 2.5rem;
  }

  .date-display {
    font-size: 1rem;
  }

  .resumo-section {
    grid-template-columns: 1fr;
  }
}
</style> 