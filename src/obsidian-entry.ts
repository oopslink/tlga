import { Plugin, ItemView, type WorkspaceLeaf } from 'obsidian'
import { createApp, type App as VueApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppVue from './App.vue'
import { useAuthStore } from './stores/auth.store'
import { usePlayerStore } from './stores/player.store'

const VIEW_TYPE_TLGA = 'tlga-adventure'

// ── 镜像 main.ts 中的路由表，但用 createMemoryHistory ──
const ROUTES = [
  { path: '/login',            component: () => import('./pages/LoginPage.vue'),          meta: { requiresAuth: false } },
  { path: '/',                 component: () => import('./pages/DashboardPage.vue'),       meta: { requiresAuth: true } },
  { path: '/plan',             component: () => import('./pages/PlanPage.vue'),            meta: { requiresAuth: true } },
  { path: '/progress/:date?',  component: () => import('./pages/ProgressPage.vue'),        meta: { requiresAuth: true } },
  { path: '/approve/:date?',   component: () => import('./pages/ApprovePage.vue'),         meta: { requiresAuth: true } },
  { path: '/settings',         component: () => import('./pages/SettingsPage.vue'),        meta: { requiresAuth: true } },
  { path: '/history/:weekId',  component: () => import('./pages/HistoryPage.vue'),         meta: { requiresAuth: true } },
  { path: '/thinking-archive', component: () => import('./pages/ThinkingArchivePage.vue'), meta: { requiresAuth: true } },
  { path: '/templates',        component: () => import('./pages/TemplatePage.vue'),        meta: { requiresAuth: true } },
]

class TlgaView extends ItemView {
  private vueApp: VueApp | null = null

  getViewType(): string { return VIEW_TYPE_TLGA }
  getDisplayText(): string { return '小学霸冒险记' }
  getIcon(): string { return 'book-open' }

  async onOpen(): Promise<void> {
    // Obsidian 的 containerEl 结构：[0] = header, [1] = content
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('tlga-obsidian-root')

    const mountEl = container.createDiv({ cls: 'tlga-mount' })

    // 每次打开 view 创建独立的 pinia + router 实例
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ROUTES,
    })

    // 初始化认证，设置路由守卫
    const authStore = useAuthStore(pinia)
    authStore.init()

    router.beforeEach((to, _from, next) => {
      const requiresAuth = to.meta.requiresAuth !== false
      if (requiresAuth && !authStore.isAuthenticated) {
        next('/login')
      } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
      } else {
        next()
      }
    })

    this.vueApp = createApp(AppVue)
    this.vueApp.use(pinia)
    this.vueApp.use(router)
    this.vueApp.mount(mountEl)

    // 预加载玩家数据
    const playerStore = usePlayerStore(pinia)
    playerStore.load()
  }

  async onClose(): Promise<void> {
    this.vueApp?.unmount()
    this.vueApp = null
  }
}

export default class TlgaPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_TLGA, (leaf: WorkspaceLeaf) => new TlgaView(leaf))

    this.addRibbonIcon('book-open', '小学霸冒险记', () => this.activateView())

    this.addCommand({
      id: 'open-tlga',
      name: '打开小学霸冒险记',
      callback: () => this.activateView(),
    })
  }

  onunload(): void {
    // Obsidian 会自动清理已注册的 view
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app

    // 已有 tab 则直接激活，否则新开
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TLGA)[0]
    if (!leaf) {
      leaf = workspace.getLeaf('tab')
      await leaf.setViewState({ type: VIEW_TYPE_TLGA, active: true })
    }
    workspace.revealLeaf(leaf)
  }
}
