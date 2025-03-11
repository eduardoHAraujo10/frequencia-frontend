<template>
  <div class="frequencia-container">
    <div class="frequencia-header">
      <h2>Controle de Frequência</h2>
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
    </div>

    <div class="loading-indicator" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando dados de frequência...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else>
      <div class="resumo-geral">
        <div class="resumo-card">
          <div class="resumo-item">
            <i class="fas fa-users"></i>
            <div class="resumo-info">
              <span class="label">Total de Alunos</span>
              <span class="value">{{ totalAlunos }}</span>
            </div>
          </div>
          <div class="resumo-item">
            <i class="fas fa-user-check"></i>
            <div class="resumo-info">
              <span class="label">Alunos Presentes Hoje</span>
              <span class="value">{{ alunosPresentes }}</span>
            </div>
          </div>
          <div class="resumo-item">
            <i class="fas fa-chart-line"></i>
            <div class="resumo-info">
              <span class="label">Média de Frequência</span>
              <span class="value">{{ mediaFrequencia }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="frequencia-table">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Matrícula</th>
              <th>Dias Presentes</th>
              <th>Frequência</th>
              <th>Primeiro Registro</th>
              <th>Último Registro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aluno in alunos" :key="aluno.id">
              <td>{{ aluno.nome }}</td>
              <td>{{ aluno.matricula }}</td>
              <td>{{ aluno.dias_presenca }} / {{ periodo.total_dias }}</td>
              <td>
                <span :class="['frequencia-badge', getFrequenciaClass(aluno.porcentagem_presenca)]">
                  {{ aluno.porcentagem_presenca }}%
                </span>
              </td>
              <td>{{ formatarDataHora(aluno.primeiro_registro) }}</td>
              <td>{{ formatarDataHora(aluno.ultimo_registro) }} ({{ aluno.ultimo_registro_horario }})</td>
              <td>
                <button @click="verDetalhes(aluno.id)" class="action-button">
                  <i class="fas fa-eye"></i>
                  Ver Detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!alunos.length" class="no-data">
        <i class="fas fa-user-clock"></i>
        <p>Nenhum dado de frequência encontrado para o período selecionado</p>
      </div>

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
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'ControleFrequencia',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    const alunos = ref([]);
    const periodo = ref({
      inicio: '',
      fim: '',
      total_dias: 0
    });
    const resumo = ref({
      total_alunos: 0,
      presentes_hoje: 0,
      media_frequencia: 0
    });
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

    const totalAlunos = computed(() => alunos.value.length);
    const alunosPresentes = computed(() => {
      const hoje = new Date().toISOString().split('T')[0];
      return alunos.value.filter(aluno => 
        aluno.ultimo_registro && aluno.ultimo_registro.startsWith(hoje)
      ).length;
    });
    const mediaFrequencia = computed(() => {
      if (!alunos.value.length) return 0;
      const total = alunos.value.reduce((acc, aluno) => acc + aluno.porcentagem_presenca, 0);
      return Math.round(total / alunos.value.length);
    });

    const buscarFrequencia = async (pagina = 1) => {
      loading.value = true;
      error.value = '';

      try {
        let url = 'http://localhost:8000/api/v1/registros/resumo';
        const params = {
          page: pagina
        };

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
          alunos.value = response.data.data.resumos || [];
          periodo.value = response.data.data.periodo || {
            inicio: '',
            fim: '',
            total_dias: 0
          };

          // Calcular paginação local
          const totalPaginas = Math.ceil(alunos.value.length / paginacao.value.porPagina);
          paginacao.value = {
            total: alunos.value.length,
            porPagina: 15,
            paginaAtual: pagina,
            ultimaPagina: totalPaginas
          };

          // Aplicar paginação local
          const inicio = (pagina - 1) * paginacao.value.porPagina;
          const fim = inicio + paginacao.value.porPagina;
          alunos.value = alunos.value.slice(inicio, fim);
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

    const formatarDataHora = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const getFrequenciaClass = (frequencia) => {
      if (frequencia >= 75) return 'alta';
      if (frequencia >= 50) return 'media';
      return 'baixa';
    };

    const verDetalhes = (alunoId) => {
      router.push(`/aluno/${alunoId}/frequencia`);
    };

    onMounted(() => {
      buscarFrequencia();
    });

    return {
      loading,
      error,
      alunos,
      periodo,
      filtro,
      paginacao,
      totalAlunos,
      alunosPresentes,
      mediaFrequencia,
      buscarFrequencia,
      formatarDataHora,
      getFrequenciaClass,
      verDetalhes
    };
  }
};
</script>

<style scoped>
.frequencia-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.frequencia-header {
  margin-bottom: 2rem;
}

.frequencia-header h2 {
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
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

.frequencia-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
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

tr:hover {
  background-color: #f8f9fa;
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

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: #0056b3;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .frequencia-container {
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