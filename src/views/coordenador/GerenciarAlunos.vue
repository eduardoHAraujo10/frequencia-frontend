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
            label="Nome de usuário"
            :error="errors.username"
          />
        </div>

        <div class="form-group">
          <va-input
            v-model="formData.password"
            type="password"
            label="Senha"
            :error="errors.password"
          />
        </div>

        <div class="form-actions">
          <va-button flat @click="showModal = false">
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
                <button class="action-button view" @click="verRegistros(aluno)">
                  <i class="fas fa-list"></i>
                </button>
                <button class="action-button status" @click="alterarStatus(aluno)">
                  <i :class="['fas', aluno.ativo ? 'fa-ban' : 'fa-check']"></i>
                </button>
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
import { ref, computed } from 'vue';
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
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const showPassword = ref(false);
    const searchTerm = ref('');
    const alunos = ref([]);

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
          if (formData.value.username.length < 3) {
            errors.value.username = 'O nome de usuário deve ter pelo menos 3 caracteres';
          }
          break;
        case 'password':
          if (formData.value.password.length < 8) {
            errors.value.password = 'A senha deve ter pelo menos 8 caracteres';
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.value.email)) {
            errors.value.email = 'Digite um e-mail válido';
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
      ['username', 'password', 'email', 'matricula'].forEach(field => {
        validateField(field);
      });
      return !hasErrors.value;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      message.value = '';
      messageType.value = '';

      try {
        // Criar objeto com dados do formulário e senha igual à matrícula
        const dadosCadastro = {
          ...formData.value,
          password: formData.value.password // Define a senha igual à matrícula
        };

        const response = await axios.post('http://localhost:8000/api/v1/gerenciador/alunos', dadosCadastro, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.status === 'success') {
          message.value = 'Aluno cadastrado com sucesso! A senha é igual à matrícula.';
          messageType.value = 'success';
          await carregarAlunos(); // Recarrega a lista
          setTimeout(() => {
            showModal.value = false;
            resetForm();
          }, 2000);
        }
      } catch (err) {
        message.value = err.response?.data?.message || 'Erro ao cadastrar aluno';
        messageType.value = 'error';
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      formData.value = {
        username: '',
        password: '',
        email: '',
        matricula: '',
        tipo: 'aluno'
      };
      errors.value = {
        username: '',
        password: '',
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
          message.value = `Aluno ${aluno.ativo ? 'desativado' : 'ativado'} com sucesso!`;
          messageType.value = 'success';
          await carregarAlunos(); // Recarrega a lista
        }
      } catch (err) {
        message.value = err.response?.data?.message || 'Erro ao alterar status do aluno';
        messageType.value = 'error';
      }
    };

    // Atualizar função para visualizar registros do aluno
    const verRegistros = (aluno) => {
      router.push(`/aluno/${aluno.id}/frequencia`);
    };

    // Carregar alunos ao montar o componente
    carregarAlunos();

    return {
      showModal,
      loading,
      message,
      messageType,
      showPassword,
      formData,
      errors,
      hasErrors,
      searchTerm,
      alunos,
      filteredAlunos,
      validateField,
      handleSubmit,
      carregarAlunos,
      alterarStatus,
      verRegistros
    };
  }
};
</script>

<style scoped>
.gerenciar-alunos-container {
  padding: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.input-error {
  border-color: #dc3545;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.form-group {
  margin-bottom: 1rem;
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

.search-bar {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
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

.action-button.view {
  background-color: #17a2b8;
}

.action-button.status {
  background-color: #6c757d;
}

.action-button.status:hover {
  background-color: #5a6268;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

  th, td {
    padding: 0.75rem;
  }
}

:deep(.p-float-label) {
  margin-bottom: 0.5rem;
}

:deep(.p-float-label input), 
:deep(.p-password input) {
  width: 100%;
  height: 3rem;
  padding: 0.75rem 1rem;
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
</style> 