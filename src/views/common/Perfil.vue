<template>
  <div class="perfil-container">
    <div class="perfil-card">
      <div class="perfil-header">
        <h2>Meu Perfil</h2>
        <div class="header-actions" v-if="!editMode">
          <va-button class="action-button edit-button" @click="enableEdit">
            <i class="fas fa-edit"></i>
            Editar
          </va-button>
          <va-button class="action-button change-password-button" @click="showPasswordModal = true">
            <i class="fas fa-key"></i>
            Trocar Senha
          </va-button>
        </div>
      </div>

      <div class="avatar-section">
        <div class="avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar do usuário" class="avatar-image" />
          <span v-else>{{ userInitials }}</span>
          <input
            type="file"
            ref="fileInput"
            @change="handleAvatarUpload"
            accept="image/*"
            class="file-input"
            hidden
          />
          <button @click="triggerFileInput" class="upload-button" v-if="editMode">
            <i class="fas fa-camera"></i>
          </button>
        </div>
        <div class="user-type">
          {{ userRole === 'coordenador' ? 'Coordenador' : 'Aluno' }}
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="perfil-form">
        <div class="form-content">
          <div class="main-info">
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

    <!-- Modal de Troca de Senha -->
    <va-modal v-model="showPasswordModal" :title="'Trocar Senha'" hide-default-actions class="password-modal">
      <form @submit.prevent="handlePasswordChange" class="password-form">
        <div class="form-group">
          <label>Senha Atual</label>
          <div class="password-input">
            <input
              :type="showPassword.current ? 'text' : 'password'"
              v-model="passwordForm.currentPassword"
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
              v-model="passwordForm.newPassword"
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
              v-model="passwordForm.confirmPassword"
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

        <div class="modal-actions">
          <va-button class="modal-button cancel-button" @click="showPasswordModal = false" flat>
            <i class="fas fa-times"></i>
            Cancelar
          </va-button>
          <va-button class="modal-button confirm-button" type="submit" :loading="loading">
            <i class="fas fa-check"></i>
            Alterar Senha
          </va-button>
        </div>

        <div v-if="passwordMessage" :class="['message', passwordMessageType]">
          {{ passwordMessage }}
        </div>
      </form>
    </va-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useGlobalConfig } from 'vuestic-ui';
import { VaButton, VaModal } from 'vuestic-ui';

export default {
  name: 'Perfil',
  components: {
    VaButton,
    VaModal
  },
  setup() {
    const { setGlobalConfig } = useGlobalConfig();
    const editMode = ref(false);
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const originalData = ref({});
    const userRole = ref(localStorage.getItem('userRole'));
    const fileInput = ref(null);
    const avatarUrl = ref('');
    const showPasswordModal = ref(false);
    const passwordMessage = ref('');
    const passwordMessageType = ref('');
    
    const showPassword = ref({
      current: false,
      new: false,
      confirm: false
    });

    const formData = ref({
      nome: '',
      email: '',
      matricula: ''
    });

    const passwordForm = ref({
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

    const showNotification = (text, type = 'success') => {
      setGlobalConfig({
        notifications: {
          show: {
            text,
            color: type,
            duration: 3000,
          },
        },
      });
    };

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
            id: userData.id,
            nome: userData.nome,
            email: userData.email,
            matricula: userData.matricula,
            tipo: userData.tipo
          };
          originalData.value = { ...formData.value };
          
          if (userData.avatar_url) {
            const baseUrl = 'http://localhost:8000';
            avatarUrl.value = `${baseUrl}${userData.avatar_url}`;
          } else {
            avatarUrl.value = '';
          }
        }
      } catch (error) {
        showNotification('Erro ao carregar dados do perfil', 'danger');
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

    const handleSubmit = async () => {
      if (loading.value) return;

      loading.value = true;
      message.value = '';

      try {
        const updateData = {
          nome: formData.value.nome,
          email: formData.value.email
        };

        const response = await axios.put('http://localhost:8000/api/v1/usuarios/perfil', updateData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          showNotification('Perfil atualizado com sucesso');
          editMode.value = false;
          originalData.value = { ...formData.value };
        }
      } catch (error) {
        showNotification(error.response?.data?.message || 'Erro ao atualizar perfil', 'danger');
      } finally {
        loading.value = false;
      }
    };

    const handlePasswordChange = async () => {
      if (loading.value) return;

      if (passwordForm.value.newPassword.length < 6) {
        passwordMessage.value = 'A nova senha deve ter pelo menos 6 caracteres';
        passwordMessageType.value = 'error';
        return;
      }

      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        passwordMessage.value = 'As senhas não coincidem';
        passwordMessageType.value = 'error';
        return;
      }

      loading.value = true;
      passwordMessage.value = '';

      try {
        const response = await axios.put('http://localhost:8000/api/v1/usuarios/senha', {
          senha_atual: passwordForm.value.currentPassword,
          nova_senha: passwordForm.value.newPassword
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.status === 'success') {
          showNotification('Senha alterada com sucesso');
          showPasswordModal.value = false;
          passwordForm.value = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erro ao alterar senha';
        passwordMessage.value = errorMessage;
        passwordMessageType.value = 'error';
      } finally {
        loading.value = false;
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleAvatarUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validação do tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('O arquivo deve ser uma imagem (JPEG, PNG ou JPG)', 'danger');
        return;
      }

      // Validação do tamanho do arquivo (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotification('O tamanho máximo permitido é 2MB', 'danger');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        loading.value = true;
        const response = await axios.post('http://localhost:8000/api/v1/usuarios/avatar', formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.status === 'success') {
          // Constrói a URL completa do avatar
          const baseUrl = 'http://localhost:8000';
          const avatarPath = response.data.data.avatar_url;
          const fullAvatarUrl = `${baseUrl}${avatarPath}`;
          
          avatarUrl.value = fullAvatarUrl;
          showNotification('Avatar atualizado com sucesso');
          
          // Atualiza o avatar na barra lateral também
          const event = new CustomEvent('avatar-updated', { 
            detail: { avatarUrl: fullAvatarUrl } 
          });
          window.dispatchEvent(event);

          // Atualiza os dados do usuário para refletir o novo avatar
          await loadUserData();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erro ao atualizar avatar';
        showNotification(errorMessage, 'danger');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadUserData();
    });

    return {
      formData,
      passwordForm,
      editMode,
      loading,
      message,
      messageType,
      passwordMessage,
      passwordMessageType,
      showPassword,
      showPasswordModal,
      userInitials,
      userRole,
      fileInput,
      avatarUrl,
      enableEdit,
      cancelEdit,
      togglePassword,
      handleSubmit,
      handlePasswordChange,
      triggerFileInput,
      handleAvatarUpload
    };
  }
};
</script>

<style scoped>
.perfil-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

.perfil-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  animation: slideUp 0.4s ease;
}

.perfil-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.perfil-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.avatar {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  font-size: 3rem;
  font-weight: bold;
  box-shadow: 0 8px 16px rgba(66, 153, 225, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(66, 153, 225, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-button {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.avatar:hover .upload-button {
  opacity: 1;
}

.upload-button i {
  font-size: 1.2rem;
}

.file-input {
  display: none;
}

.user-type {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: #4a5568;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: #edf2f7;
  border-radius: 20px;
  display: inline-block;
}

.perfil-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.form-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  width: 100%;
}

.form-content:not(.editing) {
  grid-template-columns: 1fr;
}

.main-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.password-section {
  margin-top: 0;
  padding-top: 0;
  padding-left: 2rem;
  border-top: none;
  border-left: 2px solid #e2e8f0;
}

.password-section h3 {
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-size: 1.3rem;
  font-weight: 600;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.95rem;
}

input {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
  width: 100%;
}

input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  outline: none;
}

.input-readonly {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.8;
  width: 100%;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.3s ease;
}

.toggle-password:hover {
  color: #4299e1;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.edit-button,
.save-button,
.cancel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.edit-button {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
  color: white;
}

.edit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 85, 104, 0.2);
}

.save-button {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  flex: 1;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.cancel-button {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
}

.message {
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1.5rem;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.message.success {
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #276749;
}

.message.error {
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #9b2c2c;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .perfil-container {
    padding: 1rem;
  }

  .perfil-card {
    padding: 1.5rem;
  }

  .perfil-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .perfil-header h2 {
    font-size: 1.5rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .edit-button,
  .save-button,
  .cancel-button {
    width: 100%;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 768px) {
  .form-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .password-section {
    padding-left: 0;
    padding-top: 1.5rem;
    border-left: none;
    border-top: 2px solid #e2e8f0;
  }
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  font-weight: 600 !important;
  padding: 0.5rem 1.25rem !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
  font-size: 0.95rem !important;
}

.action-button i {
  margin-right: 6px;
  font-size: 1rem;
}

.edit-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: white !important;
}

.edit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.2) !important;
}

.change-password-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
  color: white !important;
}

.change-password-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(109, 40, 217, 0.2) !important;
}

/* Estilos do Modal */
.password-modal {
  border-radius: 16px;
  overflow: hidden;
}

.password-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 400px;
}

.password-form .form-group {
  margin-bottom: 1rem;
}

.password-form label {
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  display: block;
}

.password-form input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f9fafb;
}

.password-form input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background-color: white;
}

.password-form .password-input {
  position: relative;
}

.password-form .toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.3s ease;
}

.password-form .toggle-password:hover {
  color: #8b5cf6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.modal-button {
  font-weight: 600 !important;
  padding: 0.5rem 1.25rem !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  text-transform: none !important;
  font-size: 0.95rem !important;
}

.modal-button i {
  margin-right: 6px;
  font-size: 1rem;
}

.modal-button.cancel-button {
  color: #6b7280 !important;
}

.modal-button.cancel-button:hover {
  background-color: #f3f4f6 !important;
}

.modal-button.confirm-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
  color: white !important;
}

.modal-button.confirm-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.2) !important;
}

.message {
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.message.success {
  background: linear-gradient(135deg, #34d399 0%, #059669 100%);
  color: white;
}

.message.error {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
}

/* Responsividade */
@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-button {
    width: 100%;
  }

  .password-form {
    min-width: unset;
    width: 100%;
    padding: 1rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-button {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .perfil-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    justify-content: stretch;
  }
}
</style> 