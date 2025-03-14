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
app.use(router);
app.use(createVuestic({
  config: {
    icons: createIconsConfig({ fonts })
  }
}));

app.mount('#app');
