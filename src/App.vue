<template>
  <div id="app">
    <div v-if="authStore.isAuthenticated" class="container">
      <nav class="nav">
        <router-link to="/" class="nav-brand">🏆 小学霸冒险记</router-link>
        <div class="nav-links">
          <router-link to="/">仪表盘</router-link>
          <router-link to="/plan">本周计划</router-link>
          <router-link to="/progress">每日进度</router-link>
          <router-link to="/approve">评分</router-link>
          <router-link to="/settings">设置</router-link>
          <button @click="handleLogout" class="logout-btn" title="登出" aria-label="登出">
            <svg class="logout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
              <path d="M16 13V11H8V8L3 12L8 16V13H16Z" fill="currentColor" />
              <path d="M20 3H12V5H20V19H12V21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
    <router-view />
    <AppModal />
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from './stores/player.store'
import { useAuthStore } from './stores/auth.store'
import { useModal } from './composables/useModal'
import AppModal from './components/shared/AppModal.vue'
import AppToast from './components/shared/AppToast.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const authStore = useAuthStore()
const { showConfirm } = useModal()

onMounted(() => playerStore.load())

async function handleLogout() {
  const confirmed = await showConfirm('确定要登出吗？', '退出确认')
  if (confirmed) {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.18s;
  opacity: 0.95;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logout-btn .logout-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text);
}

.logout-btn:hover {
  background: rgba(255, 107, 157, 0.06);
  transform: translateY(-2px);
}

.logout-btn:active {
  transform: translateY(0);
}
</style>
