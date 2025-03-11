<template>
  <div class="login-container">
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

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();

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

    const validateField = (field) => {
      errors.value[field] = '';
      
      switch (field) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.value.email)) {
            errors.value.email = 'Digite um e-mail válido';
          }
          break;
        case 'password':
          if (!formData.value.password) {
            errors.value.password = 'A senha é obrigatória';
          }
          break;
      }
    };

    const validateForm = () => {
      ['email', 'password'].forEach(field => {
        validateField(field);
      });
      return !Object.values(errors.value).some(error => error !== '');
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      error.value = null;

      // Criar um timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.'));
        }, 10000); // 10 segundos
      });

      try {
        // Competição entre a requisição e o timeout
        const response = await Promise.race([
          axios.post('http://localhost:8000/api/v1/auth/login', formData.value),
          timeoutPromise
        ]);
        
        if (response.data.status === 'success') {
          // Salvar dados do usuário retornados pela API
          localStorage.setItem('token', response.data.data.token);
          localStorage.setItem('userRole', response.data.data.user.tipo);
          localStorage.setItem('userName', response.data.data.user.nome);
          localStorage.setItem('userEmail', response.data.data.user.email);
          
          // Redirecionar baseado no tipo de usuário retornado pela API
          if (response.data.data.user.tipo === 'coordenador') {
            router.push('/dashboard-coordenador');
          } else {
            router.push('/registro-ponto');
          }
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

    return {
      formData,
      errors,
      loading,
      error,
      showPassword,
      validateField,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f5f5;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
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
  color: #444;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.input-error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.875rem;
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
  padding: 0;
  font-size: 1.25rem;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #ffe6e6;
  border-radius: 4px;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  input, button {
    padding: 0.875rem;
  }
}
</style> 