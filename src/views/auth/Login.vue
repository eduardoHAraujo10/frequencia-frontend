<template>
  <div class="login-container">
    <img src="../../assets/logo-unifil.svg" alt="Logo Unifil" class="logo-unifil" />
    <div class="login-card">
      <h2>Login</h2>
      
      <div v-if="$route.query.registered" class="success-message">
        Cadastro realizado com sucesso! Por favor, faça login com suas credenciais.
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            required
            :class="{ 'input-error': errors.email }"
            placeholder="Digite seu e-mail"
            @blur="validateField('email')"
          />
          <span class="error-text" v-if="errors.email">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <div class="password-input">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              required
              :class="{ 'input-error': errors.password }"
              placeholder="Digite sua senha"
              @blur="validateField('password')"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span class="error-text" v-if="errors.password">{{ errors.password }}</span>
        </div>

        <button type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <p class="register-link">
          Não possui uma conta? 
          <router-link to="/register">Cadastre-se</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  email: '',
  password: ''
});

const errors = ref({
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref(null);
const showPassword = ref(false);

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.value.email) {
    errors.value.email = 'O e-mail é obrigatório';
    return false;
  }
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = 'Digite um e-mail válido';
    return false;
  }
  errors.value.email = '';
  return true;
};

const validatePassword = () => {
  if (!formData.value.password) {
    errors.value.password = 'A senha é obrigatória';
    return false;
  }
  errors.value.password = '';
  return true;
};

const validateForm = () => {
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  return isEmailValid && isPasswordValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = null;

  // Criar um timeout de 10 segundos
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.'));
    }, 10000);
  });

  try {
    // Competição entre a requisição e o timeout
    const response = await Promise.race([
      axios.post('http://localhost:8000/api/v1/auth/login', formData.value),
      timeoutPromise
    ]);

    if (response.data.status === 'success') {
      // Login usando a store de autenticação
      await authStore.login({
        token: response.data.data.token,
        tipo: response.data.data.user.tipo,
        nome: response.data.data.user.nome,
        email: response.data.data.user.email
      });

      // Aguarda um tick para garantir que o estado foi atualizado
      await nextTick();

      // Redireciona baseado no tipo de usuário
      const route = response.data.data.user.tipo === 'coordenador'
        ? '/dashboard-coordenador'
        : '/registro-ponto';

      // Força uma atualização da rota
      await router.replace(route);
    } else {
      error.value = response.data.message || 'Erro ao realizar login. Verifique suas credenciais.';
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.';
    if (err.response?.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([field, messages]) => {
        errors.value[field] = messages[0];
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #e0e0e0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
}

.logo-unifil {
  width: 300px;
  height: auto;
  margin-bottom: 3rem;
  display: block;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(10px);
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
}

h2 {
  color: #FF6B00;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.success-message {
  background-color: #4caf50;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: slideDown 0.5s ease;
}

.login-form {
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
  color: #333;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-input input {
  width: 100%;
  padding-right: 2.5rem; /* Espaço para o ícone */
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #666;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.toggle-password:hover {
  color: #333;
}

input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background-color: #fff;
}

.input-error {
  border-color: #ef5350;
  background-color: #fff8f8;
}

.error-text {
  color: #ef5350;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-text::before {
  content: "⚠";
}

button[type="submit"] {
  background: linear-gradient(135deg, #FF6B00 0%, #FF9E4F 100%);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

button[type="submit"]:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 0, 0.4);
}

button[type="submit"]:active:not(:disabled) {
  transform: translateY(0);
}

button[type="submit"]:disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  cursor: not-allowed;
  transform: none;
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  color: #fff;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
  border-radius: 8px;
  animation: slideDown 0.5s ease;
  font-weight: 500;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.register-link a {
  color: #FF6B00;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.register-link a::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #FF6B00;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.register-link a:hover::after {
  transform: scaleX(1);
}

@media (max-width: 480px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 1.5rem;
    border-radius: 12px;
  }

  h2 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  input {
    padding: 0.875rem;
  }

  button[type="submit"] {
    padding: 0.875rem;
  }
}

/* Adiciona animação de entrada */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  animation: fadeIn 0.6s ease-out;
}
</style> 