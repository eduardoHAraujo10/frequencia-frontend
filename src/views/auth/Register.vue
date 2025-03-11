<template>
  <div class="register-container">
    <div class="register-card">
      <h2>Cadastro de Usuário</h2>
      <form @submit.prevent="handleSubmit" class="register-form">
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
              {{ showPassword ? '🔒' : '👁️' }}
            </button>
          </div>
          <span class="error-text" v-if="errors.password">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="matricula">Matrícula</label>
          <input
            type="text"
            id="matricula"
            v-model="formData.matricula"
            required
            :class="{ 'input-error': errors.matricula }"
            placeholder="Digite sua matrícula"
            @blur="validateField('matricula')"
          />
          <span class="error-text" v-if="errors.matricula">{{ errors.matricula }}</span>
        </div>

        <div class="form-group">
          <label for="tipo">Tipo de Usuário</label>
          <select 
            id="tipo" 
            v-model="formData.tipo" 
            required
            :class="{ 'input-error': errors.tipo }"
            @blur="validateField('tipo')"
          >
            <option value="">Selecione o tipo</option>
            <option value="coordenador">Coordenador</option>
            <option value="aluno">Aluno</option>
          </select>
          <span class="error-text" v-if="errors.tipo">{{ errors.tipo }}</span>
        </div>

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
          <a href="#" @click.prevent="goToLogin">Faça login</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Register',
  data() {
    return {
      formData: {
        nome: '',
        email: '',
        password: '',
        matricula: '',
        tipo: ''
      },
      errors: {
        nome: '',
        email: '',
        password: '',
        matricula: '',
        tipo: ''
      },
      loading: false,
      error: null,
      success: false,
      showPassword: false
    };
  },
  computed: {
    hasErrors() {
      return Object.values(this.errors).some(error => error !== '');
    }
  },
  methods: {
    validateField(field) {
      this.errors[field] = '';
      
      switch (field) {
        case 'nome':
          if (this.formData.nome.length < 3) {
            this.errors.nome = 'O nome deve ter pelo menos 3 caracteres';
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(this.formData.email)) {
            this.errors.email = 'Digite um e-mail válido';
          }
          break;
        case 'password':
          if (this.formData.password.length < 6) {
            this.errors.password = 'A senha deve ter pelo menos 6 caracteres';
          }
          break;
        case 'matricula':
          if (!this.formData.matricula) {
            this.errors.matricula = 'A matrícula é obrigatória';
          }
          break;
        case 'tipo':
          if (!this.formData.tipo) {
            this.errors.tipo = 'Selecione um tipo de usuário';
          }
          break;
      }
    },
    validateForm() {
      ['nome', 'email', 'password', 'matricula', 'tipo'].forEach(field => {
        this.validateField(field);
      });
      return !this.hasErrors;
    },
    async handleSubmit() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = null;
      this.success = false;

      try {
        const response = await axios.post('http://localhost:8000/api/v1/auth/register', this.formData);
        
        if (response.data) {
          this.success = true;
          setTimeout(() => {
            this.$router.push({
              path: '/login',
              query: { 
                registered: 'true',
                email: this.formData.email 
              }
            });
          }, 2000);
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.';
      } finally {
        this.loading = false;
      }
    },
    goToLogin() {
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f5f5;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

h2 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

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

label {
  font-weight: 600;
  color: #444;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus, select:focus {
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

.success-message {
  color: #28a745;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #e8f5e9;
  border-radius: 4px;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 1.5rem;
  }

  input, select, button {
    padding: 0.875rem;
  }
}
</style> 