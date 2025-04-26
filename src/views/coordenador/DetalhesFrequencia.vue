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
        <!-- Card de Informações do Aluno (Esquerda) -->
        <div class="aluno-card">
          <div class="aluno-header">
            <i class="fas fa-user-graduate"></i>
            <h3>{{ aluno.nome }}</h3>
          </div>
          <div class="aluno-info">
            <div class="info-item">
              <span class="info-label">Matrícula:</span>
              <span class="info-value">{{ aluno.matricula }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Frequência Total:</span>
              <div class="frequencia-barra">
                <div 
                  class="frequencia-valor" 
                  :style="{ width: estatisticas.porcentagem_presenca + '%' }"
                  :class="getFrequenciaClass(estatisticas.porcentagem_presenca)"
                >
                  {{ estatisticas.porcentagem_presenca }}%
                </div>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">Dias Presentes:</span>
              <span class="info-value">{{ estatisticas.dias_presenca }} / {{ periodo.total_dias }} dias</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total de Horas:</span>
              <span class="info-value">{{ estatisticas.total_horas_trabalhadas }}h</span>
            </div>
          </div>
        </div>

        <!-- Conteúdo da Direita -->
        <div class="content-right">
          <!-- Seção de Registros de Hoje -->
          <div class="registros-hoje">
            <div class="section-header">
              <i class="fas fa-clock"></i>
              <h3>Registros de Hoje</h3>
            </div>
            <div class="registro-card">
              <div class="registro-info">
                <div class="registro-linha">
                  <span class="registro-label">Entrada:</span>
                  <span class="registro-hora">{{ registrosDeHoje[0]?.entrada || '-' }}</span>
                </div>
                <div class="registro-linha">
                  <span class="registro-label">Saída:</span>
                  <span class="registro-hora">{{ registrosDeHoje[0]?.saida || '-' }}</span>
                </div>
              </div>
              <div class="registro-data">
                <span class="dia-semana">{{ registrosDeHoje[0]?.dia_semana }}</span>
                <span class="data">{{ formatarData(registrosDeHoje[0]?.data) }}</span>
              </div>
            </div>
          </div>

          <!-- Seção de Histórico -->
          <div class="historico">
            <div class="section-header">
              <i class="fas fa-history"></i>
              <h3>Histórico de Registros</h3>
            </div>
            <div class="table-responsive">
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
                    <td>{{ registro.dia_semana }}</td>
                    <td>{{ registro.entrada || '-' }}</td>
                    <td>{{ registro.saida || '-' }}</td>
                    <td>{{ registro.total_horas || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
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
    const registrosDeHoje = ref([]);

    const buscarRegistrosDeHoje = async () => {
      try {
        const alunoId = route.params.id;
        const hoje = new Date().toISOString().split('T')[0];
        
        const response = await axios.get(`http://localhost:8000/api/v1/gerenciador/alunos/${alunoId}/frequencia`, {
          params: {
            data_inicio: hoje,
            data_fim: hoje
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success' && response.data.data.registros) {
          registrosDeHoje.value = response.data.data.registros;
        }
      } catch (err) {
        console.error('Erro ao buscar registros de hoje:', err);
      }
    };

    const buscarFrequencia = async (pagina = 1) => {
      loading.value = true;
      error.value = '';

      try {
        const alunoId = route.params.id;
        let url = `http://localhost:8000/api/v1/gerenciador/alunos/${alunoId}/frequencia`;
        let params = {};

        // Lógica de filtro ajustada
        if (filtro.value.periodo === 'custom' && filtro.value.dataInicio && filtro.value.dataFim) {
          params = {
            data_inicio: filtro.value.dataInicio,
            data_fim: filtro.value.dataFim
          };
        } else if (filtro.value.periodo === 'hoje') {
          const hoje = new Date().toISOString().split('T')[0];
          params = {
            data_inicio: hoje,
            data_fim: hoje
          };
        } else if (filtro.value.periodo !== 'custom') {
          const hoje = new Date();
          const dataFim = hoje.toISOString().split('T')[0];
          
          hoje.setDate(hoje.getDate() - parseInt(filtro.value.periodo));
          const dataInicio = hoje.toISOString().split('T')[0];
          
          params = {
            data_inicio: dataInicio,
            data_fim: dataFim
          };
        }

        if (pagina > 1) {
          params.page = pagina;
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
          estatisticas.value = response.data.data.estatisticas || {
            dias_presenca: 0,
            porcentagem_presenca: 0,
            total_horas_trabalhadas: 0
          };
          periodo.value = response.data.data.periodo || {
            total_dias: 0
          };
        } else {
          error.value = response.data.message || 'Erro ao carregar dados de frequência';
        }
      } catch (err) {
        console.error('Erro na requisição:', err);
        error.value = err.response?.data?.message || 'Erro ao carregar dados de frequência. Tente novamente.';
      } finally {
        loading.value = false;
      }
    };

    // Observador para mudanças no período
    watch(() => filtro.value.periodo, (novoPeriodo) => {
      if (novoPeriodo === 'custom') {
        return;
      }
      buscarFrequencia(1);
    });

    const inicializarDatas = () => {
      const hoje = new Date();
      filtro.value.dataFim = hoje.toISOString().split('T')[0];
      hoje.setDate(hoje.getDate() - 7);
      filtro.value.dataInicio = hoje.toISOString().split('T')[0];
    };

    const formatarData = (data) => {
      if (!data) return '-';
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    };

    const formatarHora = (hora) => {
      if (!hora) return '-';
      return hora.substring(0, 5); // Retorna apenas HH:mm
    };

    const traduzirDiaSemana = (dia) => {
      return dia; // Já está em português no response
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
      inicializarDatas();
      buscarFrequencia(1);
      buscarRegistrosDeHoje();
    });

    // Atualizar registros de hoje a cada minuto
    const intervalId = setInterval(buscarRegistrosDeHoje, 60000);
    onUnmounted(() => {
      clearInterval(intervalId);
    });

    return {
      loading,
      error,
      aluno,
      registros,
      registrosDeHoje,
      estatisticas,
      periodo,
      filtro,
      paginacao,
      buscarFrequencia,
      formatarData,
      formatarHora,
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.aluno-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.aluno-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.aluno-header i {
  font-size: 2rem;
  color: #3182CE;
}

.aluno-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2D3748;
  margin: 0;
}

.aluno-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  color: #718096;
  font-size: 0.9rem;
}

.info-value {
  color: #2D3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.frequencia-barra {
  background: #FED7D7;
  border-radius: 9999px;
  height: 2rem;
  overflow: hidden;
}

.frequencia-valor {
  height: 100%;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
  color: #9B2C2C;
  transition: width 0.3s ease;
}

.frequencia-valor.baixa {
  background: #FED7D7;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-header i {
  color: #3182CE;
  font-size: 1.25rem;
}

.section-header h3 {
  color: #2D3748;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.registro-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.registro-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.registro-linha {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.registro-label {
  color: #4A5568;
  font-weight: 500;
  min-width: 70px;
}

.registro-hora {
  color: #2D3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.registro-data {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.dia-semana {
  color: #4A5568;
  font-weight: 500;
  text-transform: capitalize;
}

.data {
  color: #718096;
  font-size: 0.875rem;
}

.table-responsive {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #F7FAFC;
  padding: 1rem;
  text-align: left;
  color: #4A5568;
  font-weight: 600;
  white-space: nowrap;
}

td {
  padding: 1rem;
  color: #2D3748;
  border-bottom: 1px solid #E2E8F0;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: #F7FAFC;
}

.registros-hoje {
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.3s ease;
}

.registros-hoje h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #2d3748;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.registros-hoje h3 i {
  color: #4299e1;
}

.registros-hoje-card {
  display: grid;
  gap: 1rem;
}

.registro-hoje-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.registro-hoje-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tempo-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tempo-info .label {
  font-weight: 500;
  color: #4a5568;
  min-width: 70px;
}

.tempo-info .hora {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.dia-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.dia-info .dia-semana {
  font-weight: 500;
  color: #4a5568;
  text-transform: capitalize;
}

.dia-info .data {
  font-size: 0.875rem;
  color: #718096;
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
    grid-template-columns: 1fr;
  }

  .aluno-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    gap: 1rem;
  }

  .content-right {
    gap: 1rem;
  }

  .aluno-card,
  .registro-card {
    padding: 1.25rem;
  }

  .registro-card {
    flex-direction: column;
    gap: 1rem;
  }

  .registro-data {
    align-items: flex-start;
    margin-top: 0.5rem;
  }

  .table-responsive {
    margin: 0;
    border-radius: 12px;
  }

  table {
    min-width: 600px;
  }
}
</style> 