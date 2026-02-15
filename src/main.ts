import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/DashboardPage.vue') },
    { path: '/plan', component: () => import('./pages/PlanPage.vue') },
    { path: '/progress/:date?', component: () => import('./pages/ProgressPage.vue') },
    { path: '/approve/:date?', component: () => import('./pages/ApprovePage.vue') },
    { path: '/settings', component: () => import('./pages/SettingsPage.vue') },
    { path: '/history/:weekId', component: () => import('./pages/HistoryPage.vue') },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
