import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/expenses',
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/expenses',
      },
      {
        path: 'expenses',
        component: () => import('@/views/ExpensesPage.vue'),
      },
      {
        path: 'summary',
        component: () => import('@/views/SummaryPage.vue'),
      },
      {
        path: 'about',
        component: () => import('@/views/AboutPage.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
