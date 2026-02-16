<template>
  <div class="change-password">
    <h3>🔐 修改密码</h3>

    <form @submit.prevent="handleSubmit" class="password-form">
      <div class="form-group">
        <label for="oldPassword">当前密码</label>
        <input
          id="oldPassword"
          v-model="oldPassword"
          type="password"
          placeholder="请输入当前密码"
          required
        />
      </div>

      <div class="form-group">
        <label for="newPassword">新密码</label>
        <input
          id="newPassword"
          v-model="newPassword"
          type="password"
          placeholder="请输入新密码（至少4位）"
          required
          minlength="4"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">确认新密码</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          required
          minlength="4"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <button type="submit" class="submit-btn">
        修改密码
      </button>
    </form>
  </div>
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

    // 3秒后清除成功消息
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

h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
}

.form-group input:focus {
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  animation: shake 0.3s;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  animation: fadeIn 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.submit-btn {
  padding: 12px;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 157, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .change-password {
    padding: 20px;
  }

  .password-form {
    max-width: 100%;
  }
}
</style>
