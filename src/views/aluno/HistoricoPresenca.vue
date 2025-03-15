<template>
  <div class="historico-container">
    <div class="historico-header">
      <h2>Histórico de Presença</h2>
      <div class="filtros">
        <div class="periodo-select">
          <label>Período:</label>
          <select v-model="filtro.periodo">
            <option value="hoje">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div v-if="filtro.periodo === 'custom'" class="date-range">
          <div class="date-input">
            <label>De:</label>
            <input type="date" v-model="filtro.dataInicio" />
          </div>
          <div class="date-input">
            <label>Até:</label>
            <input type="date" v-model="filtro.dataFim" />
          </div>
        </div>

        <button @click="buscarRegistros(1)" class="filter-button">
          <i class="fas fa-search"></i>
          Buscar
        </button>
      </div>
    </div>

    <div class="loading-indicator" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando registros...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else>
      <div class="resumo-card">
        <div class="resumo-item">
          <i class="fas fa-clock"></i>
          <div class="resumo-info">
            <span class="label">Total de Horas</span>
            <span class="value">{{ totalHoras }}</span>
          </div>
        </div>
        <div class="resumo-item">
          <i class="fas fa-calendar-check"></i>
          <div class="resumo-info">
            <span class="label">Dias Presentes</span>
            <span class="value">{{ diasPresentes }}</span>
          </div>
        </div>
        <div class="resumo-item">
          <i class="fas fa-percentage"></i>
          <div class="resumo-info">
            <span class="label">Frequência</span>
            <span class="value">{{ frequencia }}%</span>
          </div>
        </div>
        <div class="resumo-item">
          <i class="fas fa-calendar-day"></i>
          <div class="resumo-info">
            <span class="label">Média Diária</span>
            <span class="value">{{ mediaDiaria }}</span>
          </div>
        </div>
      </div>

      <div class="registros-list">
        <div v-for="(registrosDia, data) in registrosAgrupados" :key="data" class="dia-registro">
          <div class="data-header">
            {{ formatarData(data) }}
          </div>
          <div class="registros-dia">
            <div v-for="registro in registrosDia" :key="registro.id" class="registro-item">
              <div class="registro-info">
                <div class="tempo-info">
                  <span class="hora">{{ formatarHora(registro.horario) }}</span>
                </div>
              </div>
              <span :class="['tipo', registro.tipo.toLowerCase()]">
                {{ registro.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!registros.length" class="no-data">
        <i class="fas fa-calendar-times"></i>
        <p>Nenhum registro encontrado para o período selecionado</p>
      </div>

      <div v-if="paginacao.ultimaPagina > 1" class="paginacao">
        <button 
          class="page-button"
          :disabled="paginacao.paginaAtual === 1"
          @click="buscarRegistros(paginacao.paginaAtual - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="page-info">
          Página {{ paginacao.paginaAtual }} de {{ paginacao.ultimaPagina }}
        </span>
        
        <button 
          class="page-button"
          :disabled="paginacao.paginaAtual === paginacao.ultimaPagina"
          @click="buscarRegistros(paginacao.paginaAtual + 1)"
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
  name: 'HistoricoPresenca',
  setup() {
    const loading = ref(false);
    const error = ref('');
    const registros = ref([]);
    const paginacao = ref({
      total: 0,
      porPagina: 15,
      paginaAtual: 1,
      ultimaPagina: 1
    });
    const filtro = ref({
      periodo: 'hoje',
      dataInicio: '',
      dataFim: ''
    });
    const periodo = ref({
      inicio: '',
      fim: '',
      total_dias: 0
    });

    const buscarRegistros = async (pagina = 1) => {
      loading.value = true;
      error.value = '';

      try {
        let url = 'http://localhost:8000/api/v1/registros/historico';
        const params = {
          page: pagina
        };

        if (filtro.value.periodo === 'custom') {
          params.data_inicio = filtro.value.dataInicio;
          params.data_fim = filtro.value.dataFim;
        } else if (filtro.value.periodo === 'hoje') {
          const hoje = new Date();
          params.data_inicio = hoje.toISOString().split('T')[0];
          params.data_fim = hoje.toISOString().split('T')[0];
        } else {
          params.dias = filtro.value.periodo;
        }

        const response = await axios.get(url, {
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          registros.value = response.data.data.registros || [];
          paginacao.value = {
            total: response.data.data.pagination?.total || 0,
            porPagina: response.data.data.pagination?.per_page || 15,
            paginaAtual: response.data.data.pagination?.current_page || 1,
            ultimaPagina: response.data.data.pagination?.last_page || 1
          };
        } else {
          error.value = response.data.message || 'Erro ao carregar registros';
        }
      } catch (err) {
        error.value = 'Erro ao carregar registros. Tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // Agrupa registros por data
    const registrosAgrupados = computed(() => {
      const grupos = {};
      registros.value.forEach(registro => {
        const data = registro.horario.split('T')[0];
        if (!grupos[data]) {
          grupos[data] = [];
        }
        grupos[data].push(registro);
      });

      // Ordenar as datas em ordem decrescente e os registros de cada dia
      return Object.keys(grupos)
        .sort((a, b) => new Date(b) - new Date(a))
        .reduce((obj, key) => {
          obj[key] = grupos[key].sort((a, b) => 
            new Date(b.horario) - new Date(a.horario)
          );
          return obj;
        }, {});
    });

    // Calcula estatísticas
    const totalHoras = computed(() => {
      let total = 0;
      const registrosPorDia = {};
      
      // Agrupa registros por dia para calcular as horas
      registros.value.forEach(registro => {
        const data = registro.horario.split('T')[0];
        if (!registrosPorDia[data]) {
          registrosPorDia[data] = [];
        }
        registrosPorDia[data].push(registro);
      });

      Object.values(registrosPorDia).forEach(registrosDia => {
        let entradas = registrosDia.filter(r => r.tipo === 'entrada');
        let saidas = registrosDia.filter(r => r.tipo === 'saida');
        
        for (let i = 0; i < Math.min(entradas.length, saidas.length); i++) {
          let entrada = new Date(entradas[i].horario);
          let saida = new Date(saidas[i].horario);
          total += (saida - entrada) / (1000 * 60 * 60);
        }
      });
      
      return `${Math.round(total)}h`;
    });

    const diasPresentes = computed(() => {
      const diasUnicos = new Set(
        registros.value.map(registro => registro.horario.split('T')[0])
      );
      return diasUnicos.size;
    });

    const frequencia = computed(() => {
      if (filtro.value.periodo === 'custom') {
        const inicio = new Date(filtro.value.dataInicio);
        const fim = new Date(filtro.value.dataFim);
        const diasTotais = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        return Math.round((diasPresentes.value / diasTotais) * 100);
      } else {
        const diasPeriodo = parseInt(filtro.value.periodo) || 1;
        return Math.round((diasPresentes.value / diasPeriodo) * 100);
      }
    });

    const mediaDiaria = computed(() => {
      if (diasPresentes.value === 0) return '0h';
      const totalHorasNum = parseInt(totalHoras.value);
      const media = totalHorasNum / diasPresentes.value;
      return `${Math.round(media)}h`;
    });

    const formatarData = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatarHora = (hora) => {
      if (!hora) return '-';
      const data = new Date(hora);
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Carregar registros iniciais
    buscarRegistros();

    return {
      loading,
      error,
      filtro,
      registros,
      paginacao,
      periodo,
      totalHoras,
      diasPresentes,
      frequencia,
      mediaDiaria,
      buscarRegistros,
      formatarData,
      formatarHora,
      registrosAgrupados
    };
  }
};
</script>

<style scoped>
.historico-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

.historico-header {
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.historico-header h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
}

.filtros {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.periodo-select, .date-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

select, input[type="date"] {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
}

select:focus, input[type="date"]:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  outline: none;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  height: fit-content;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.resumo-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  animation: slideUp 0.3s ease;
}

.resumo-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.resumo-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.resumo-item i {
  font-size: 2.5rem;
  color: #4299e1;
  opacity: 0.9;
}

.resumo-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  color: #718096;
  font-size: 0.9rem;
}

.value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
}

.registros-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  animation: slideUp 0.4s ease;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.dia-registro {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dia-registro:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.data-header {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  padding: 1rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
  text-align: center;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.registros-dia {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.registro-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.registro-item:last-child {
  margin-bottom: 0;
}

.registro-item:hover {
  background: #edf2f7;
  transform: scale(1.02);
}

.registro-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hora {
  font-weight: 700;
  color: #4299e1;
  font-size: 1.2rem;
}

.tipo {
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.tipo.entrada {
  background-color: #c6f6d5;
  color: #276749;
}

.tipo.saida {
  background-color: #fed7d7;
  color: #9b2c2c;
}

.loading-indicator {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.error-message {
  text-align: center;
  color: #e53e3e;
  padding: 1.5rem;
  background-color: #fff5f5;
  border-radius: 12px;
  border: 1px solid #feb2b2;
  margin: 2rem 0;
}

.no-data {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  color: #718096;
  margin: 2rem 0;
}

.no-data i {
  font-size: 3rem;
  color: #a0aec0;
  margin-bottom: 1rem;
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
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
  font-size: 0.95rem;
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

@media (max-width: 1024px) {
  .registros-list {
    grid-template-columns: 1fr;
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .registros-list {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .dia-registro {
    margin-bottom: 1rem;
  }

  .historico-container {
    padding: 1rem;
  }

  .filtros {
    flex-direction: column;
    gap: 1rem;
  }

  .periodo-select, .date-input {
    min-width: 100%;
  }

  .filter-button {
    width: 100%;
  }

  .resumo-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .historico-header h2 {
    font-size: 1.5rem;
  }

  .value {
    font-size: 1.5rem;
  }

  .registro-item {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .registro-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 