<template>
  <view class="login-container">
    <view class="login-card">
      <view class="login-header">
        <text class="login-title">🎓 小学霸冒险记</text>
        <text v-if="!authStore.hasPassword" class="subtitle">首次使用，请设置密码</text>
        <text v-else class="subtitle">请输入密码</text>
      </view>

      <view class="login-form">
        <view class="form-group">
          <text class="form-label">
            {{ authStore.hasPassword ? '密码' : '设置密码' }}
          </text>
          <input
            class="form-input"
            :value="password"
            @input="password = $event.detail.value"
            password
            :placeholder="authStore.hasPassword ? '请输入密码' : '请设置密码（至少4位）'"
          />
        </view>

        <view v-if="!authStore.hasPassword" class="form-group">
          <text class="form-label">确认密码</text>
          <input
            class="form-input"
            :value="confirmPassword"
            @input="confirmPassword = $event.detail.value"
            password
            placeholder="请再次输入密码"
          />
        </view>

        <view v-if="errorMessage" class="error-message">
          <text>{{ errorMessage }}</text>
        </view>

        <button class="submit-btn" @click="handleSubmit">
          {{ authStore.hasPassword ? '登录' : '设置密码并登录' }}
        </button>
      </view>

      <view class="login-footer">
        <text class="tip">💡 提示：密码保存在本地，请妥善保管</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')

function handleSubmit() {
  errorMessage.value = ''

  if (!authStore.hasPassword) {
    // 首次设置密码
    if (password.value.length < 4) {
      errorMessage.value = '密码至少需要4位'
      return
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = '两次输入的密码不一致'
      return
    }

    const success = authStore.setPassword(password.value)
    if (success) {
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      errorMessage.value = '设置密码失败，请重试'
    }
  } else {
    // 验证密码
    const isValid = authStore.verifyPassword(password.value)
    if (isValid) {
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      errorMessage.value = '密码错误，请重试'
      password.value = ''
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-bg);
  padding: 40rpx;
}

.login-card {
  background: var(--color-bg-card);
  border-radius: 40rpx;
  box-shadow: var(--shadow-xl);
  border: 2rpx solid rgba(255, 107, 157, 0.1);
  padding: 80rpx;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: var(--gradient-primary);
}

.login-header {
  text-align: center;
  margin-bottom: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  font-size: 56rpx;
  color: var(--color-primary);
  margin: 0 0 20rpx 0;
  font-weight: 700;
  display: block;
}

.subtitle {
  font-size: 32rpx;
  color: var(--color-text-dim);
  margin: 0;
  display: block;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
  display: block;
}

.form-input {
  padding: 24rpx 32rpx;
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 20rpx;
  font-size: 32rpx;
  color: var(--color-text);
  width: 100%;
  box-sizing: border-box;
}

.error-message {
  background: rgba(239, 71, 111, 0.08);
  color: var(--color-danger);
  border: 2rpx solid rgba(239, 71, 111, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  text-align: center;
}

.submit-btn {
  padding: 28rpx;
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
  margin-top: 20rpx;
  box-shadow: var(--shadow-md);
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.login-footer {
  margin-top: 60rpx;
  text-align: center;
}

.tip {
  font-size: 26rpx;
  color: var(--color-text-dim);
  display: block;
}
</style>
