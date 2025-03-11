<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Página não encontrada</h2>
    <p>Desculpe, a página que você está procurando não existe.</p>
    <router-link to="/" class="home-link">
      Voltar para Home
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 6rem;
  color: #dc3545;
  margin: 0;
}

h2 {
  font-size: 2rem;
  color: #6c757d;
  margin: 1rem 0;
}

p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.home-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.home-link:hover {
  background-color: #0056b3;
}
</style> 