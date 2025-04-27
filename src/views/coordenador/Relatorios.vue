<template>
  <div class="relatorios-container">
    <div class="header-actions">
      <h2>Relatórios</h2>
    </div>

    <!-- Filtros de Pesquisa -->
    <div class="filtros-section">
      <h3>Filtros</h3>
      <div class="filtros-grid">
        <div class="filtro-grupo periodo">
          <label>Período</label>
          <div class="date-inputs">
            <div class="date-input">
              <label>Data Inicial</label>
              <input type="date" v-model="filtros.dataInicial" />
            </div>
            <div class="date-input">
              <label>Data Final</label>
              <input type="date" v-model="filtros.dataFinal" />
            </div>
          </div>
        </div>

        <div class="filtros-busca">
          <div class="filtro-grupo">
            <label>Aluno</label>
            <div class="select-icon">
              <select v-model="filtros.alunoId">
                <option value="">Todos os Alunos</option>
                <option v-for="aluno in listaAlunos" :key="aluno.id" :value="aluno.id">
                  {{ aluno.nome }}
                </option>
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>

          <div class="filtro-grupo">
            <label>Matrícula</label>
            <div class="input-icon">
              <i class="fas fa-id-card"></i>
              <input 
                type="text" 
                v-model="filtros.matricula" 
                placeholder="Digite a matrícula"
              />
            </div>
          </div>

          <div class="filtro-grupo">
            <label>Status</label>
            <div class="select-icon">
              <select v-model="filtros.status">
                <option value="">Todos</option>
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
                <option value="justificado">Justificado</option>
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-indicator" v-if="loading">
      <div class="spinner"></div>
      <p>Gerando relatório...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="relatorio-content">
      <!-- Resumo Geral -->
      <div class="resumo-section">
        <h3>Resumo Geral</h3>
      <div class="summary-cards">
        <div class="summary-card">
            <i class="fas fa-users"></i>
          <div class="summary-info">
              <span class="summary-value">{{ resumoGeral.totalAlunosAtivos }}</span>
              <span class="summary-label">Alunos Ativos</span>
            </div>
        </div>
        <div class="summary-card">
            <i class="fas fa-user-check"></i>
          <div class="summary-info">
              <span class="summary-value">{{ resumoGeral.totalAlunosPresentes }}</span>
              <span class="summary-label">Alunos Presentes no Período</span>
            </div>
        </div>
        <div class="summary-card">
          <i class="fas fa-percentage"></i>
          <div class="summary-info">
              <span class="summary-value">{{ resumoGeral.mediaPresencaGeral }}%</span>
              <span class="summary-label">Média de Presença</span>
            </div>
          </div>
          <div class="summary-card">
            <i class="fas fa-clock"></i>
            <div class="summary-info">
              <span class="summary-value">{{ resumoGeral.totalHorasRegistradas }}h</span>
              <span class="summary-label">Total de Horas no Período</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela de Alunos -->
      <div class="tabela-section">
        <h3>Detalhamento por Aluno</h3>
      <div class="registros-table">
        <table>
          <thead>
            <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Dias Presentes</th>
                <th>% Presença</th>
                <th>Primeiro Registro</th>
                <th>Último Registro</th>
                <th>Horário Último Registro</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
              <template v-for="aluno in alunosDetalhados" :key="aluno.id">
                <tr @click="toggleDetalhes(aluno.id)" :class="{ 'expandido': alunoExpandido === aluno.id }" class="aluno-row">
                  <td>
                    <div class="nome-container">
                      <i class="fas" :class="alunoExpandido === aluno.id ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                      {{ aluno.nome }}
                    </div>
                  </td>
                  <td>{{ aluno.matricula }}</td>
                  <td>{{ aluno.diasPresenca }}</td>
                  <td>{{ aluno.porcentagemPresenca }}%</td>
                  <td>{{ formatarData(aluno.primeiroRegistro) }}</td>
                  <td>{{ formatarData(aluno.ultimoRegistro) }}</td>
                  <td>{{ formatarHora(aluno.horarioUltimoRegistro) }}</td>
                  <td>
                    <span :class="['status-badge', aluno.ativo ? 'ativo' : 'inativo']">
                      {{ aluno.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="alunoExpandido === aluno.id" class="detalhes-row">
                  <td colspan="8">
                    <div class="registros-detalhados">
                      <div class="periodo-detalhes">
                        <h4>Registros do Período</h4>
                        <div class="periodo-info-detalhes">
                          <i class="fas fa-calendar-alt"></i>
                          <span>Período: {{ periodo.inicio }} a {{ periodo.fim }}</span>
                        </div>
                      </div>
                      <table class="registros-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Entrada</th>
                            <th>Saída</th>
                            <th>Total de Horas</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="registro in aluno.registros" :key="registro.data">
                            <td>{{ registro.data }}</td>
                            <td>{{ registro.entrada || '-' }}</td>
                            <td>{{ registro.saida || '-' }}</td>
                            <td>{{ registro.total_horas || '-' }}</td>
                          </tr>
                          <tr v-if="aluno.registros.length === 0">
                            <td colspan="4" class="sem-registros">Nenhum registro encontrado no período</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Botões de Exportação -->
      <div class="export-actions">
        <button class="export-button pdf" @click="exportarPDF">
          <i class="fas fa-file-pdf"></i>
          Exportar PDF
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  name: 'Relatorios',
  setup() {
    const loading = ref(false);
    const error = ref('');
    const alunoExpandido = ref(null);
    const periodo = ref(null);
    const listaAlunos = ref([]);
    
    // Filtros
    const filtros = ref({
      dataInicial: '',
      dataFinal: '',
      alunoId: '',
      matricula: '',
      status: ''
    });

    // Dados do Relatório
    const resumoGeral = ref({
      totalAlunosAtivos: 0,
      totalAlunosPresentes: 0,
      mediaPresencaGeral: 0,
      totalHorasRegistradas: 0
    });

    const alunosDetalhados = ref([]);

    // Buscar lista de alunos
    const carregarAlunos = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/alunos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          listaAlunos.value = response.data.data.alunos || [];
        }
      } catch (err) {
        console.error('Erro ao carregar lista de alunos:', err);
      }
    };

    const gerarRelatorio = async () => {
      loading.value = true;
      error.value = '';

      try {
        const params = {
          data_inicio: filtros.value.dataInicial,
          data_fim: filtros.value.dataFinal,
          status: filtros.value.status || undefined
        };

        if (filtros.value.alunoId) {
          params.aluno_id = filtros.value.alunoId;
        }

        if (filtros.value.matricula) {
          params.matricula = filtros.value.matricula;
        }

        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/relatorio', {
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const { resumo, alunos, periodo: periodoData } = response.data.data;
          periodo.value = periodoData;
          
          resumoGeral.value = {
            totalAlunosAtivos: resumo.total_alunos,
            totalAlunosPresentes: resumo.presentes,
            mediaPresencaGeral: Number(resumo.media_presenca).toFixed(1),
            totalHorasRegistradas: Number(resumo.total_horas).toFixed(2)
          };

          let alunosFiltrados = alunos;
          
          if (filtros.value.alunoId) {
            alunosFiltrados = alunos.filter(aluno => aluno.id === parseInt(filtros.value.alunoId));
          }

          alunosDetalhados.value = alunosFiltrados.map(aluno => {
            return {
              ...aluno,
              diasPresenca: aluno.estatisticas?.dias_presenca || 0,
              diasAusencia: aluno.estatisticas?.dias_ausencia || 0,
              porcentagemPresenca: Number(aluno.estatisticas?.porcentagem_presenca || 0).toFixed(2),
              totalHorasTrabalhadas: Number(aluno.estatisticas?.total_horas_trabalhadas || 0).toFixed(2),
              primeiroRegistro: aluno.primeiro_registro || '-',
              ultimoRegistro: aluno.ultimo_registro || '-',
              horarioUltimoRegistro: aluno.horario_ultimo_registro || '-',
              registros: aluno.registros_diarios || []
            };
          });
        }
      } catch (err) {
        error.value = 'Erro ao gerar relatório. Por favor, tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const calcularDiferencaHoras = (horaEntrada, horaSaida) => {
      if (!horaEntrada || !horaSaida) return '0:00';

      const [horasEntrada, minutosEntrada, segundosEntrada = 0] = horaEntrada.split(':').map(Number);
      const [horasSaida, minutosSaida, segundosSaida = 0] = horaSaida.split(':').map(Number);

      const entradaEmMinutos = horasEntrada * 60 + minutosEntrada + segundosEntrada / 60;
      const saidaEmMinutos = horasSaida * 60 + minutosSaida + segundosSaida / 60;
      
      const diferencaMinutos = saidaEmMinutos - entradaEmMinutos;
      
      const horas = Math.floor(diferencaMinutos / 60);
      const minutos = Math.floor(diferencaMinutos % 60);
      
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    };

    // Observar mudanças nos filtros
    watch(
      () => ({ ...filtros.value }),
      () => {
        gerarRelatorio();
      },
      { deep: true }
    );

    const formatarData = (data) => {
      if (!data || data === '-' || data === 'Invalid Date') return '-';
      
      // Se a data já estiver no formato dd/mm/yyyy, retorna como está
      if (data.includes('/')) {
        return data;
      }

      try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR');
      } catch (error) {
        return '-';
      }
    };

    const formatarHora = (hora) => {
      if (!hora || hora === '-' || hora === 'Invalid Date') return '-';
      
      // Se já estiver no formato HH:mm, retorna como está
      if (hora.match(/^\d{2}:\d{2}$/)) {
        return hora;
      }

      try {
        // Tenta criar uma data com a hora fornecida
        const date = new Date(`2000-01-01T${hora}`);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '-';
      }
    };

    const exportarPDF = async () => {
      try {
        loading.value = true;
        const response = await axios.get(
          'http://localhost:8000/api/v1/gerenciador/exportar-registros',
          {
            params: {
              data_inicio: filtros.value.dataInicial,
              data_fim: filtros.value.dataFinal,
              aluno_id: filtros.value.alunoId || undefined,
              matricula: filtros.value.matricula || undefined,
              status: filtros.value.status || 'todos',
              formato: 'pdf'
            },
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/pdf'
            }
          }
        );

        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const nomeArquivo = `relatorio-frequencia-${dataAtual}.pdf`;
        
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nomeArquivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        error.value = 'Erro ao exportar PDF. Por favor, tente novamente.';
        console.error('Erro na exportação PDF:', err);
      } finally {
        loading.value = false;
      }
    };

    const toggleDetalhes = (alunoId) => {
      if (alunoExpandido.value === alunoId) {
        alunoExpandido.value = null;
      } else {
        alunoExpandido.value = alunoId;
      }
    };

    onMounted(() => {
      // Definir data inicial como primeiro dia do mês atual
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      filtros.value.dataInicial = primeiroDiaMes.toISOString().split('T')[0];
      filtros.value.dataFinal = hoje.toISOString().split('T')[0];
      
      // Carregar lista de alunos e relatório inicial
      carregarAlunos();
      gerarRelatorio();
    });

    return {
      loading,
      error,
      filtros,
      resumoGeral,
      alunosDetalhados,
      alunoExpandido,
      periodo,
      listaAlunos,
      toggleDetalhes,
      gerarRelatorio,
      formatarData,
      formatarHora,
      exportarPDF
    };
  }
};
</script>

<style scoped>
.relatorios-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions h2 {
  color: #4a5568;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.filtros-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filtros-section h3 {
  color: #4a5568;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.filtros-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filtro-grupo label {
  font-weight: 500;
  color: #2d3748;
  font-size: 0.95rem;
}

.filtro-grupo.periodo {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1.5rem;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input label {
  color: #718096;
  font-size: 0.875rem;
}

.filtros-busca {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.input-icon, .select-icon {
  position: relative;
}

.input-icon i, .select-icon i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.select-icon i {
  left: auto;
  right: 1rem;
}

.filtro-grupo input,
.filtro-grupo select {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f8fafc;
  transition: all 0.3s ease;
  color: #2d3748;
}

.filtro-grupo select {
  padding-right: 2.5rem;
  padding-left: 1rem;
  appearance: none;
  cursor: pointer;
}

.filtro-grupo input:focus,
.filtro-grupo select:focus {
  outline: none;
  border-color: #4a5568;
  box-shadow: 0 0 0 3px rgba(74, 85, 104, 0.1);
  background-color: white;
}

.filtro-grupo input::placeholder {
  color: #a0aec0;
}

.resumo-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.resumo-section h3 {
  color: #4a5568;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card i {
  font-size: 2rem;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-value {
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.summary-label {
  color: #718096;
  font-size: 0.875rem;
}

.tabela-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.tabela-section h3 {
  color: #4a5568;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.registros-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #edf2f7;
  white-space: nowrap;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
}

tr:hover {
  background-color: #f8fafc;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.status-badge.ativo {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.inativo {
  background-color: #fed7d7;
  color: #822727;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.export-button {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.export-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 85, 104, 0.25);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #4a5568;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  background-color: #fed7d7;
  color: #822727;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .relatorios-container {
    padding: 1rem;
  }

  .header-actions,
  .filtros-section,
  .resumo-section,
  .tabela-section {
    padding: 1rem;
  }

  .filtros-grid {
    gap: 1rem;
  }

  .date-inputs {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .table-container {
    margin: 0 -1rem;
  }

  td, th {
    padding: 0.75rem;
  }

  .export-actions {
    flex-direction: column;
  }

  .export-button {
    width: 100%;
    justify-content: center;
  }
}

/* Animações */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.relatorios-container {
  animation: fadeIn 0.5s ease-out;
}

.aluno-row {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.aluno-row:hover {
  background-color: #f8fafc;
}

.aluno-row.expandido {
  background-color: #f1f5f9;
}

.nome-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nome-container i {
  min-width: 12px;
  display: flex;
  justify-content: center;
}

.registros-detalhados {
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 8px;
  margin: 0.5rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.registros-detalhados h4 {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.periodo-detalhes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.periodo-info-detalhes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #edf2f7;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.registros-table th,
.registros-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
}

.registros-table th {
  background-color: #f8fafc;
  color: #2d3748;
  font-weight: 600;
  text-align: left;
}

/* Alinhamento específico para cada tipo de coluna */
.registros-table th:nth-child(1),
.registros-table td:nth-child(1) {
  /* Data */
  text-align: left;
  width: 15%;
}

.registros-table th:nth-child(2),
.registros-table td:nth-child(2),
.registros-table th:nth-child(3),
.registros-table td:nth-child(3) {
  /* Entrada e Saída */
  text-align: center;
  width: 20%;
}

.registros-table th:nth-child(4),
.registros-table td:nth-child(4) {
  /* Total de Horas */
  text-align: center;
  width: 15%;
}

/* Alinhamento para a tabela principal de alunos */
table th:nth-child(1),
table td:nth-child(1) {
  /* Nome */
  text-align: left;
  width: 20%;
}

table th:nth-child(2),
table td:nth-child(2) {
  /* Matrícula */
  text-align: center;
  width: 12%;
}

table th:nth-child(3),
table td:nth-child(3) {
  /* Dias Presentes */
  text-align: center;
  width: 10%;
}

table th:nth-child(4),
table td:nth-child(4) {
  /* % Presença */
  text-align: center;
  width: 10%;
}

table th:nth-child(5),
table td:nth-child(5),
table th:nth-child(6),
table td:nth-child(6) {
  /* Primeiro e Último Registro */
  text-align: center;
  width: 12%;
}

table th:nth-child(7),
table td:nth-child(7) {
  /* Horário Último Registro */
  text-align: center;
  width: 12%;
}

table th:nth-child(8),
table td:nth-child(8) {
  /* Status */
  text-align: center;
  width: 12%;
}

/* Ajuste do status badge para centralizar */
td .status-badge {
  justify-content: center;
  margin: 0 auto;
  width: fit-content;
}

/* Ajuste para o ícone de expansão */
.nome-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nome-container i {
  min-width: 12px;
  display: flex;
  justify-content: center;
}

/* Ajuste para o período nos detalhes */
.periodo-detalhes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.periodo-info-detalhes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #edf2f7;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

/* Ajuste para garantir que as tabelas mantenham a largura correta */
.registros-table {
  width: 100%;
  table-layout: fixed;
}

/* Ajuste para células com conteúdo longo */
td, th {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-icon select {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f8fafc;
  transition: all 0.3s ease;
  color: #2d3748;
  appearance: none;
  cursor: pointer;
}

.select-icon select:focus {
  outline: none;
  border-color: #4a5568;
  box-shadow: 0 0 0 3px rgba(74, 85, 104, 0.1);
  background-color: white;
}

.sem-registros {
  text-align: center;
  color: #718096;
  padding: 1rem;
  font-style: italic;
}
</style> 