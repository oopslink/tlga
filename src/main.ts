import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { injectSpeedInsights } from '@vercel/speed-insights'
import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./pages/LoginPage.vue'), meta: { requiresAuth: false } },
    { path: '/', component: () => import('./pages/DashboardPage.vue'), meta: { requiresAuth: true } },
    { path: '/plan', component: () => import('./pages/PlanPage.vue'), meta: { requiresAuth: true } },
    { path: '/progress/:date?', component: () => import('./pages/ProgressPage.vue'), meta: { requiresAuth: true } },
    { path: '/approve/:date?', component: () => import('./pages/ApprovePage.vue'), meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('./pages/SettingsPage.vue'), meta: { requiresAuth: true } },
    { path: '/history/:weekId', component: () => import('./pages/HistoryPage.vue'), meta: { requiresAuth: true } },
    { path: '/thinking-archive', component: () => import('./pages/ThinkingArchivePage.vue'), meta: { requiresAuth: true } },
  ],
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化认证状态
const authStore = useAuthStore()
authStore.init()

// 路由守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，重定向到登录页
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 已登录访问登录页，重定向到首页
    next('/')
  } else {
    next()
  }
})

app.mount('#app')

// Initialize Vercel Speed Insights
if (import.meta.env.PROD) {
  injectSpeedInsights()
}
