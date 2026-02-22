<template>
  <div class="container">
    <!-- 标签导航 -->
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: currentTab === 'history' }"
        @click="currentTab = 'history'"
      >
        📚 历史记录
      </div>
      <div
        class="tab"
        :class="{ active: currentTab === 'tasks' }"
        @click="currentTab = 'tasks'"
      >
        ⚙️ 任务管理
      </div>
      <div
        class="tab"
        :class="{ active: currentTab === 'templates' }"
        @click="currentTab = 'templates'"
      >
        📋 模版管理
      </div>
      <div
        class="tab"
        :class="{ active: currentTab === 'password' }"
        @click="currentTab = 'password'"
      >
        🔐 修改密码
      </div>
    </div>

    <!-- 历史记录标签 -->
    <div v-if="currentTab === 'history'" class="tab-content">
      <router-view name="history" />
      <HistoryListView />
    </div>

    <!-- 任务管理标签 -->
    <div v-if="currentTab === 'tasks'" class="tab-content">
      <TaskManagement />
    </div>

    <!-- 模版管理标签 -->
    <div v-if="currentTab === 'templates'" class="tab-content">
      <TemplateManagement />
    </div>

    <!-- 修改密码标签 -->
    <div v-if="currentTab === 'password'" class="tab-content">
      <ChangePassword />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryListView from '@/components/settings/HistoryListView.vue'
import TaskManagement from '@/components/settings/TaskManagement.vue'
import TemplateManagement from '@/components/settings/TemplateManagement.vue'
import ChangePassword from '@/components/settings/ChangePassword.vue'

const currentTab = ref<'history' | 'tasks' | 'templates' | 'password'>('history')
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
}

.tab {
  padding: 12px 24px;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-dim);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  margin-bottom: -2px;
}

.tab:hover {
  color: var(--color-primary);
  background: rgba(255, 107, 157, 0.05);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
