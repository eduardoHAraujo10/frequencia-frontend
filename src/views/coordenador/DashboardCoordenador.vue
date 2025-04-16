<template>
  <div class="dashboard-container">
    <div class="header-section">
      <h2>Dashboard</h2>
      <div class="data-atual">
        {{ formatarData(resumoDia.data) }} - {{ resumoDia.dia_semana }}
      </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="card-content">
          <h3>Total de Alunos</h3>
          <p class="card-value">{{ resumoDia.estatisticas_gerais?.total_alunos || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon">
          <i class="fas fa-user-check"></i>
        </div>
        <div class="card-content">
          <h3>Presentes Hoje</h3>
          <p class="card-value">{{ resumoDia.estatisticas_gerais?.presentes || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon">
          <i class="fas fa-user-times"></i>
        </div>
        <div class="card-content">
          <h3>Ausentes Hoje</h3>
          <p class="card-value">{{ resumoDia.estatisticas_gerais?.ausentes || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="card-content">
          <h3>Presença do Dia</h3>
          <p class="card-value">{{ resumoDia.estatisticas_gerais?.porcentagem_presenca || 0 }}%</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Gráfico de Presença (versão simplificada) -->
      <div class="dashboard-item grafico-presenca">
        <h3>Presença dos Últimos 7 Dias</h3>
        <div class="grafico-barras" v-if="dadosPeriodo.estatisticas_diarias">
          <div 
            v-for="dia in dadosPeriodo.estatisticas_diarias" 
            :key="dia.data" 
            class="barra-container"
          >
            <div 
              class="barra" 
              :style="{ height: (dia.total_presentes * 100 / 50) + '%' }"
            >
              <span class="valor">{{ dia.total_presentes }}</span>
            </div>
            <span class="label">{{ new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'short' }) }}</span>
          </div>
        </div>
      </div>

      <!-- Distribuição por Períodos -->
      <div class="dashboard-item distribuicao-periodos">
        <h3>Distribuição por Períodos</h3>
        <div class="periodos-grid">
          <div class="periodo-card manha">
            <h4>Manhã</h4>
            <p class="periodo-horario">{{ formatarHora(resumoDia.distribuicao_periodos?.manha.inicio) }} - {{ formatarHora(resumoDia.distribuicao_periodos?.manha.fim) }}</p>
            <p class="periodo-total">{{ resumoDia.distribuicao_periodos?.manha.total || 0 }} alunos</p>
          </div>
          <div class="periodo-card tarde">
            <h4>Tarde</h4>
            <p class="periodo-horario">{{ formatarHora(resumoDia.distribuicao_periodos?.tarde.inicio) }} - {{ formatarHora(resumoDia.distribuicao_periodos?.tarde.fim) }}</p>
            <p class="periodo-total">{{ resumoDia.distribuicao_periodos?.tarde.total || 0 }} alunos</p>
          </div>
          <div class="periodo-card noite">
            <h4>Noite</h4>
            <p class="periodo-horario">{{ formatarHora(resumoDia.distribuicao_periodos?.noite.inicio) }} - {{ formatarHora(resumoDia.distribuicao_periodos?.noite.fim) }}</p>
            <p class="periodo-total">{{ resumoDia.distribuicao_periodos?.noite.total || 0 }} alunos</p>
          </div>
        </div>
      </div>

      <!-- Distribuição por Horário -->
      <div class="dashboard-item distribuicao-horarios">
        <h3>Distribuição por Horário</h3>
        <div class="horarios-grid">
          <div v-for="horario in resumoDia.distribuicao_horarios" :key="horario.hora" class="horario-card">
            <h4>{{ horario.hora }}h</h4>
            <p class="horario-total">{{ horario.total }} alunos</p>
          </div>
        </div>
      </div>

      <!-- Estatísticas do Período -->
      <div class="dashboard-item estatisticas-periodo">
        <h3>Estatísticas do Período</h3>
        <div class="estatisticas-grid">
          <div class="estatistica-card">
            <h4>Horas Totais</h4>
            <p class="estatistica-valor">{{ dadosPeriodo.horas_totais?.toFixed(1) || 0 }}h</p>
          </div>
          <div class="estatistica-card">
            <h4>Média de Permanência</h4>
            <p class="estatistica-valor">{{ dadosPeriodo.media_permanencia?.toFixed(1) || 0 }}h</p>
          </div>
        </div>
      </div>

      <!-- Lista dos Últimos Registros -->
      <div class="dashboard-item ultimos-registros">
        <h3>Últimos Registros</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Horário</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="registro in resumoDia.ultimos_registros" :key="registro.id">
                <td>{{ registro.aluno.nome }}</td>
                <td>{{ registro.aluno.matricula }}</td>
                <td>{{ formatarDataHora(registro.data_hora_completa) }}</td>
                <td>
                  <span :class="['tipo-badge', registro.tipo]">
                    {{ registro.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'Dashboard',
  setup() {
    const resumoDia = ref({});
    const dadosPeriodo = ref({});

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
      if (hora.includes(' ')) {
        hora = hora.split(' ')[1];
      }
      return hora.substring(0, 5);
    };

    const formatarDataHora = (dataHora) => {
      if (!dataHora) return '-';
      return dataHora;
    };

    const buscarDadosDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          resumoDia.value = response.data.data;
        }
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
      }
    };

    const buscarDadosPeriodo = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/dashboard/periodo', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          dadosPeriodo.value = response.data.data;
        }
      } catch (err) {
        console.error('Erro ao buscar dados do período:', err);
      }
    };

    const atualizarDashboard = async () => {
      await Promise.all([
        buscarDadosDashboard(),
        buscarDadosPeriodo()
      ]);
    };

    onMounted(() => {
      atualizarDashboard();
      // Atualizar a cada 5 minutos
      setInterval(atualizarDashboard, 5 * 60 * 1000);
    });

    return {
      resumoDia,
      dadosPeriodo,
      formatarData,
      formatarHora,
      formatarDataHora
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-section h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.data-atual {
  color: var(--text-secondary);
  font-size: 1rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--shadow-color);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: var(--primary-color);
  color: white;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.dashboard-item {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.dashboard-item h3 {
  font-size: 1.125rem;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  font-weight: 600;
}

/* Gráfico de Presença */
.grafico-presenca {
  grid-column: span 2;
}

.grafico-barras {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  padding: 1rem 0;
}

.barra-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.barra {
  width: 40px;
  background: #FF6B00;
  border-radius: 8px;
  position: relative;
  transition: height 0.3s ease;
  min-height: 4px;
}

.barra .valor {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: capitalize;
}

/* Distribuição por Períodos */
.periodos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.periodo-card {
  background: rgba(255, 107, 0, 0.1);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
}

.periodo-card h4 {
  font-size: 1rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.periodo-horario {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.periodo-total {
  font-size: 1.125rem;
  font-weight: 600;
  color: #FF6B00;
}

/* Distribuição por Horário */
.horarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.horario-card {
  background: rgba(255, 107, 0, 0.1);
  border-radius: 12px;
  padding: 0.75rem;
  text-align: center;
}

.horario-card h4 {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.horario-total {
  font-size: 1rem;
  font-weight: 600;
  color: #FF6B00;
}

/* Estatísticas do Período */
.estatisticas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.estatistica-card {
  background: rgba(255, 107, 0, 0.1);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
}

.estatistica-card h4 {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.estatistica-valor {
  font-size: 1.25rem;
  font-weight: 600;
  color: #FF6B00;
}

/* Últimos Registros */
.ultimos-registros {
  grid-column: span 2;
}

.table-container {
  overflow-x: auto;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background: rgba(255, 107, 0, 0.1);
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.875rem;
  text-align: left;
  padding: 1rem;
}

th:first-child {
  border-top-left-radius: 12px;
}

th:last-child {
  border-top-right-radius: 12px;
}

td {
  padding: 1rem;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
}

tr:last-child td {
  border-bottom: none;
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tipo-badge.entrada {
  background-color: #E6F4EA;
  color: #1E8E3E;
}

.tipo-badge.saida {
  background-color: #FFF2F2;
  color: #FF3B3B;
}

@media (max-width: 1200px) {
  .dashboard-container {
    padding: 1.5rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .grafico-presenca,
  .ultimos-registros {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .card {
    padding: 1rem;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .periodos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 0.75rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .estatisticas-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    margin: 0 -0.75rem;
    padding: 0 0.75rem;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style> 