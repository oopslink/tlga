<template>
  <view class="container">
    <!-- 标签导航 -->
    <view class="tabs">
      <view
        class="tab"
        :class="{ active: currentTab === 'history' }"
        @click="currentTab = 'history'"
      >
        <text>📚 历史记录</text>
      </view>
      <view
        class="tab"
        :class="{ active: currentTab === 'tasks' }"
        @click="currentTab = 'tasks'"
      >
        <text>⚙️ 任务管理</text>
      </view>
      <view
        class="tab"
        :class="{ active: currentTab === 'templates' }"
        @click="currentTab = 'templates'"
      >
        <text>📋 模版管理</text>
      </view>
      <view
        class="tab"
        :class="{ active: currentTab === 'password' }"
        @click="currentTab = 'password'"
      >
        <text>🔐 修改密码</text>
      </view>
    </view>

    <!-- 历史记录标签 -->
    <view v-if="currentTab === 'history'" class="tab-content">
      <view class="settings-section" @click="uni.navigateTo({ url: '/pages/history-list/index' })">
        <text class="section-title">历史记录</text>
        <text class="section-arrow">›</text>
      </view>
    </view>

    <!-- 任务管理标签 -->
    <view v-if="currentTab === 'tasks'" class="tab-content">
      <TaskManagement />
    </view>

    <!-- 模版管理标签 -->
    <view v-if="currentTab === 'templates'" class="tab-content">
      <WeeklyTemplateManagement />
      <view class="section-divider"></view>
      <TemplateManagement />
    </view>

    <!-- 修改密码标签 -->
    <view v-if="currentTab === 'password'" class="tab-content">
      <ChangePassword />
    </view>

    <!-- 底部操作区 -->
    <view class="bottom-actions">
      <view class="action-btn action-btn-danger" @click="handleClearData">
        <text>🗑️ 清除所有数据</text>
      </view>
      <view class="action-btn action-btn-logout" @click="handleLogout">
        <text>🚪 退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskManagement from '@/components/settings/TaskManagement.vue'
import TemplateManagement from '@/components/settings/TemplateManagement.vue'
import WeeklyTemplateManagement from '@/components/settings/WeeklyTemplateManagement.vue'
import ChangePassword from '@/components/settings/ChangePassword.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useModal } from '@/composables/useModal'

const authStore = useAuthStore()
const { showConfirm } = useModal()

const currentTab = ref<'history' | 'tasks' | 'templates' | 'password'>('history')

async function handleLogout() {
  if (await showConfirm('确认退出登录？')) {
    authStore.logout()
    uni.reLaunch({ url: '/pages/login/index' })
  }
}

async function handleClearData() {
  if (await showConfirm('确认清除所有数据？此操作不可恢复！')) {
    if (await showConfirm('再次确认：清除后所有记录将永久丢失，是否继续？')) {
      const keys = wx.getStorageInfoSync().keys
      for (const key of keys) {
        if (key.startsWith('tlgapp:')) {
          wx.removeStorageSync(key)
        }
      }
      authStore.clearAll()
      uni.reLaunch({ url: '/pages/login/index' })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
  flex-wrap: wrap;
}

.tab {
  padding: 12px 16px;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-dim);
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content {
  padding: 10px 0;
}

.settings-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 2px solid rgba(255, 107, 157, 0.08);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text);
}

.section-arrow {
  font-size: 36rpx;
  color: var(--color-text-dim);
}

.section-divider {
  border: none;
  border-top: 2px dashed rgba(255, 107, 157, 0.12);
  margin: 28px 0;
}

.bottom-actions {
  margin-top: 48rpx;
  padding-top: 32rpx;
  border-top: 2px solid rgba(255, 107, 157, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.action-btn-danger {
  background: rgba(239, 71, 111, 0.08);
  color: var(--color-danger);
  border: 2rpx solid rgba(239, 71, 111, 0.2);
}

.action-btn-danger:active {
  background: rgba(239, 71, 111, 0.15);
}

.action-btn-logout {
  background: rgba(136, 136, 136, 0.08);
  color: var(--color-text-dim);
  border: 2rpx solid rgba(136, 136, 136, 0.2);
}

.action-btn-logout:active {
  background: rgba(136, 136, 136, 0.15);
}
</style>
