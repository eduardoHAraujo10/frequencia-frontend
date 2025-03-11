<template>
  <div class="detalhes-container">
    <div class="detalhes-header">
      <div class="voltar-button" @click="voltar">
        <i class="fas fa-arrow-left"></i>
        Voltar
      </div>
      <h2>Detalhes de Frequência</h2>
    </div>

    <div class="loading-indicator" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando dados do aluno...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="content">
      <!-- Informações do Aluno -->
      <div class="aluno-info">
        <div class="info-card">
          <div class="info-header">
            <i class="fas fa-user-graduate"></i>
            <h3>{{ aluno.nome }}</h3>
          </div>
          <div class="info-content">
            <div class="info-item">
              <span class="label">Matrícula:</span>
              <span class="value">{{ aluno.matricula }}</span>
            </div>
            <div class="info-item">
              <span class="label">Frequência Total:</span>
              <span :class="['value', 'frequencia-badge', getFrequenciaClass(estatisticas.porcentagem_presenca)]">
                {{ estatisticas.porcentagem_presenca }}%
              </span>
            </div>
            <div class="info-item">
              <span class="label">Dias Presentes:</span>
              <span class="value">{{ estatisticas.dias_presenca }} / {{ periodo.total_dias }} dias</span>
            </div>
            <div class="info-item">
              <span class="label">Total de Horas:</span>
              <span class="value">{{ estatisticas.total_horas_trabalhadas }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros de Período -->
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

        <button @click="buscarFrequencia(1)" class="filter-button">
          <i class="fas fa-search"></i>
          Buscar
        </button>
      </div>

      <!-- Histórico de Registros -->
      <div class="registros-section">
        <h3>Histórico de Registros</h3>
        <div class="registros-table">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dia da Semana</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Horas Trabalhadas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="registro in registros" :key="registro.data">
                <td>{{ formatarData(registro.data) }}</td>
                <td>{{ traduzirDiaSemana(registro.dia_semana) }}</td>
                <td>{{ registro.entrada || '-' }}</td>
                <td>{{ registro.saida || '-' }}</td>
                <td>{{ registro.horas_trabalhadas || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!registros.length" class="no-data">
          <i class="fas fa-calendar-times"></i>
          <p>Nenhum registro encontrado para o período selecionado</p>
        </div>

        <!-- Paginação -->
        <div v-if="paginacao.ultimaPagina > 1" class="paginacao">
          <button 
            class="page-button"
            :disabled="paginacao.paginaAtual === 1"
            @click="buscarFrequencia(paginacao.paginaAtual - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <span class="page-info">
            Página {{ paginacao.paginaAtual }} de {{ paginacao.ultimaPagina }}
          </span>
          
          <button 
            class="page-button"
            :disabled="paginacao.paginaAtual === paginacao.ultimaPagina"
            @click="buscarFrequencia(paginacao.paginaAtual + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

export default {
  name: 'DetalhesFrequencia',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const loading = ref(false);
    const error = ref('');
    const aluno = ref({});
    const registros = ref([]);
    const estatisticas = ref({
      dias_presenca: 0,
      dias_ausencia: 0,
      porcentagem_presenca: 0,
      total_horas_trabalhadas: 0
    });
    const periodo = ref({
      inicio: '',
      fim: '',
      total_dias: 0
    });
    const filtro = ref({
      periodo: 'hoje',
      dataInicio: '',
      dataFim: ''
    });
    const paginacao = ref({
      total: 0,
      porPagina: 15,
      paginaAtual: 1,
      ultimaPagina: 1
    });

    const buscarFrequencia = async (pagina = 1) => {
      loading.value = true;
      error.value = '';

      try {
        const alunoId = route.params.id;
        let url = `http://localhost:8000/api/v1/gerenciador/alunos/${alunoId}/frequencia`;
        const params = {};

        if (filtro.value.periodo === 'custom') {
          params.dataInicio = filtro.value.dataInicio;
          params.dataFim = filtro.value.dataFim;
        } else if (filtro.value.periodo === 'hoje') {
          const hoje = new Date();
          params.dataInicio = hoje.toISOString().split('T')[0];
          params.dataFim = hoje.toISOString().split('T')[0];
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
          aluno.value = response.data.data.aluno || {};
          registros.value = response.data.data.registros || [];
          estatisticas.value = response.data.data.estatisticas || {};
          periodo.value = response.data.data.periodo || {};
          
          if (response.data.data.pagination) {
            paginacao.value = {
              total: response.data.data.pagination.total,
              porPagina: response.data.data.pagination.per_page,
              paginaAtual: response.data.data.pagination.current_page,
              ultimaPagina: response.data.data.pagination.last_page
            };
          }
        } else {
          error.value = response.data.message || 'Erro ao carregar dados de frequência';
        }
      } catch (err) {
        error.value = 'Erro ao carregar dados de frequência. Tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const formatarData = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const traduzirDiaSemana = (dia) => {
      const dias = {
        'Sunday': 'Domingo',
        'Monday': 'Segunda-feira',
        'Tuesday': 'Terça-feira',
        'Wednesday': 'Quarta-feira',
        'Thursday': 'Quinta-feira',
        'Friday': 'Sexta-feira',
        'Saturday': 'Sábado'
      };
      return dias[dia] || dia;
    };

    const getFrequenciaClass = (frequencia) => {
      if (frequencia >= 75) return 'alta';
      if (frequencia >= 50) return 'media';
      return 'baixa';
    };

    const voltar = () => {
      router.back();
    };

    onMounted(() => {
      buscarFrequencia();
    });

    return {
      loading,
      error,
      aluno,
      registros,
      estatisticas,
      periodo,
      filtro,
      paginacao,
      buscarFrequencia,
      formatarData,
      traduzirDiaSemana,
      getFrequenciaClass,
      voltar
    };
  }
};
</script>

<style scoped>
.detalhes-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.detalhes-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;
}

.voltar-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.voltar-button:hover {
  color: #0056b3;
}

.aluno-info {
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-header i {
  font-size: 2rem;
  color: #007bff;
}

.info-header h3 {
  margin: 0;
  color: #333;
}

.info-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item .label {
  color: #666;
  font-size: 0.875rem;
}

.info-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.filtros {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
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
}

.registros-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.registros-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #444;
}

.tipo-badge, .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.tipo-badge.entrada {
  background-color: #d4edda;
  color: #155724;
}

.tipo-badge.saida {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.regular {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.atrasado {
  background-color: #fff3cd;
  color: #856404;
}

.frequencia-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.frequencia-badge.alta {
  background-color: #d4edda;
  color: #155724;
}

.frequencia-badge.media {
  background-color: #fff3cd;
  color: #856404;
}

.frequencia-badge.baixa {
  background-color: #f8d7da;
  color: #721c24;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
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

@media (max-width: 768px) {
  .detalhes-container {
    padding: 1rem;
  }

  .info-content {
    grid-template-columns: 1fr;
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

  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style> 