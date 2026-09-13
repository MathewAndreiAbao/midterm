// ---------------------------------------------------------------------------
// main.js - the starting point of the app.
// ---------------------------------------------------------------------------
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';

import App from './App.vue';
import router from './router/index.js';

/* Ionic's own stylesheets. These are required for its components to work. */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/text-alignment.css';

/* Our own styles. */
import './theme/fonts.css';
import './theme/variables.css';

const app = createApp(App);
app.use(IonicVue);
app.use(router);

router.isReady().then(() => {
  app.mount('#app');
});
