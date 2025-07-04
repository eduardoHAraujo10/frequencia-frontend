import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'primevue': path.resolve(__dirname, 'node_modules/primevue'),
    },
  },
  optimizeDeps: {
    include: ['primevue/ripple']
  },
  build: {
    commonjsOptions: {
      esmExternals: true
    }
  }
})
