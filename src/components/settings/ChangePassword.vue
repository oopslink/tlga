<template>
  <view class="change-password">
    <text class="section-title">修改密码</text>

    <view class="password-form">
      <view class="form-group">
        <text class="form-label">当前密码</text>
        <input
          :value="oldPassword"
          @input="oldPassword = $event.detail.value"
          type="password"
          placeholder="请输入当前密码"
          class="form-input"
        />
      </view>

      <view class="form-group">
        <text class="form-label">新密码</text>
        <input
          :value="newPassword"
          @input="newPassword = $event.detail.value"
          type="password"
          placeholder="请输入新密码（至少4位）"
          class="form-input"
        />
      </view>

      <view class="form-group">
        <text class="form-label">确认新密码</text>
        <input
          :value="confirmPassword"
          @input="confirmPassword = $event.detail.value"
          type="password"
          placeholder="请再次输入新密码"
          class="form-input"
        />
      </view>

      <view v-if="errorMessage" class="error-message">
        <text>{{ errorMessage }}</text>
      </view>

      <view v-if="successMessage" class="success-message">
        <text>{{ successMessage }}</text>
      </view>

      <button class="submit-btn" @click="handleSubmit">
        修改密码
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')

function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value.length < 4) {
    errorMessage.value = '新密码至少需要4位'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }

  if (oldPassword.value === newPassword.value) {
    errorMessage.value = '新密码不能与当前密码相同'
    return
  }

  const success = authStore.resetPassword(oldPassword.value, newPassword.value)

  if (success) {
    successMessage.value = '密码修改成功！'
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } else {
    errorMessage.value = '当前密码错误，请重试'
    oldPassword.value = ''
  }
}
</script>

<style scoped>
.change-password {
  background: var(--color-bg-card);
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: var(--shadow-sm);
}

.section-title {
  display: block;
  margin-bottom: 40rpx;
  color: var(--color-primary);
  font-size: 36rpx;
  font-weight: 600;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  padding: 20rpx 28rpx;
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 16rpx;
  font-size: 28rpx;
  background: var(--color-bg-elevated);
  color: var(--color-text);
}

.error-message {
  background: rgba(239, 71, 111, 0.1);
  color: var(--color-danger);
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.success-message {
  background: rgba(6, 214, 160, 0.1);
  color: var(--color-success);
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.submit-btn {
  padding: 24rpx;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  margin-top: 16rpx;
}
</style>
