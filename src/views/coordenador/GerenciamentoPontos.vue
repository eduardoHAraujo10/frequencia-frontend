<template>
  <div class="gerenciamento-pontos-container">
    <div class="header-actions">
      <h2>Gerenciamento de Pontos</h2>
      <Button 
        icon="pi pi-plus" 
        label="Adicionar Novo Registro" 
        class="add-button"
        @click="showModal = true"
      />
    </div>

    <!-- Modal de Cadastro/Edição -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modoEdicao ? 'Editar Registro' : 'Adicionar Novo Registro' }}</h3>
          <button @click="cancelarEdicao" class="close-button">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <form @submit.prevent="salvarRegistro" class="register-form">
          <div class="form-group">
            <span class="p-float-label">
              <Dropdown 
                id="aluno" 
                v-model="formRegistro.aluno_id" 
                :options="alunos"
                optionLabel="nome" 
                optionValue="id"
                placeholder="Selecione um aluno"
                class="w-full"
                :class="{'p-invalid': submitted && !formRegistro.aluno_id}"
                :disabled="carregandoAlunos"
              />
              <label for="aluno">Aluno*</label>
            </span>
            <small v-if="submitted && !formRegistro.aluno_id" class="p-error">Aluno é obrigatório</small>
          </div>

          <div class="form-group">
            <span class="p-float-label">
              <Calendar 
                id="data" 
                v-model="formRegistro.data" 
                dateFormat="dd/mm/yy"
                :showIcon="true"
                class="w-full"
                :class="{'p-invalid': submitted && !formRegistro.data}"
              />
              <label for="data">Data*</label>
            </span>
            <small v-if="submitted && !formRegistro.data" class="p-error">Data é obrigatória</small>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <span class="p-float-label">
                <Calendar 
                  id="hora_entrada" 
                  v-model="formRegistro.hora_entrada" 
                  timeOnly 
                  hourFormat="24"
                  class="w-full"
                  :class="{'p-invalid': submitted && !formRegistro.hora_entrada}"
                />
                <label for="hora_entrada">Hora de Entrada*</label>
              </span>
              <small v-if="submitted && !formRegistro.hora_entrada" class="p-error">Hora de entrada é obrigatória</small>
            </div>

            <div class="form-group half">
              <span class="p-float-label">
                <Calendar 
                  id="hora_saida" 
                  v-model="formRegistro.hora_saida" 
                  timeOnly 
                  hourFormat="24"
                  class="w-full"
                />
                <label for="hora_saida">Hora de Saída</label>
              </span>
            </div>
          </div>

          <div class="form-group">
            <span class="p-float-label">
              <Textarea 
                id="observacao" 
                v-model="formRegistro.observacao" 
                rows="3" 
                class="w-full"
                autoResize
              />
              <label for="observacao">Observação</label>
            </span>
          </div>

          <div class="form-actions">
            <Button 
              type="button" 
              @click="cancelarEdicao" 
              label="Cancelar" 
              class="cancel-button"
            />
            <Button 
              type="submit" 
              :label="modoEdicao ? 'Atualizar' : 'Adicionar'" 
              :loading="salvando"
              class="submit-button"
            />
          </div>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </form>
      </div>
    </div>

    <!-- Lista de Registros -->
    <div class="registros-list">
      <div class="filter-bar">
        <div class="search-section">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText 
              v-model="filtro" 
              placeholder="Buscar registros..." 
              class="search-input"
            />
          </span>
        </div>
        <div class="filter-section">
          <Dropdown 
            v-model="alunoSelecionado" 
            :options="alunos"
            optionLabel="nome" 
            optionValue="id"
            placeholder="Filtrar por aluno"
            class="filter-dropdown"
            @change="filtrarPorAluno"
            :disabled="carregandoAlunos"
          />
          <Button 
            icon="pi pi-filter-slash" 
            class="p-button-outlined p-button-secondary"
            @click="limparFiltro"
            :disabled="!alunoSelecionado"
            title="Limpar filtro"
          />
          <Button 
            icon="pi pi-refresh" 
            class="p-button-outlined"
            @click="recarregarTudo"
            :disabled="carregando || carregandoAlunos"
            title="Atualizar"
          />
        </div>
      </div>

      <div class="table-container">
        <div v-if="carregando" class="loading-container">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p>Carregando registros...</p>
        </div>

        <div v-else-if="registros.length === 0" class="no-data">
          <i class="pi pi-info-circle"></i>
          <p>Nenhum registro encontrado.</p>
          <p class="sub-text">Adicione um novo registro ou altere os filtros de busca.</p>
        </div>

        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>Aluno</th>
              <th>Data</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in registrosFiltrados" :key="registro.id">
              <td>{{ registro.id }}</td>
              <td>{{ registro.aluno_nome }}</td>
              <td>{{ formatarData(registro.data) }}</td>
              <td>{{ registro.hora_entrada }}</td>
              <td>{{ registro.hora_saida || '-' }}</td>
              <td>
                <div class="truncate-text">{{ registro.observacao || '-' }}</div>
              </td>
              <td class="actions">
                <button class="action-button edit" @click="editarRegistro(registro)">
                  <i class="pi pi-pencil"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import registroService from '@/services/registroService';
import { useToast } from 'vue-toastification';

// Componentes PrimeVue
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';

export default {
  name: 'GerenciamentoPontos',
  
  components: {
    Button,
    InputText,
    Dropdown,
    Calendar,
    Textarea,
    ProgressSpinner
  },
  
  setup() {
    const toast = useToast();
    const registros = ref([]);
    const registrosOriginais = ref([]);
    const carregando = ref(false);
    const carregandoAlunos = ref(false);
    const salvando = ref(false);
    const filtro = ref('');
    const modoEdicao = ref(false);
    const registroEditandoId = ref(null);
    const submitted = ref(false);
    const alunoSelecionado = ref(null);
    const showModal = ref(false);
    const message = ref('');
    const messageType = ref('');
    
    // Lista de alunos (será carregada da API)
    const alunos = ref([
      { id: '1', nome: 'Aluno 1' },
      { id: '2', nome: 'Aluno 2' },
      { id: '3', nome: 'Aluno 3' },
      { id: '4', nome: 'Aluno 4' }
    ]);
    
    const formRegistro = ref({
      aluno_id: '',
      data: new Date(),
      hora_entrada: '',
      hora_saida: '',
      observacao: ''
    });

    const registrosFiltrados = computed(() => {
      if (!filtro.value) return registros.value;
      
      const termoBusca = filtro.value.toLowerCase();
      return registros.value.filter(registro => 
        (registro.aluno_nome && registro.aluno_nome.toLowerCase().includes(termoBusca)) ||
        (registro.data && registro.data.includes(termoBusca)) ||
        (registro.observacao && registro.observacao.toLowerCase().includes(termoBusca))
      );
    });

    // Carregar alunos da API
    const carregarAlunos = async () => {
      carregandoAlunos.value = true;
      try {
        // Tentar buscar alunos da API usando o endpoint /alunos
        const response = await registroService.listarAlunos();
        console.log('Resposta da API (alunos):', response);
        
        // Verificar se a resposta contém dados
        if (response && response.data) {
          let dadosAlunos = [];
          
          // Estrutura específica da API: data.alunos
          if (response.data.data && response.data.data.alunos && Array.isArray(response.data.data.alunos)) {
            dadosAlunos = response.data.data.alunos;
            console.log('Alunos encontrados na estrutura data.alunos:', dadosAlunos);
          } 
          // Verificar outras estruturas possíveis
          else if (Array.isArray(response.data)) {
            dadosAlunos = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dadosAlunos = response.data.data;
          } else if (typeof response.data === 'object') {
            // Se for um objeto, tentar extrair um array
            const possiveisArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possiveisArrays.length > 0) {
              dadosAlunos = possiveisArrays[0];
            }
          }
          
          console.log('Dados de alunos extraídos:', dadosAlunos);
          
          if (dadosAlunos.length > 0) {
            // Mapear os dados para o formato esperado
            alunos.value = dadosAlunos.map(aluno => {
              console.log('Processando aluno:', aluno);
              
              // Identificar os campos de ID e nome do aluno
              const id = aluno.id || aluno.aluno_id || aluno._id || '';
              const nome = aluno.nome || aluno.name || aluno.aluno_nome || `Aluno ${id}`;
              
              return { id: String(id), nome };
            });
            
            console.log('Alunos processados:', alunos.value);
            
            // Atualizar os nomes dos alunos nos registros
            if (registrosOriginais.value.length > 0) {
              atualizarNomesAlunos();
            }
          } else {
            console.warn('Nenhum aluno encontrado na resposta da API');
            toast.warning('Nenhum aluno encontrado');
          }
        } else {
          console.warn('Resposta da API não contém dados de alunos');
          toast.warning('Não foi possível carregar os alunos');
        }
      } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        toast.error('Erro ao carregar alunos');
      } finally {
        carregandoAlunos.value = false;
      }
    };

    // Carregar registros de ponto
    const carregarRegistros = async () => {
      carregando.value = true;
      try {
        const response = await registroService.listarTodos();
        console.log('Resposta da API (registros):', response);
        
        if (response && response.data) {
          let dadosRegistros = [];
          
          // Tentar extrair os dados da resposta
          if (response.data.data && Array.isArray(response.data.data)) {
            dadosRegistros = response.data.data;
          } else if (Array.isArray(response.data)) {
            dadosRegistros = response.data;
          } else if (typeof response.data === 'object') {
            // Se for um objeto, tentar extrair um array
            const possiveisArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possiveisArrays.length > 0) {
              dadosRegistros = possiveisArrays[0];
            }
          }
          
          console.log('Dados de registros extraídos:', dadosRegistros);
          
          if (dadosRegistros.length > 0) {
            registrosOriginais.value = dadosRegistros;
            atualizarNomesAlunos();
          } else {
            registros.value = [];
            console.warn('Nenhum registro encontrado na resposta da API');
          }
        } else {
          registros.value = [];
          console.warn('Resposta da API não contém dados de registros');
        }
      } catch (error) {
        console.error('Erro ao carregar registros:', error);
        toast.error('Erro ao carregar registros');
        registros.value = [];
      } finally {
        carregando.value = false;
      }
    };

    // Atualizar nomes dos alunos nos registros
    const atualizarNomesAlunos = () => {
      registros.value = registrosOriginais.value.map(registro => {
        const aluno = alunos.value.find(a => a.id === String(registro.aluno_id));
        return {
          ...registro,
          aluno_nome: aluno ? aluno.nome : `Aluno ID: ${registro.aluno_id}`
        };
      });
    };

    // Filtrar registros por aluno
    const filtrarPorAluno = () => {
      if (!alunoSelecionado.value) {
        registros.value = [...registrosOriginais.value];
        atualizarNomesAlunos();
        return;
      }
      
      registros.value = registrosOriginais.value.filter(
        registro => String(registro.aluno_id) === String(alunoSelecionado.value)
      );
      atualizarNomesAlunos();
    };

    // Limpar filtro de aluno
    const limparFiltro = () => {
      alunoSelecionado.value = null;
      registros.value = [...registrosOriginais.value];
      atualizarNomesAlunos();
    };

    // Formatar data para exibição
    const formatarData = (dataString) => {
      if (!dataString) return '-';
      
      try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
      } catch (error) {
        return dataString;
      }
    };

    // Obter nome do aluno pelo ID
    const getAlunoNome = (alunoId) => {
      const aluno = alunos.value.find(a => a.id === String(alunoId));
      return aluno ? aluno.nome : `Aluno ID: ${alunoId}`;
    };

    // Editar registro existente
    const editarRegistro = (registro) => {
      modoEdicao.value = true;
      registroEditandoId.value = registro.id;
      
      formRegistro.value = {
        aluno_id: String(registro.aluno_id),
        data: new Date(registro.data),
        hora_entrada: registro.hora_entrada,
        hora_saida: registro.hora_saida || '',
        observacao: registro.observacao || ''
      };
      
      showModal.value = true;
    };

    // Cancelar edição
    const cancelarEdicao = () => {
      modoEdicao.value = false;
      registroEditandoId.value = null;
      showModal.value = false;
      
      formRegistro.value = {
        aluno_id: '',
        data: new Date(),
        hora_entrada: '',
        hora_saida: '',
        observacao: ''
      };
      
      submitted.value = false;
      message.value = '';
      messageType.value = '';
    };

    // Salvar registro (adicionar ou atualizar)
    const salvarRegistro = async () => {
      submitted.value = true;
      
      // Validar campos obrigatórios
      if (!formRegistro.value.aluno_id || !formRegistro.value.data || !formRegistro.value.hora_entrada) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      
      salvando.value = true;
      message.value = '';
      messageType.value = '';
      
      try {
        // Preparar dados para envio
        const dadosRegistro = {
          aluno_id: formRegistro.value.aluno_id,
          data: formRegistro.value.data.toISOString().split('T')[0],
          hora_entrada: formRegistro.value.hora_entrada,
          hora_saida: formRegistro.value.hora_saida,
          observacao: formRegistro.value.observacao
        };
        
        let response;
        
        if (modoEdicao.value) {
          // Atualizar registro existente
          response = await registroService.editar(registroEditandoId.value, dadosRegistro);
          console.log('Resposta da API (edição):', response);
          
          if (response && response.data) {
            message.value = 'Registro atualizado com sucesso!';
            messageType.value = 'success';
            toast.success('Registro atualizado com sucesso!');
            
            // Atualizar lista após edição
            await carregarRegistros();
            
            // Fechar modal após 2 segundos
            setTimeout(() => {
              cancelarEdicao();
            }, 2000);
          }
        } else {
          // Adicionar novo registro
          response = await registroService.adicionar(dadosRegistro);
          console.log('Resposta da API (adição):', response);
          
          if (response && response.data) {
            message.value = 'Registro adicionado com sucesso!';
            messageType.value = 'success';
            toast.success('Registro adicionado com sucesso!');
            
            // Atualizar lista após adição
            await carregarRegistros();
            
            // Fechar modal após 2 segundos
            setTimeout(() => {
              cancelarEdicao();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Erro ao salvar registro:', error);
        message.value = error.response?.data?.message || 'Erro ao salvar registro';
        messageType.value = 'error';
        toast.error(message.value);
      } finally {
        salvando.value = false;
      }
    };

    // Recarregar todos os dados
    const recarregarTudo = async () => {
      await carregarAlunos();
      await carregarRegistros();
      toast.info('Dados atualizados');
    };

    // Debug: exibir dados no console
    const debugDados = () => {
      console.log('Alunos:', alunos.value);
      console.log('Registros originais:', registrosOriginais.value);
      console.log('Registros processados:', registros.value);
      console.log('Filtro atual:', filtro.value);
      console.log('Aluno selecionado:', alunoSelecionado.value);
      toast.info('Dados exibidos no console');
    };

    // Carregar dados ao montar o componente
    onMounted(() => {
      recarregarTudo();
    });

    return {
      registros,
      registrosFiltrados,
      carregando,
      carregandoAlunos,
      salvando,
      filtro,
      alunos,
      alunoSelecionado,
      formRegistro,
      modoEdicao,
      submitted,
      showModal,
      message,
      messageType,
      carregarAlunos,
      carregarRegistros,
      filtrarPorAluno,
      limparFiltro,
      formatarData,
      getAlunoNome,
      editarRegistro,
      cancelarEdicao,
      salvarRegistro,
      recarregarTudo,
      debugDados
    };
  }
};
</script>

<style scoped>
.gerenciamento-pontos-container {
  padding: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #218838;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 550px;
  min-height: 600px;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  margin: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.close-button:hover {
  color: #5a6268;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group.half {
  flex: 1;
}

.form-actions {
  margin-top: auto;
  padding-top: 2rem;
  display: flex;
  gap: 1rem;
}

.cancel-button, 
.submit-button {
  padding: 1rem 1.5rem;
  height: 3rem;
  font-size: 1rem;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: none;
}

.submit-button {
  background-color: #007bff;
  color: white;
  border: none;
}

.cancel-button:hover {
  background-color: #5a6268;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-section {
  flex: 1;
  min-width: 250px;
}

.filter-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.filter-dropdown {
  min-width: 200px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

.action-button.edit {
  background-color: #17a2b8;
}

.action-button.edit:hover {
  background-color: #138496;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-data i {
  font-size: 2rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.no-data .sub-text {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
}

.truncate-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-float-label) {
  margin-bottom: 0.5rem;
}

:deep(.p-float-label input), 
:deep(.p-float-label .p-dropdown),
:deep(.p-float-label .p-calendar),
:deep(.p-float-label .p-textarea) {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
}

:deep(.p-float-label label) {
  font-size: 1rem;
  margin-top: 0.2rem;
}

.p-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-height: 700px) {
  .modal-content {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-section {
    flex-wrap: wrap;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style>