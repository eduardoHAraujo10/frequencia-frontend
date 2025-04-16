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
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { websocketService } from '../../services/websocket';

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

    const handleWebSocketMessage = (payload) => {
      if (payload.type === 'dashboard_atualizado') {
        atualizarDashboard();
      }
    };

    onMounted(() => {
      atualizarDashboard();
      websocketService.subscribe('dashboard_atualizado', handleWebSocketMessage);
    });

    onUnmounted(() => {
      websocketService.unsubscribe('dashboard_atualizado', handleWebSocketMessage);
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
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.data-atual {
  font-size: 1.1rem;
  color: #666;
  text-transform: capitalize;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  font-size: 2rem;
  color: #007bff;
}

.card-content h3 {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0.5rem 0 0 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.dashboard-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-item h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.grafico-presenca {
  grid-column: 1 / -1;
}

.grafico-barras {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 300px;
  padding: 20px;
  gap: 10px;
}

.barra-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.barra {
  width: 40px;
  background-color: #007bff;
  border-radius: 4px;
  position: relative;
  transition: height 0.3s ease;
  min-height: 20px;
}

.valor {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.875rem;
  color: #666;
}

.label {
  margin-top: 10px;
  font-size: 0.875rem;
  color: #666;
  text-transform: capitalize;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  font-weight: 600;
  color: #333;
  background-color: #f8f9fa;
}

.tipo-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
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

.periodos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.periodo-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.periodo-card h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.periodo-horario {
  color: #666;
  font-size: 0.875rem;
  margin: 0.5rem 0;
}

.periodo-total {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.estatisticas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.estatistica-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.estatistica-card h4 {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.estatistica-valor {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0.5rem 0 0 0;
}

.horarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.horario-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.horario-card h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.horario-total {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0.5rem 0 0 0;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .periodos-grid,
  .estatisticas-grid {
    grid-template-columns: 1fr;
  }
}
</style> 