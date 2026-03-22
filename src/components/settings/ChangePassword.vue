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
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: block;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.form-input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.submit-btn {
  padding: 12px;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}
</style>
