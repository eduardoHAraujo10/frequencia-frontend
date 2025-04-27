<template>
  <div class="gerenciar-alunos-container">
    <div class="header-actions">
      <h2>Gerenciar Alunos</h2>
      <va-button @click="showModal = true">
        <i class="fas fa-plus"></i>
        Cadastrar Novo Aluno
      </va-button>
    </div>

    <va-modal v-model="showModal" :title="'Cadastrar Novo Aluno'" hide-default-actions>
      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-group">
          <va-input
            v-model="formData.username"
            label="Nome do aluno"
            :error="false"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <va-input
            v-model="formData.email"
            label="E-mail"
            :error="false"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <va-input
            v-model="formData.matricula"
            label="Matrícula"
            :error="false"
          />
          <span v-if="errors.matricula" class="error-message">{{ errors.matricula }}</span>
        </div>

        <div class="form-actions">
          <va-button flat @click="handleCancel">
            Cancelar
          </va-button>
          <va-button @click="handleSubmit">
            Cadastrar
          </va-button>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </form>
    </va-modal>

    <!-- Modal de Edição de Matrícula -->
    <va-modal v-model="showEditModal" :title="'Editar Matrícula'" hide-default-actions>
      <form @submit.prevent="handleEditSubmit" class="register-form">
        <div class="form-group">
          <va-input
            v-model="editFormData.matricula"
            label="Nova Matrícula"
            :error="editErrors.matricula"
          />
        </div>

        <div class="form-actions">
          <va-button flat @click="showEditModal = false">
            Cancelar
          </va-button>
          <va-button @click="handleEditSubmit">
            Salvar
          </va-button>
        </div>

        <div v-if="editMessage" :class="['message', editMessageType]">
          {{ editMessage }}
        </div>
      </form>
    </va-modal>

    <!-- Lista de Alunos -->
    <div class="alunos-list">
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Buscar alunos..."
          class="search-input"
        >
      </div>

      <div class="table-container">
        <table v-if="alunos.length > 0">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Matrícula</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aluno in filteredAlunos" :key="aluno.id">
              <td>{{ aluno.nome }}</td>
              <td>{{ aluno.email }}</td>
              <td>{{ aluno.matricula }}</td>
              <td>
                <span :class="['status-badge', aluno.ativo ? 'active' : 'inactive']">
                  {{ aluno.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="actions">
                <va-popover message="Ver Registros" placement="top">
                  <button class="action-button view" @click="verRegistros(aluno)">
                    <i class="fas fa-list"></i>
                  </button>
                </va-popover>
                <va-popover message="Editar Matrícula" placement="top">
                  <button class="action-button edit" @click="abrirModalEdicao(aluno)">
                    <i class="fas fa-edit"></i>
                  </button>
                </va-popover>
                <va-popover :message="aluno.ativo ? 'Desativar Aluno' : 'Ativar Aluno'" placement="top">
                  <button
                    class="action-button status"
                    :class="aluno.ativo ? 'block' : 'activate'"
                    @click="alterarStatus(aluno)"
                  >
                    <i :class="['fas', aluno.ativo ? 'fa-ban' : 'fa-check']"></i>
                  </button>
                </va-popover>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-data">
          Nenhum aluno cadastrado
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { VaInput, VaButton, VaModal } from 'vuestic-ui'
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'GerenciarAlunos',
  components: {
    VaInput,
    VaButton,
    VaModal
  },
  setup() {
    const router = useRouter();
    const showModal = ref(false);
    const showEditModal = ref(false);
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const editMessage = ref('');
    const editMessageType = ref('');
    const showPassword = ref(false);
    const searchTerm = ref('');
    const alunos = ref([]);
    const alunoSelecionado = ref(null);

    const formData = ref({
      username: '',
      password: '',
      email: '',
      matricula: '',
      tipo: 'aluno'
    });

    const errors = ref({
      username: '',
      password: '',
      email: '',
      matricula: ''
    });

    const editFormData = ref({
      matricula: ''
    });

    const editErrors = ref({
      matricula: ''
    });

    const hasErrors = computed(() => {
      return Object.values(errors.value).some(error => error !== '');
    });

    const filteredAlunos = computed(() => {
      return alunos.value.filter(aluno => {
        const searchLower = searchTerm.value.toLowerCase();
        return aluno.nome.toLowerCase().includes(searchLower) ||
               aluno.matricula.toLowerCase().includes(searchLower) ||
               aluno.email.toLowerCase().includes(searchLower);
      });
    });

    const validateField = (field) => {
      errors.value[field] = '';
      
      switch (field) {
        case 'username':
          if (!formData.value.username) {
            errors.value.username = 'O nome é obrigatório';
          } else if (formData.value.username.length < 3) {
            errors.value.username = 'O nome deve ter pelo menos 3 caracteres';
          }
          break;
        case 'email':
          if (!formData.value.email) {
            errors.value.email = 'O e-mail é obrigatório';
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.value.email)) {
              errors.value.email = 'Digite um e-mail válido';
            }
          }
          break;
        case 'matricula':
          if (!formData.value.matricula) {
            errors.value.matricula = 'A matrícula é obrigatória';
          }
          break;
      }
    };

    const validateForm = () => {
      let isValid = true;
      
      // Validar todos os campos
      validateField('username');
      validateField('email');
      validateField('matricula');

      // Verificar se há algum erro
      isValid = !Object.values(errors.value).some(error => error !== '');

      return isValid;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      loading.value = true;
      message.value = '';
      messageType.value = '';
      // Limpar erros anteriores
      Object.keys(errors.value).forEach(key => {
        errors.value[key] = '';
      });

      try {
        const dadosCadastro = {
          nome: formData.value.username,
          email: formData.value.email,
          matricula: formData.value.matricula,
          senha: formData.value.matricula,
          tipo: 'aluno'
        };

        const response = await axios.post('http://localhost:8000/api/v1/gerenciador/alunos', dadosCadastro, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 201 || response.status === 200) {
          message.value = 'Aluno cadastrado com sucesso! A senha é igual à matrícula.';
          messageType.value = 'success';
          await carregarAlunos();
          showModal.value = false;
          resetForm();
        }
      } catch (err) {
        console.error('Erro ao cadastrar:', err);
        
        // Tratamento específico para erros de validação do backend
        if (err.response?.data?.errors) {
          const backendErrors = err.response.data.errors;
          Object.keys(backendErrors).forEach(field => {
            if (field === 'matricula') {
              errors.value.matricula = backendErrors[field][0];
            }
            if (field === 'email') {
              errors.value.email = backendErrors[field][0];
            }
            if (field === 'nome') {
              errors.value.username = backendErrors[field][0];
            }
          });
        } else {
          message.value = err.response?.data?.message || 'Erro ao cadastrar aluno';
          messageType.value = 'error';
        }
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      formData.value = {
        username: '',
        email: '',
        matricula: '',
        tipo: 'aluno'
      };
      errors.value = {
        username: '',
        email: '',
        matricula: ''
      };
      message.value = '';
      messageType.value = '';
    };

    const carregarAlunos = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/gerenciador/alunos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.status === 'success') {
          alunos.value = response.data.data.alunos;
        }
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      }
    };

    // Adicionar função para alterar status do aluno
    const alterarStatus = async (aluno) => {
      try {
        const response = await axios.put(`http://localhost:8000/api/v1/gerenciador/alunos/${aluno.id}/status`, {
          ativo: !aluno.ativo
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          await carregarAlunos(); // Recarrega a lista
        }
      } catch (err) {
        console.error('Erro ao alterar status:', err);
      }
    };

    // Atualizar função para visualizar registros do aluno
    const verRegistros = (aluno) => {
      router.push(`/aluno/${aluno.id}/frequencia`);
    };

    const abrirModalEdicao = (aluno) => {
      alunoSelecionado.value = aluno;
      editFormData.value.matricula = aluno.matricula;
      showEditModal.value = true;
    };

    const handleEditSubmit = async () => {
      if (!editFormData.value.matricula) {
        editErrors.value.matricula = 'A matrícula é obrigatória';
        return;
      }

      try {
        const response = await axios.put(
          `http://localhost:8000/api/v1/alunos/${alunoSelecionado.value.id}/matricula`,
          { matricula: editFormData.value.matricula },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.status === 'success') {
          editMessage.value = 'Matrícula atualizada com sucesso!';
          editMessageType.value = 'success';
          await carregarAlunos();
          setTimeout(() => {
            showEditModal.value = false;
            editFormData.value.matricula = '';
            editMessage.value = '';
          }, 2000);
        }
      } catch (err) {
        editMessage.value = err.response?.data?.message || 'Erro ao atualizar matrícula';
        editMessageType.value = 'error';
      }
    };

    const handleCancel = () => {
      showModal.value = false;
      resetForm();
    };

    // Observar mudanças no showModal
    watch(showModal, (newValue) => {
      if (!newValue) {
        resetForm();
      }
    });

    // Carregar alunos ao montar o componente
    carregarAlunos();

    return {
      showModal,
      showEditModal,
      loading,
      message,
      messageType,
      editMessage,
      editMessageType,
      showPassword,
      formData,
      editFormData,
      errors,
      editErrors,
      hasErrors,
      searchTerm,
      alunos,
      filteredAlunos,
      validateField,
      handleSubmit,
      handleCancel,
      carregarAlunos,
      alterarStatus,
      verRegistros,
      abrirModalEdicao,
      handleEditSubmit
    };
  }
};
</script>

<style scoped>
.gerenciar-alunos-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-actions h2 {
  color: #1a237e;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.header-actions button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.header-actions button i {
  margin-right: 0.75rem;
}

.header-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.alunos-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-bar {
  padding: 1.5rem;
  border-bottom: 1px solid #edf2f7;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background-color: white;
}

.table-container {
  overflow-x: auto;
  padding: 0.5rem;
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
  gap: 0.5rem;
}

.status-badge.active {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.inactive {
  background-color: #fed7d7;
  color: #822727;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-button.view {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.action-button.edit {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.action-button.status.block {
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
}
.action-button.status.activate {
  background: linear-gradient(135deg, #68d391 0%, #38a169 100%);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #718096;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-data i {
  font-size: 3rem;
  color: #a0aec0;
}

/* Modal Styles */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #2d3748;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background-color: #c6f6d5;
  color: #22543d;
}

.message.error {
  background-color: #fed7d7;
  color: #822727;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .gerenciar-alunos-container {
    padding: 1rem;
  }

  .header-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }

  .header-actions button {
    justify-content: center;
  }

  .table-container {
    margin: 0 -1rem;
  }

  td, th {
    padding: 0.75rem;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
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

.gerenciar-alunos-container {
  animation: fadeIn 0.5s ease-out;
}
</style> 