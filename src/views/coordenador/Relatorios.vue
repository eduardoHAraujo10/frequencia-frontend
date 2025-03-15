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
            <label>Nome do Aluno</label>
            <div class="input-icon">
              <i class="fas fa-user"></i>
              <input 
                type="text" 
                v-model="filtros.nomeAluno" 
                placeholder="Digite o nome do aluno"
              />
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
              <tr v-for="aluno in alunosDetalhados" :key="aluno.id">
                <td>{{ aluno.nome }}</td>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'Relatorios',
  setup() {
    const loading = ref(false);
    const error = ref('');
    
    // Filtros
    const filtros = ref({
      dataInicial: '',
      dataFinal: '',
      nomeAluno: '',
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

    // Buscar resumo geral do período
    const buscarResumo = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/registros/resumo', {
          params: {
            dataInicio: filtros.value.dataInicial,
            dataFim: filtros.value.dataFinal
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const { resumos, periodo } = response.data.data;
          
          // Calcular totais do período
          const totalHoras = resumos.reduce((total, aluno) => {
            return total + (aluno.total_horas_trabalhadas || 0);
          }, 0);

          const mediaPresenca = resumos.reduce((total, aluno) => {
            return total + (aluno.porcentagem_presenca || 0);
          }, 0) / (resumos.length || 1);

          resumoGeral.value = {
            ...resumoGeral.value,
            totalHorasRegistradas: totalHoras.toFixed(2),
            mediaPresencaGeral: mediaPresenca.toFixed(1),
            periodo: periodo
          };
        }
      } catch (err) {
        console.error('Erro ao buscar resumo:', err);
      }
    };

    // Buscar dados de presença
    const buscarPresencas = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/presencas', {
          params: {
            dataInicio: filtros.value.dataInicial,
            dataFim: filtros.value.dataFinal
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const { estatisticas } = response.data.data;
          resumoGeral.value = {
            ...resumoGeral.value,
            totalAlunosAtivos: estatisticas.total_alunos,
            totalAlunosPresentes: estatisticas.presentes,
            porcentagemPresenca: estatisticas.porcentagem_presenca
          };
        }
      } catch (err) {
        console.error('Erro ao buscar presenças:', err);
      }
    };

    // Buscar lista de alunos
    const buscarAlunos = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/alunos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const { alunos } = response.data.data;
          
          // Filtrar alunos conforme os filtros
          const alunosFiltrados = alunos.filter(aluno => {
            const nomeMatch = !filtros.value.nomeAluno || 
              aluno.nome.toLowerCase().includes(filtros.value.nomeAluno.toLowerCase());
            const matriculaMatch = !filtros.value.matricula || 
              aluno.matricula.includes(filtros.value.matricula);
            const statusMatch = !filtros.value.status || 
              (filtros.value.status === 'presente' ? aluno.presente : 
                (filtros.value.status === 'ausente' ? !aluno.presente : true) && 
                (filtros.value.status === 'justificado' ? aluno.justificado : true));
            
            return nomeMatch && matriculaMatch && statusMatch;
          });

          // Buscar frequência detalhada para cada aluno
          const frequencias = await Promise.all(
            alunosFiltrados.map(async (aluno) => {
              try {
                const freqResponse = await axios.get(
                  `http://localhost:8000/api/v1/gerenciador/alunos/${aluno.id}/frequencia`,
          {
            params: {
                      dataInicio: filtros.value.dataInicial,
                      dataFim: filtros.value.dataFinal
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

                if (freqResponse.data.status === 'success') {
                  const { estatisticas, registros } = freqResponse.data.data;
                  return {
                    ...aluno,
                    diasPresenca: estatisticas.dias_presenca,
                    diasAusencia: estatisticas.dias_ausencia,
                    porcentagemPresenca: estatisticas.porcentagem_presenca,
                    totalHorasTrabalhadas: estatisticas.total_horas_trabalhadas,
                    primeiroRegistro: registros.length > 0 ? registros[0].data : null,
                    ultimoRegistro: registros.length > 0 ? registros[registros.length - 1].data : null,
                    horarioUltimoRegistro: registros.length > 0 ? registros[registros.length - 1].entrada : null
                  };
                }
                return aluno;
              } catch (err) {
                console.error(`Erro ao buscar frequência do aluno ${aluno.id}:`, err);
                return aluno;
              }
            })
          );

          alunosDetalhados.value = frequencias;
        }
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      }
    };

    const gerarRelatorio = async () => {
      loading.value = true;
      error.value = '';

      try {
        await Promise.all([
          buscarResumo(),
          buscarPresencas(),
          buscarAlunos()
        ]);
      } catch (err) {
        error.value = 'Erro ao gerar relatório. Por favor, tente novamente.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const formatarData = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const formatarHora = (hora) => {
      if (!hora) return '-';
      return new Date(`2000-01-01T${hora}`).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const exportarPDF = async () => {
      try {
        loading.value = true;
        const response = await axios.get(
          'http://localhost:8000/api/v1/gerenciador/exportar-registros',
          {
            params: {
              dataInicio: filtros.value.dataInicial,
              dataFim: filtros.value.dataFinal,
              nome: filtros.value.nomeAluno || undefined,
              matricula: filtros.value.matricula || undefined,
              status: filtros.value.status || undefined,
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

    onMounted(() => {
      // Definir data inicial como primeiro dia do mês atual
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      filtros.value.dataInicial = primeiroDiaMes.toISOString().split('T')[0];
      filtros.value.dataFinal = hoje.toISOString().split('T')[0];
      
      // Carregar relatório inicial
      gerarRelatorio();
    });

    return {
      loading,
      error,
      filtros,
      resumoGeral,
      alunosDetalhados,
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
}

.header-actions h2 {
  color: #1a237e;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.filtros-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filtros-section h3 {
  color: #1a237e;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  color: #1a237e;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
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
  color: #1a237e;
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
  color: #1a237e;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-button.pdf {
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  color: white;
}

.export-button.pdf:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.25);
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
  border-top: 3px solid #667eea;
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
</style> 