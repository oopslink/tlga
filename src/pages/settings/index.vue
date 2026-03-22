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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskManagement from '@/components/settings/TaskManagement.vue'
import TemplateManagement from '@/components/settings/TemplateManagement.vue'
import WeeklyTemplateManagement from '@/components/settings/WeeklyTemplateManagement.vue'
import ChangePassword from '@/components/settings/ChangePassword.vue'

const currentTab = ref<'history' | 'tasks' | 'templates' | 'password'>('history')
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
</style>
