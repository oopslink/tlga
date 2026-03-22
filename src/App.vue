<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useAuthStore } from './stores/auth.store'
import { usePlayerStore } from './stores/player.store'

const authStore = useAuthStore()
const playerStore = usePlayerStore()

let isLaunching = true

onLaunch(() => {
  authStore.init()
  if (!authStore.isAuthenticated) {
    uni.reLaunch({ url: '/pages/login/index' })
  } else {
    playerStore.load()
  }
  // Allow onShow to run after first launch
  setTimeout(() => { isLaunching = false }, 500)
})

onShow(() => {
  // Guard against false triggers during launch and from uni.switchTab
  if (isLaunching) return
  if (!authStore.isAuthenticated) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<template>
  <view></view>
</template>
