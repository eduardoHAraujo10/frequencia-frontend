import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import VueToast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Componentes PrimeVue
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import PrimeToast from 'primevue/toast';

// Estilos
import 'primevue/resources/themes/lara-light-blue/theme.css';     // tema
import 'primevue/resources/primevue.min.css';              // core css
import 'primeicons/primeicons.css';                       // ícones

const app = createApp(App);

// Registrando componentes globalmente
app.component('Button', Button);
app.component('Avatar', Avatar);
app.component('Tag', Tag);
app.component('Card', Card);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Divider', Divider);
app.component('Toast', PrimeToast);
app.component('Dialog', Dialog);

app.use(router);
app.use(PrimeVue);
app.use(ToastService);
app.use(VueToast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
});
app.mount('#app');
