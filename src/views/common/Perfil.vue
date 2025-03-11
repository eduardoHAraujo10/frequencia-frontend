<template>
  <div class="perfil-container">
    <div class="perfil-card">
      <div class="perfil-header">
        <h2>Meu Perfil</h2>
        <button v-if="!editMode" @click="enableEdit" class="edit-button">
          <i class="fas fa-edit"></i>
          Editar
        </button>
      </div>

      <div class="avatar-section">
        <div class="avatar">
          <span>{{ userInitials }}</span>
        </div>
        <div class="user-type">
          {{ userRole === 'coordenador' ? 'Coordenador' : 'Aluno' }}
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="perfil-form">
        <div class="form-group">
          <label>Nome</label>
          <input
            type="text"
            v-model="formData.nome"
            :readonly="!editMode"
            :class="{ 'input-readonly': !editMode }"
          />
        </div>

        <div class="form-group">
          <label>E-mail</label>
          <input
            type="email"
            v-model="formData.email"
            :readonly="!editMode"
            :class="{ 'input-readonly': !editMode }"
          />
        </div>

        <div class="form-group" v-if="userRole === 'aluno'">
          <label>Matrícula</label>
          <input
            type="text"
            v-model="formData.matricula"
            readonly
            class="input-readonly"
          />
        </div>

        <div v-if="editMode" class="password-section">
          <h3>Alterar Senha</h3>
          <div class="form-group">
            <label>Senha Atual</label>
            <div class="password-input">
              <input
                :type="showPassword.current ? 'text' : 'password'"
                v-model="formData.currentPassword"
                placeholder="Digite sua senha atual"
              />
              <button 
                type="button"
                class="toggle-password"
                @click="togglePassword('current')"
              >
                <i :class="showPassword.current ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Nova Senha</label>
            <div class="password-input">
              <input
                :type="showPassword.new ? 'text' : 'password'"
                v-model="formData.newPassword"
                placeholder="Digite a nova senha"
              />
              <button 
                type="button"
                class="toggle-password"
                @click="togglePassword('new')"
              >
                <i :class="showPassword.new ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Confirmar Nova Senha</label>
            <div class="password-input">
              <input
                :type="showPassword.confirm ? 'text' : 'password'"
                v-model="formData.confirmPassword"
                placeholder="Confirme a nova senha"
              />
              <button 
                type="button"
                class="toggle-password"
                @click="togglePassword('confirm')"
              >
                <i :class="showPassword.confirm ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="editMode" class="form-actions">
          <button type="submit" class="save-button" :disabled="loading">
            <i class="fas fa-save"></i>
            {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
          <button type="button" class="cancel-button" @click="cancelEdit">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'Perfil',
  setup() {
    const editMode = ref(false);
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const originalData = ref({});
    const userRole = ref(localStorage.getItem('userRole'));
    
    const showPassword = ref({
      current: false,
      new: false,
      confirm: false
    });

    const formData = ref({
      nome: '',
      email: '',
      matricula: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const userInitials = computed(() => {
      return formData.value.nome
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    });

    const toast = useToast();

    const loadUserData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/usuarios/perfil', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          const userData = response.data.data.usuario;
          formData.value = {
            ...formData.value,
            id: userData.id,
            nome: userData.nome,
            email: userData.email,
            matricula: userData.matricula,
            tipo: userData.tipo,
            ativo: userData.ativo,
            ultimo_acesso: userData.ultimo_acesso,
            created_at: userData.created_at,
            updated_at: userData.updated_at
          };
          originalData.value = { ...formData.value };
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do perfil',
          life: 3000
        });
        console.error(error);
      }
    };

    const enableEdit = () => {
      editMode.value = true;
    };

    const cancelEdit = () => {
      editMode.value = false;
      formData.value = { ...originalData.value };
      formData.value.currentPassword = '';
      formData.value.newPassword = '';
      formData.value.confirmPassword = '';
      message.value = '';
    };

    const togglePassword = (field) => {
      showPassword.value[field] = !showPassword.value[field];
    };

    const validatePasswords = () => {
      if (formData.value.newPassword) {
        if (formData.value.newPassword.length < 6) {
          message.value = 'A nova senha deve ter pelo menos 6 caracteres';
          messageType.value = 'error';
          return false;
        }
        if (formData.value.newPassword !== formData.value.confirmPassword) {
          message.value = 'As senhas não coincidem';
          messageType.value = 'error';
          return false;
        }
        if (!formData.value.currentPassword) {
          message.value = 'Digite sua senha atual';
          messageType.value = 'error';
          return false;
        }
      }
      return true;
    };

    const handleSubmit = async () => {
      if (loading.value) return;
      if (!validatePasswords()) return;

      loading.value = true;
      message.value = '';

      try {
        const updateData = {
          nome: formData.value.nome,
          email: formData.value.email
        };

        if (formData.value.newPassword) {
          updateData.currentPassword = formData.value.currentPassword;
          updateData.newPassword = formData.value.newPassword;
        }

        const response = await axios.put('http://localhost:8000/api/v1/usuarios/perfil', updateData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          message.value = 'Perfil atualizado com sucesso!';
          messageType.value = 'success';
          editMode.value = false;
          localStorage.setItem('userName', formData.value.nome);
          localStorage.setItem('userEmail', formData.value.email);
          originalData.value = { ...formData.value };
        }
      } catch (err) {
        message.value = err.response?.data?.message || 'Erro ao atualizar perfil';
        messageType.value = 'error';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadUserData();
    });

    return {
      formData,
      editMode,
      loading,
      message,
      messageType,
      showPassword,
      userInitials,
      userRole,
      enableEdit,
      cancelEdit,
      togglePassword,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.perfil-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.perfil-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.perfil-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.perfil-header h2 {
  margin: 0;
  color: #333;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar {
  width: 100px;
  height: 100px;
  background-color: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
}

.user-type {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}

.perfil-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #444;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input-readonly {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.password-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.password-section h3 {
  margin-bottom: 1rem;
  color: #444;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.edit-button, .save-button, .cancel-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-button {
  background-color: #6c757d;
  color: white;
}

.save-button {
  background-color: #007bff;
  color: white;
  flex: 1;
}

.cancel-button {
  background-color: #dc3545;
  color: white;
}

.edit-button:hover {
  background-color: #5a6268;
}

.save-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.cancel-button:hover {
  background-color: #c82333;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
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

@media (max-width: 480px) {
  .perfil-container {
    padding: 1rem;
  }

  .perfil-card {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style> 