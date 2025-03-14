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
}

.historico-header {
  margin-bottom: 2rem;
}

.historico-header h2 {
  margin-bottom: 1rem;
  color: #333;
}

.filtros {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.periodo-select, .date-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #444;
}

select, input[type="date"] {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.filter-button:active {
  transform: translateY(0);
}

.resumo-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resumo-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.resumo-item:hover {
  transform: translateY(-2px);
}

.resumo-item i {
  font-size: 2rem;
  color: #007bff;
}

.resumo-info {
  display: flex;
  flex-direction: column;
}

.label {
  color: #666;
  font-size: 0.875rem;
}

.value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.registros-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.dia-registro {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.dia-registro:hover {
  transform: translateY(-2px);
}

.data-header {
  background-color: #007bff;
  padding: 1rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
  text-align: center;
  font-size: 1.1rem;
}

.registros-dia {
  padding: 1rem;
}

.registro-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  border: 1px solid #eee;
  transition: background-color 0.2s ease;
}

.registro-item:hover {
  background-color: #e9ecef;
}

.registro-item:last-child {
  margin-bottom: 0;
}

.registro-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hora {
  font-weight: 600;
  color: #007bff;
  font-size: 1.1rem;
}

.tipo {
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.tipo.entrada {
  background-color: #d4edda;
  color: #155724;
}

.tipo.saida {
  background-color: #f8d7da;
  color: #721c24;
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
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.no-data i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.no-data p {
  font-size: 1.1rem;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .historico-container {
    padding: 1rem;
  }

  .filtros {
    flex-direction: column;
  }

  .date-range {
    flex-direction: column;
    gap: 1rem;
  }

  select, input[type="date"] {
    min-width: 100%;
  }

  .resumo-card {
    grid-template-columns: 1fr;
  }

  .registros-list {
    grid-template-columns: 1fr;
  }

  .filter-button {
    width: 100%;
  }
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #666;
}

.registros-info {
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.no-registros {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.date-range {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0;
}

.date-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input label {
  margin-bottom: 0;
  white-space: nowrap;
}

.date-input input[type="date"] {
  width: auto;
  min-width: 150px;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .date-range {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .date-input {
    flex: 1;
    min-width: 200px;
  }
}
</style> 