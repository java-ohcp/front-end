import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'diagnose', component: () => import('../views/DiagnoseView.vue') },
    { path: '/knowledge', name: 'knowledge', component: () => import('../views/KnowledgeView.vue') },
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
