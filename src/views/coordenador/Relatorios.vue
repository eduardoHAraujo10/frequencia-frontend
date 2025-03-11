<template>
  <div class="relatorios-container">
    <div class="header-actions">
      <h2>Relatórios</h2>
    </div>

    <!-- Filtros de Pesquisa -->
    <div class="filtros-section">
      <h3>Filtros</h3>
      <div class="filtros-grid">
        <!-- Período -->
        <div class="filtro-grupo">
        <label>Período:</label>
        <div class="date-inputs">
          <div class="date-input">
            <label>De:</label>
            <input 
              type="date" 
                v-model="filtros.dataInicio"
              @change="gerarRelatorio"
            />
          </div>
          <div class="date-input">
            <label>Até:</label>
            <input 
              type="date" 
                v-model="filtros.dataFim"
              @change="gerarRelatorio"
            />
            </div>
          </div>
        </div>

        <!-- Busca por Nome/Matrícula -->
        <div class="filtro-grupo">
          <label>Buscar por Nome:</label>
          <input 
            type="text" 
            v-model="filtros.nome"
            placeholder="Digite o nome do aluno"
            @input="gerarRelatorio"
          />
        </div>

        <div class="filtro-grupo">
          <label>Buscar por Matrícula:</label>
          <input 
            type="text" 
            v-model="filtros.matricula"
            placeholder="Digite a matrícula"
            @input="gerarRelatorio"
          />
        </div>

        <!-- Status -->
        <div class="filtro-grupo">
          <label>Status:</label>
          <select v-model="filtros.status" @change="gerarRelatorio">
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
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
      dataInicio: '',
      dataFim: '',
      nome: '',
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
            dataInicio: filtros.value.dataInicio,
            dataFim: filtros.value.dataFim
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
            dataInicio: filtros.value.dataInicio,
            dataFim: filtros.value.dataFim
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
            const nomeMatch = !filtros.value.nome || 
              aluno.nome.toLowerCase().includes(filtros.value.nome.toLowerCase());
            const matriculaMatch = !filtros.value.matricula || 
              aluno.matricula.includes(filtros.value.matricula);
            const statusMatch = !filtros.value.status || 
              (filtros.value.status === 'ativo' ? aluno.ativo : !aluno.ativo);
            
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
                      dataInicio: filtros.value.dataInicio,
                      dataFim: filtros.value.dataFim
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
              dataInicio: filtros.value.dataInicio,
              dataFim: filtros.value.dataFim,
              nome: filtros.value.nome || undefined,
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
      filtros.value.dataInicio = primeiroDiaMes.toISOString().split('T')[0];
      filtros.value.dataFim = hoje.toISOString().split('T')[0];
      
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
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filtros-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filtros-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filtro-grupo label {
  font-weight: 500;
  color: #666;
}

.filtro-grupo input,
.filtro-grupo select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
}

.date-inputs {
  display: flex;
  gap: 1rem;
}

.date-input {
  flex: 1;
}

.resumo-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.resumo-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-card i {
  font-size: 2rem;
  color: #007bff;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.summary-label {
  font-size: 0.875rem;
  color: #666;
}

.tabela-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.tabela-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.registros-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.ativo {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inativo {
  background-color: #f8d7da;
  color: #721c24;
}

.export-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.export-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.export-button.pdf {
  background-color: #dc3545;
  color: white;
}

.export-button.pdf:hover {
  background-color: #c82333;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .filtros-grid {
    grid-template-columns: 1fr;
  }

  .date-inputs {
    flex-direction: column;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .export-actions {
    flex-direction: column;
  }

  .export-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 