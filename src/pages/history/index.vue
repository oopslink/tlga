<template>
  <view class="container">
    <!-- 返回按钮 -->
    <view class="back-button-row">
      <view class="btn-back" @click="goBack">
        <text>← 返回列表</text>
      </view>
    </view>

    <text class="page-title">📚 历史记录详情</text>

    <!-- 周选择器 -->
    <view class="week-selector">
      <view class="btn-week-nav" @click="gotoPrevWeek">
        <text>← 上一周</text>
      </view>
      <view class="week-info">
        <text class="week-title">{{ formatWeekCN(selectedWeekId) }}</text>
        <text class="week-range">{{ getWeekRangeCN(selectedWeekId) }}</text>
      </view>
      <view class="btn-week-nav" :class="{ disabled: isCurrentWeek }" @click="gotoNextWeek">
        <text>下一周 →</text>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 周总结 -->
      <view class="card week-summary" v-if="weekSummary">
        <text class="summary-title">本周总结</text>
        <view class="summary-grid">
          <view class="summary-item">
            <text class="summary-icon">✅</text>
            <text class="summary-label">完成天数</text>
            <text class="summary-value">{{ weekSummary.completedDays }}/7</text>
          </view>
          <view class="summary-item">
            <text class="summary-icon">💰</text>
            <text class="summary-label">总金币</text>
            <text class="summary-value gold">{{ weekSummary.totalGold }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-icon">✨</text>
            <text class="summary-label">总经验</text>
            <text class="summary-value xp">{{ weekSummary.totalXp }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-icon">📋</text>
            <text class="summary-label">完成任务</text>
            <text class="summary-value">{{ weekSummary.totalTasks }}</text>
          </view>
        </view>
      </view>

      <!-- 每日记录 -->
      <view v-for="date in weekDates" :key="date" class="day-history-card">
        <view class="day-history-header" @click="toggleDay(date)">
          <view class="day-info">
            <text class="day-title">{{ formatDateCN(date) }}</text>
            <text v-if="date === today()" class="today-badge">今日</text>
          </view>
          <view class="day-summary">
            <text v-if="dailySheets[date]" class="status-badge" :class="dailySheets[date].status">
              {{ getStatusText(dailySheets[date].status) }}
            </text>
            <text v-if="dailySheets[date]?.settled" class="reward-badge">
              +{{ dailySheets[date].totalGold }}💰
            </text>
            <text class="expand-icon" :class="{ expanded: expandedDays.has(date) }">▼</text>
          </view>
        </view>

        <!-- 展开内容 -->
        <view v-if="expandedDays.has(date)" class="day-history-content">
          <!-- 计划任务 -->
          <view v-if="dailyPlans[date]" class="section">
            <text class="section-h4">📅 计划任务 ({{ dailyPlans[date].tasks.length }}项)</text>
            <view class="task-list">
              <view v-for="(task, idx) in dailyPlans[date].tasks" :key="idx" class="task-item-simple">
                <text class="task-icon">{{ getCatIcon(task.taskId) }}</text>
                <view class="task-item-content">
                  <text class="task-name">{{ getTaskName(task.taskId) }}</text>
                  <text v-if="task.targetVariant" class="variant-tag target">{{ task.targetVariant }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 实际完成 -->
          <view v-if="dailySheets[date]" class="section">
            <text class="section-h4">✅ 实际完成</text>
            <view class="task-list">
              <view v-for="(task, idx) in dailySheets[date].tasks" :key="idx" class="task-item-detail">
                <view class="task-main">
                  <text class="task-icon">{{ getCatIcon(task.taskId) }}</text>
                  <text class="task-name">{{ getTaskName(task.taskId) }}</text>
                  <text v-if="task.completed" class="completed-badge">✓ 完成</text>
                  <text v-else class="incomplete-badge">未完成</text>
                  <text v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</text>
                </view>
                <view v-if="task.completed && dailySheets[date].settled" class="task-reward">
                  <text class="gold">+{{ task.finalGold }}💰</text>
                  <text v-if="task.finalXp" class="xp">+{{ task.finalXp }}✨</text>
                </view>
                <view v-if="task.kidComment" class="task-comment">
                  <text>💬 {{ task.kidComment }}</text>
                </view>
                <view v-if="task.approverComment" class="approver-comment">
                  <text>🔍 审批意见：{{ task.approverComment }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 审批结果 -->
          <view v-if="dailySheets[date]?.status === 'approved'" class="section approval-section">
            <text class="section-h4">🎉 审批结果</text>
            <view class="approval-result">
              <view class="approval-rewards">
                <view class="reward-item">
                  <text class="reward-label">获得金币</text>
                  <text class="reward-value gold">+{{ dailySheets[date].totalGold }} 💰</text>
                </view>
                <view class="reward-item">
                  <text class="reward-label">获得经验</text>
                  <text class="reward-value xp">+{{ dailySheets[date].totalXp }} ✨</text>
                </view>
              </view>
              <view v-if="dailySheets[date].reviewComment" class="review-comment">
                <text class="review-label">审批评语：</text>
                <text>{{ dailySheets[date].reviewComment }}</text>
              </view>
            </view>
          </view>

          <!-- 未开始/待填写 -->
          <view v-else-if="!dailySheets[date] || dailySheets[date].status === 'pending'" class="section empty-section">
            <text class="dim">该日尚未填写进度</text>
          </view>

          <!-- 已提交待审 -->
          <view v-else-if="dailySheets[date].status === 'submitted'" class="section pending-section">
            <text class="dim">已提交，等待审批中...</text>
          </view>
        </view>
      </view>

      <!-- 无数据提示 -->
      <view v-if="!weekSummary" class="card empty-state">
        <text class="dim">该周暂无记录</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { usePlanStore } from '@/stores/plan.store'
import { useProgressStore } from '@/stores/progress.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById } from '@/utils/tasks'
import { CATEGORY_ICONS, type DailyProgressSheet, type DailyPlan } from '@/types/tasks'
import {
  currentWeek,
  today,
  getWeekDates,
  formatDateCN,
  formatWeekCN,
  getWeekRangeCN,
  getPreviousWeek,
  getNextWeek,
} from '@/utils/date'

const planStore = usePlanStore()
const progressStore = useProgressStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const selectedWeekId = ref(currentWeek())
const weekDates = computed(() => getWeekDates(selectedWeekId.value))
const loading = ref(false)
const expandedDays = ref(new Set<string>())

const isCurrentWeek = computed(() => selectedWeekId.value === currentWeek())

const dailyPlans = ref<Record<string, DailyPlan>>({})
const dailySheets = ref<Record<string, DailyProgressSheet>>({})

const weekSummary = computed(() => {
  const sheets = Object.values(dailySheets.value).filter(s => s.settled)
  if (sheets.length === 0) return null

  const completedDays = sheets.length
  const totalGold = sheets.reduce((sum, s) => sum + s.totalGold, 0)
  const totalXp = sheets.reduce((sum, s) => sum + s.totalXp, 0)
  const totalTasks = sheets.reduce((sum, s) => sum + s.tasks.filter(t => t.completed).length, 0)

  return { completedDays, totalGold, totalXp, totalTasks }
})

function gotoPrevWeek() {
  selectedWeekId.value = getPreviousWeek(selectedWeekId.value)
}

function gotoNextWeek() {
  if (!isCurrentWeek.value) {
    selectedWeekId.value = getNextWeek(selectedWeekId.value)
  }
}

function toggleDay(date: string) {
  if (expandedDays.value.has(date)) {
    expandedDays.value.delete(date)
  } else {
    expandedDays.value.add(date)
  }
}

function getTaskName(taskId: string) {
  return getTaskById(taskId)?.name || taskId
}

function getCatIcon(taskId: string) {
  const task = getTaskById(taskId)
  return task ? CATEGORY_ICONS[task.category] : ''
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待填写',
    submitted: '已提交',
    approved: '已审批',
    rejected: '已驳回',
  }
  return map[status] || status
}

async function loadWeekData() {
  loading.value = true
  try {
    await planStore.loadWeek(selectedWeekId.value)

    const planMap: Record<string, DailyPlan> = {}
    if (planStore.plan?.dailyPlans) {
      for (const dp of planStore.plan.dailyPlans) {
        planMap[dp.date] = dp
      }
    }
    dailyPlans.value = planMap

    await progressStore.loadWeekSheets(selectedWeekId.value, weekDates.value)

    const sheetMap: Record<string, DailyProgressSheet> = {}
    for (const sheet of progressStore.weekSheets) {
      sheetMap[sheet.date] = sheet
    }
    dailySheets.value = sheetMap
  } finally {
    loading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}

watch(selectedWeekId, () => {
  loadWeekData()
  expandedDays.value.clear()
})

onLoad((options) => {
  taskDefinitionsStore.load()
  const weekId = options?.weekId || ''
  if (weekId) {
    selectedWeekId.value = weekId
  }
  loadWeekData()
})
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.back-button-row {
  margin-bottom: 20px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 28rpx;
  font-weight: 600;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 20px;
}

.week-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 32px;
  padding: 20px;
  background: var(--color-bg-card);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  border: 2px solid rgba(255, 107, 157, 0.08);
}

.btn-week-nav {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 26rpx;
  font-weight: 700;
}

.btn-week-nav.disabled {
  opacity: 0.4;
}

.week-info {
  text-align: center;
  flex: 1;
}

.week-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.week-range {
  display: block;
  font-size: 26rpx;
  color: var(--color-text-dim);
}

.card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.summary-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 16px;
}

.summary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 2px solid rgba(255, 107, 157, 0.08);
  width: 45%;
}

.summary-icon {
  display: block;
  font-size: 40rpx;
  margin-bottom: 8px;
}

.summary-label {
  display: block;
  font-size: 26rpx;
  color: var(--color-text-dim);
  margin-bottom: 8px;
}

.summary-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.day-history-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
}

.day-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
}

.day-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day-title {
  font-weight: 700;
  font-size: 30rpx;
}

.today-badge {
  background: var(--gradient-gold);
  color: var(--color-text-inverse);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 24rpx;
  font-weight: 700;
}

.day-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  font-size: 24rpx;
  color: var(--color-text-dim);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.day-history-content {
  padding: 0 18px 18px;
  border-top: 2px solid rgba(255, 107, 157, 0.08);
}

.section {
  margin-top: 16px;
}

.section-h4 {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item-simple {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-radius: 10px;
  font-size: 28rpx;
}

.task-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-item-detail {
  padding: 12px;
  background: var(--color-bg-elevated);
  border-radius: 10px;
  border: 2px solid rgba(255, 107, 157, 0.05);
}

.task-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.task-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.task-name {
  font-weight: 600;
  flex: 1;
}

.completed-badge {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.2), rgba(6, 214, 160, 0.3));
  color: var(--color-success);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 26rpx;
  font-weight: 700;
}

.incomplete-badge {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 26rpx;
  font-weight: 600;
}

.task-reward {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  font-weight: 700;
  font-size: 30rpx;
}

.task-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(94, 174, 255, 0.1);
  border-left: 3px solid var(--color-xp);
  border-radius: 6px;
  font-size: 26rpx;
  font-style: italic;
}

.approver-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(255, 168, 0, 0.1);
  border-left: 3px solid var(--color-warning);
  border-radius: 6px;
  font-size: 26rpx;
}

.approval-section {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.05), rgba(6, 214, 160, 0.1));
  padding: 16px;
  border-radius: 12px;
  border: 2px solid var(--color-success);
}

.approval-result {
  margin-top: 10px;
}

.approval-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.reward-item {
  text-align: center;
  padding: 12px;
  background: var(--color-bg-card);
  border-radius: 10px;
  width: 45%;
}

.reward-label {
  display: block;
  font-size: 24rpx;
  color: var(--color-text-dim);
  margin-bottom: 6px;
}

.reward-value {
  font-size: 34rpx;
  font-weight: 700;
}

.review-comment {
  background: var(--color-bg-card);
  padding: 12px;
  border-radius: 10px;
}

.review-label {
  color: var(--color-success);
  font-weight: 700;
}

.empty-section,
.pending-section {
  padding: 40px 20px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 26rpx;
  font-weight: 700;
}

.status-badge.pending {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
}

.status-badge.submitted {
  background: linear-gradient(135deg, rgba(255, 168, 0, 0.2), rgba(255, 218, 118, 0.2));
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.status-badge.approved {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.2), rgba(6, 214, 160, 0.3));
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.status-badge.rejected {
  background: linear-gradient(135deg, rgba(239, 71, 111, 0.2), rgba(255, 107, 157, 0.2));
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.reward-badge {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.2), rgba(255, 218, 118, 0.3));
  color: var(--color-gold);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 26rpx;
  font-weight: 700;
  border: 1px solid var(--color-gold);
}

.variant-tag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 26rpx;
  font-weight: 600;
}

.variant-tag.target {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.15), rgba(255, 218, 118, 0.2));
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
}

.variant-tag.achieved {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.2));
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.dim {
  color: var(--color-text-dim);
  font-style: italic;
}

.gold {
  color: var(--color-gold);
}

.xp {
  color: var(--color-xp);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-dim);
}
</style>
