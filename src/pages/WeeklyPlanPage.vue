<template>
  <div class="container">
    <h1>📅 本周计划</h1>
    <p class="week-info">{{ weeklyStore.currentWeekId }}</p>

    <div v-if="weeklyStore.loading" class="loading">加载中...</div>
    <div v-else-if="weeklyStore.error" class="error">{{ weeklyStore.error }}</div>

    <div v-else-if="weeklyStore.currentPlan">
      <!-- Week Summary -->
      <div class="card" v-if="weeklyStore.weekSummary">
        <h2>本周总结</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <span>完成天数</span>
            <span class="stat-value">{{ weeklyStore.weekSummary.completedDays }}/7</span>
          </div>
          <div class="stat-box">
            <span>总金币</span>
            <span class="stat-value gold">{{ weeklyStore.weekSummary.totalGold }}</span>
          </div>
          <div class="stat-box">
            <span>总经验</span>
            <span class="stat-value xp">{{ weeklyStore.weekSummary.totalXp }}</span>
          </div>
        </div>
      </div>

      <!-- Daily Goals -->
      <div v-for="day in weeklyStore.currentPlan.dailyGoals" :key="day.date" class="day-card">
        <div class="day-header" @click="toggleDay(day.date)">
          <div>
            <h3>{{ formatDate(day.date) }}</h3>
            <span class="status-badge" :class="day.status">{{ getStatusText(day.status) }}</span>
          </div>
          <div class="day-summary">
            <span>{{ getCompletedCount(day) }}/{{ day.tasks.length }} 任务</span>
            <span v-if="getDayReward(day)" class="gold">+{{ getDayReward(day)!.totalGold }}💰</span>
          </div>
        </div>

        <div v-if="expandedDays.has(day.date)" class="day-content">
          <!-- Existing Tasks -->
          <div v-if="day.tasks.length > 0" class="tasks-list">
            <div v-for="(task, index) in day.tasks" :key="index" class="task-item">
              <input type="checkbox" class="checkbox" v-model="task.completed"
                     @change="handleTaskToggle(day.date, index, task)">
              <span class="task-icon">{{ getCatIcon(task.taskId) }}</span>
              <div class="task-info">
                <strong>{{ getTaskName(task.taskId) }}</strong>
                <select v-if="hasVariants(task.taskId)" class="select-small"
                        v-model="task.achievedVariant" @change="handleVariantChange(day.date, index, task)">
                  <option :value="undefined">选择完成程度</option>
                  <option v-for="v in getVariants(task.taskId)" :key="v.level" :value="v.level">
                    {{ v.level }} (+{{ v.gold }}💰)
                  </option>
                </select>
                <span v-if="task.completed" class="reward-badge">
                  +{{ getTaskRewardValue(task.taskId, task.achievedVariant).gold }}💰
                </span>
              </div>
              <button class="btn-icon btn-icon-danger btn-icon-sm"
                      @click="weeklyStore.removeTask(day.date, index)"
                      title="删除任务">
                🗑️
              </button>
            </div>
          </div>

          <!-- Add Task -->
          <div class="add-task-section">
            <select class="select" v-model="newTask[day.date]">
              <option value="">选择要添加的任务...</option>
              <optgroup v-for="category in categories" :key="category" :label="getCategoryName(category)">
                <option v-for="task in getTasksByCategory(category)" :key="task.id" :value="task.id">
                  {{ task.name }} (+{{ task.gold }}💰)
                </option>
              </optgroup>
            </select>
            <button class="button" @click="handleAddTask(day.date)" :disabled="!newTask[day.date]">
              + 添加任务
            </button>
          </div>

          <!-- Day Reward Preview -->
          <div v-if="getDayReward(day)" class="reward-preview">
            <h4>当日奖励</h4>
            <div v-for="t in getDayReward(day)!.tasks" :key="t.taskId" class="reward-item">
              <span>{{ getTaskName(t.taskId) }} {{ t.variant ? `(${t.variant})` : '' }}</span>
              <span class="gold">+{{ t.gold }}💰</span>
            </div>
            <div class="reward-total">
              <span>总计</span>
              <span class="gold">{{ getDayReward(day)!.totalGold }}💰</span>
            </div>
          </div>
        </div>
      </div>

      <button class="button" @click="handleSave" style="width: 100%; margin-top: 24px; font-size: 18px;">
        💾 保存计划
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useWeeklyPlanStore } from '@/stores/weekly-plan.store'
import { TASK_DEFINITIONS, getTasksByCategory, getTaskById, getTaskReward, CATEGORY_NAMES, CATEGORY_ICONS, type TaskCategory } from '@/types/tasks'
import type { PlannedTask } from '@/types/tasks'
import { formatDateCN } from '@/utils/date'
import { useModal } from '@/composables/useModal'

const { showAlert } = useModal()

const weeklyStore = useWeeklyPlanStore()
const expandedDays = ref(new Set<string>())
const newTask = reactive<Record<string, string>>({})

const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

onMounted(async () => {
  await weeklyStore.loadCurrentWeek()
})

function toggleDay(date: string) {
  if (expandedDays.value.has(date)) {
    expandedDays.value.delete(date)
  } else {
    expandedDays.value.add(date)
  }
}

function formatDate(date: string) {
  return formatDateCN(date)
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '未开始',
    'in-progress': '进行中',
    completed: '已完成',
  }
  return map[status] || status
}

function getCompletedCount(day: any) {
  return day.tasks.filter((t: any) => t.completed).length
}

function getDayReward(day: any) {
  return weeklyStore.getDayReward(day.date)
}

function getTaskName(taskId: string) {
  return getTaskById(taskId)?.name || taskId
}

function getCategoryName(category: TaskCategory) {
  return CATEGORY_NAMES[category]
}

function hasVariants(taskId: string) {
  const task = getTaskById(taskId)
  return task?.variants && task.variants.length > 0
}

function getVariants(taskId: string) {
  return getTaskById(taskId)?.variants || []
}

function getTaskRewardValue(taskId: string, variant?: string) {
  return getTaskReward(taskId, variant)
}

function getCatIcon(taskId: string) {
  const task = getTaskById(taskId)
  return task ? CATEGORY_ICONS[task.category] : ''
}

function handleAddTask(date: string) {
  const taskId = newTask[date]
  if (!taskId) return

  weeklyStore.addTask(date, taskId)
  newTask[date] = ''
}

function handleTaskToggle(date: string, index: number, task: PlannedTask) {
  weeklyStore.updateTask(date, index, task.completed, task.achievedVariant, task.note)
}

function handleVariantChange(date: string, index: number, task: PlannedTask) {
  weeklyStore.updateTask(date, index, task.completed, task.achievedVariant, task.note)
}

async function handleSave() {
  try {
    await weeklyStore.save()
    await showAlert('保存成功!')
  } catch (e) {
    await showAlert('保存失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}
</script>

<style scoped>
.week-info {
  color: var(--color-text-dim);
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.day-card {
  background: var(--color-bg-light);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.day-header {
  padding: 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.day-header:hover {
  background: var(--color-bg-lighter);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 12px;
}

.status-badge.pending {
  background: rgba(160, 160, 160, 0.2);
  color: var(--color-text-dim);
}

.status-badge.in-progress {
  background: rgba(245, 158, 11, 0.2);
  color: var(--color-warning);
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.day-summary {
  display: flex;
  gap: 16px;
  align-items: center;
}

.day-content {
  padding: 0 16px 16px 16px;
  border-top: 1px solid var(--color-bg-lighter);
}

.tasks-list {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: var(--color-bg-elevated);
  transform: translateX(4px);
}

.task-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.task-info strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-small {
  padding: 4px 10px;
  font-size: 0.85rem;
  width: auto;
  margin: 0;
  border-radius: 6px;
}

.reward-badge {
  background: rgba(255, 215, 0, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-gold);
  white-space: nowrap;
}

.add-task-section {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.add-task-section .select {
  flex: 1;
  margin: 0;
}

.add-task-section .button {
  padding: 10px 20px;
  font-size: 0.9rem;
  white-space: nowrap;
}

.reward-preview {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid var(--color-gold);
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
}

.reward-preview h4 {
  margin-bottom: 8px;
  color: var(--color-gold);
  font-size: 1rem;
}

.reward-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

.reward-total {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 0 0;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 6px;
  border-top: 2px solid var(--color-gold);
}
</style>
