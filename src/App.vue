<template>
  <div id="app">
    <nav class="nav container">
      <router-link to="/" class="nav-brand">🏆 小学霸冒险记</router-link>
      <div class="nav-links">
        <router-link to="/">仪表盘</router-link>
        <router-link to="/plan">周计划</router-link>
        <router-link to="/progress">每日进度</router-link>
        <router-link to="/approve">审批</router-link>
      </div>
    </nav>
    <router-view />
    <AppModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from './stores/player.store'
import AppModal from './components/shared/AppModal.vue'

const playerStore = usePlayerStore()
onMounted(() => playerStore.load())
</script>
