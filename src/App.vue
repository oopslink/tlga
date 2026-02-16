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
          <button @click="handleLogout" class="logout-btn" title="登出">🚪</button>
        </div>
      </nav>
    </div>
    <router-view />
    <AppModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from './stores/player.store'
import { useAuthStore } from './stores/auth.store'
import AppModal from './components/shared/AppModal.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const authStore = useAuthStore()

onMounted(() => playerStore.load())

function handleLogout() {
  if (confirm('确定要登出吗？')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.logout-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  opacity: 0.7;
}

.logout-btn:hover {
  background: rgba(255, 107, 157, 0.1);
  opacity: 1;
  transform: translateY(-2px);
}

.logout-btn:active {
  transform: translateY(0);
}
</style>
