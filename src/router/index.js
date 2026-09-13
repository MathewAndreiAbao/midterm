// ---------------------------------------------------------------------------
// The pages of the app and the address (URL) of each one.
// ---------------------------------------------------------------------------
import { createRouter, createWebHistory } from '@ionic/vue-router';

import TabsPage from '../views/TabsPage.vue';
import ExpensesPage from '../views/ExpensesPage.vue';
import SummaryPage from '../views/SummaryPage.vue';
import AboutPage from '../views/AboutPage.vue';

const routes = [
  // If someone opens "/", send them to the expenses list.
  { path: '/', redirect: '/tabs/expenses' },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/expenses' },
      { path: 'expenses', component: ExpensesPage },
      { path: 'summary', component: SummaryPage },
      { path: 'about', component: AboutPage },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

export default router;
