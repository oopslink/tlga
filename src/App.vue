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

<style>
/* ── Global styles adapted from Web version ── */

page {
  /* Vibrant Adventure Palette */
  --color-bg: #fef3f0;
  --color-bg-card: #ffffff;
  --color-bg-elevated: #fff9f7;

  --color-primary: #ff6b9d;
  --color-primary-dark: #ff4d88;
  --color-primary-light: #ffb4d1;

  --color-gold: #ffb627;
  --color-gold-dark: #ff9500;
  --color-gold-glow: rgba(255, 182, 39, 0.3);

  --color-xp: #5eaeff;
  --color-xp-dark: #2d8cff;
  --color-xp-glow: rgba(94, 174, 255, 0.2);

  --color-star: #c77dff;
  --color-star-dark: #9d4edd;
  --color-star-glow: rgba(199, 125, 255, 0.3);

  --color-text: #2d2d2d;
  --color-text-dim: #888888;
  --color-text-inverse: #ffffff;

  --color-success: #06d6a0;
  --color-warning: #ffa800;
  --color-danger: #ef476f;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #ff6b9d 0%, #ff9a76 100%);
  --gradient-gold: linear-gradient(135deg, #ffb627 0%, #ffda76 100%);
  --gradient-xp: linear-gradient(135deg, #5eaeff 0%, #a8d8ff 100%);
  --gradient-star: linear-gradient(135deg, #c77dff 0%, #e0aaff 100%);
  --gradient-bg: linear-gradient(135deg, #fef3f0 0%, #ffeef0 50%, #fff5f7 100%);

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(255, 107, 157, 0.1);
  --shadow-md: 0 4px 16px rgba(255, 107, 157, 0.15);
  --shadow-lg: 0 8px 32px rgba(255, 107, 157, 0.2);
  --shadow-xl: 0 16px 48px rgba(255, 107, 157, 0.25);

  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
  background: var(--gradient-bg);
  color: var(--color-text);
  line-height: 1.6;
  min-height: 100%;
}

view, text, image, scroll-view {
  box-sizing: border-box;
}

.container {
  max-width: 750rpx;
  margin: 0 auto;
  padding: 24rpx;
}

.card {
  background: var(--color-bg-card);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-md);
  border: 2rpx solid rgba(255, 107, 157, 0.08);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: var(--gradient-primary);
}

.button {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 16rpx;
  padding: 14rpx 32rpx;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 157, 0.3);
  position: relative;
  overflow: hidden;
}

.button:active {
  transform: translateY(-1px) scale(0.98);
}

.button[disabled] {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.input, .select {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 12rpx;
  padding: 12rpx 18rpx;
  font-size: 16px;
  width: 100%;
  margin-bottom: 12rpx;
}

.label {
  display: block;
  font-weight: 600;
  margin-bottom: 8rpx;
  color: var(--color-text);
}

.checkbox {
  width: 24px;
  height: 24px;
}

h1, h2, h3, h4,
.h1, .h2, .h3, .h4 {
  font-weight: 700;
  margin-bottom: 16rpx;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.h1 {
  font-size: 40px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.h2 {
  font-size: 28px;
  color: var(--color-primary);
}

.h3 {
  font-size: 22px;
  color: var(--color-text);
}

.gold {
  color: var(--color-gold);
  font-weight: 700;
}

.xp {
  color: var(--color-xp);
  font-weight: 700;
}

.star {
  color: var(--color-star);
  font-weight: 700;
}

.loading {
  text-align: center;
  padding: 60rpx 40rpx;
  font-size: 1.2rem;
  color: var(--color-primary);
}

.error {
  background: linear-gradient(135deg, rgba(239, 71, 111, 0.1) 0%, rgba(255, 107, 157, 0.15) 100%);
  border: 3rpx solid var(--color-danger);
  color: var(--color-danger);
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(239, 71, 111, 0.2);
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.task-section {
  background: var(--color-bg-elevated);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid rgba(255, 107, 157, 0.08);
  position: relative;
  overflow: hidden;
}

.task-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6rpx;
  height: 100%;
  background: var(--gradient-gold);
}

.form-group {
  margin-bottom: 20rpx;
}

.form-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: var(--color-bg-elevated);
  border-radius: 12rpx;
  border: 2rpx solid rgba(255, 107, 157, 0.08);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.3);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  padding: 0;
  border: none;
  border-radius: 8rpx;
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-icon:active {
  transform: scale(0.95);
}

.btn-icon.btn-icon-sm {
  width: 56rpx;
  height: 56rpx;
  font-size: 0.9rem;
}

.btn-icon.btn-icon-danger {
  background: rgba(239, 71, 111, 0.1);
  color: var(--color-danger);
}

.btn-icon.btn-icon-success {
  background: rgba(6, 214, 160, 0.1);
  color: var(--color-success);
}

.btn-icon.btn-icon-warning {
  background: rgba(255, 168, 0, 0.1);
  color: var(--color-warning);
}

.dim {
  color: var(--color-text-dim);
  font-style: italic;
}

.stat-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: var(--color-bg-elevated);
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  border: 2rpx solid rgba(255, 107, 157, 0.08);
  position: relative;
  overflow: hidden;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.reward-preview {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.1) 0%, rgba(255, 218, 118, 0.15) 100%);
  border: 3rpx solid var(--color-gold);
  padding: 24rpx;
  border-radius: 20rpx;
  margin-top: 20rpx;
  box-shadow: 0 8rpx 24rpx var(--color-gold-glow);
  position: relative;
  overflow: hidden;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 2rpx solid rgba(255, 182, 39, 0.2);
}

.breakdown-item:last-child {
  border-bottom: none;
  font-weight: 700;
  font-size: 1.3rem;
  padding-top: 16rpx;
  margin-top: 8rpx;
  border-top: 3rpx solid var(--color-gold);
}
</style>
