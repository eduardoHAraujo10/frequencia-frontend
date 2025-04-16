<template>
  <div class="register-container">
    <img src="../../assets/logo-unifil.svg" alt="Logo Unifil" class="logo-unifil" />
    <div class="register-card">
      <h2>Cadastro de Coordenador</h2>
      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-row">
          <div class="form-group full-width">
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
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="nome">Nome</label>
            <input
              type="text"
              id="nome"
              v-model="formData.nome"
              required
              :class="{ 'input-error': errors.nome }"
              placeholder="Digite seu nome completo"
              @blur="validateField('nome')"
            />
            <span class="error-text" v-if="errors.nome">{{ errors.nome }}</span>
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
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="loading || hasErrors">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Cadastrando...' : 'Cadastrar' }}
          </button>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="success" class="success-message">
            Cadastro realizado com sucesso! Redirecionando...
          </div>

          <p class="login-link">
            Já possui uma conta? 
            <router-link to="/login">Faça login</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const formData = ref({
  nome: '',
  email: '',
  password: '',
  tipo: 'coordenador' // Definindo tipo fixo como coordenador
});

const errors = ref({
  nome: '',
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref(null);
const success = ref(false);
const showPassword = ref(false);

const hasErrors = computed(() => {
  return Object.values(errors.value).some(error => error !== '');
});

const validateField = (field) => {
  errors.value[field] = '';
  
  switch (field) {
    case 'nome':
      if (formData.value.nome.length < 3) {
        errors.value.nome = 'O nome deve ter pelo menos 3 caracteres';
      }
      break;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.value.email)) {
        errors.value.email = 'Digite um e-mail válido';
      }
      break;
    case 'password':
      if (formData.value.password.length < 6) {
        errors.value.password = 'A senha deve ter pelo menos 6 caracteres';
      }
      break;
  }
};

const validateForm = () => {
  ['nome', 'email', 'password'].forEach(field => {
    validateField(field);
  });
  return !hasErrors.value;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    const response = await axios.post('http://localhost:8000/api/v1/auth/register', formData.value);
    
    if (response.data) {
      success.value = true;
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { 
            registered: 'true',
            email: formData.value.email 
          }
        });
      }, 2000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
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

.register-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  backdrop-filter: blur(10px);
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeIn 0.6s ease-out;
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
}

h2 {
  color: #1a237e;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

input, select {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  height: 3rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background-color: #fff;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-input input {
  width: 100%;
  padding-right: 2.5rem;
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
  margin-top: 1rem;
  height: 3rem;
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

.success-message {
  background-color: #4caf50;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: slideDown 0.5s ease;
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

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.login-link a {
  color: #FF6B00;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.login-link a::after {
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

.login-link a:hover::after {
  transform: scaleX(1);
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

@media (max-width: 768px) {
  .register-card {
    padding: 2rem;
    max-width: 500px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 1rem;
  }

  .register-card {
    padding: 1.5rem;
    border-radius: 12px;
  }

  .form-row {
    gap: 1rem;
  }

  input, select, button[type="submit"] {
    height: 2.75rem;
    padding: 0.75rem 1rem;
  }
}
</style> 