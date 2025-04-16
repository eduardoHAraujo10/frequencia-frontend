import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuestic, createIconsConfig } from 'vuestic-ui'
import 'vuestic-ui/css'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue';
import router from './router';

const fonts = [{
  name: 'mdi-{code}',
  resolve: ({ code }) => ({
    class: `mdi mdi-${code}`,
    tag: 'i'
  })
}]

const app = createApp(App);

app.use(createPinia());

app.use(createVuestic({
  config: {
    icons: createIconsConfig({ fonts }),
    colors: {
      variables: {
        primary: '#FF6B00',
        secondary: '#FF9E4F',
        background: '#f5f6fa',
        content: '#ffffff',
        text: '#2B3674',
        textSecondary: '#A3AED0',
        border: '#E0E5F2',
        shadow: 'rgba(112, 144, 176, 0.08)'
      }
    }
  }
}));

app.use(router);
app.mount('#app');
