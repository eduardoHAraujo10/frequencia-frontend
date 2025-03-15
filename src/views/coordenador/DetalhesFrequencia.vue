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
      <!-- Filtros de Período -->
      <div class="filtros">
        <div class="periodo-select">
          <label>
            <i class="fas fa-calendar-alt"></i>
            Período:
          </label>
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
            <label>
              <i class="fas fa-calendar-day"></i>
              De:
            </label>
            <input type="date" v-model="filtro.dataInicio" />
          </div>
          <div class="date-input">
            <label>
              <i class="fas fa-calendar-day"></i>
              Até:
            </label>
            <input type="date" v-model="filtro.dataFim" />
          </div>
        </div>

        <button @click="buscarFrequencia(1)" class="filter-button">
          <i class="fas fa-search"></i>
          Buscar
        </button>
      </div>

      <div class="main-content">
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

        <!-- Histórico de Registros -->
        <div class="registros-section">
          <h3>
            <i class="fas fa-history"></i>
            Histórico de Registros
          </h3>
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
  animation: fadeIn 0.3s ease;
}

.detalhes-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.voltar-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.voltar-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 55, 72, 0.2);
}

.detalhes-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
}

.filtros {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.periodo-select {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.periodo-select label {
  white-space: nowrap;
}

select {
  min-width: 300px;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.main-content {
  display: flex;
  gap: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.aluno-info {
  width: 300px;
  flex-shrink: 0;
}

.info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-header i {
  font-size: 2.5rem;
  color: #4299e1;
}

.info-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item .label {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
}

.info-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.registros-section {
  flex: 1;
}

.registros-section h3 {
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  font-weight: 600;
  color: #4a5568;
  background: #f8fafc;
}

tr:hover td {
  background: #f8fafc;
}

.frequencia-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.frequencia-badge.alta {
  background: #d1fae5;
  color: #065f46;
}

.frequencia-badge.media {
  background: #fef3c7;
  color: #92400e;
}

.frequencia-badge.baixa {
  background: #fee2e2;
  color: #991b1b;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.no-data i {
  font-size: 3.5rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
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

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  text-align: center;
  color: #dc2626;
  padding: 1.5rem;
  background: #fee2e2;
  border-radius: 12px;
  border: 1px solid #fecaca;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .aluno-info {
    width: 100%;
  }

  .info-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filtros {
    flex-direction: column;
    align-items: stretch;
  }

  .periodo-select {
    flex-direction: column;
    align-items: stretch;
  }

  select {
    width: 100%;
    min-width: auto;
  }

  .filter-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 