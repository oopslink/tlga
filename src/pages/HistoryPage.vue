<template>
  <div class="container">
    <!-- 返回按钮 -->
    <div class="back-button-row">
      <button class="btn-back" @click="goBack">
        ← 返回列表
      </button>
    </div>

    <h1>📚 历史记录详情</h1>

    <!-- 周选择器 -->
    <div class="week-selector">
      <button class="btn-week-nav" @click="gotoPrevWeek">
        ← 上一周
      </button>
      <div class="week-info">
        <div class="week-title">{{ formatWeekCN(selectedWeekId) }}</div>
        <div class="week-range">{{ getWeekRangeCN(selectedWeekId) }}</div>
      </div>
      <button class="btn-week-nav" @click="gotoNextWeek" :disabled="isCurrentWeek">
        下一周 →
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <!-- 周总结 -->
      <div class="card week-summary" v-if="weekSummary">
        <h2>本周总结</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-icon">✅</div>
            <div class="summary-label">完成天数</div>
            <div class="summary-value">{{ weekSummary.completedDays }}/7</div>
          </div>
          <div class="summary-item">
            <div class="summary-icon">💰</div>
            <div class="summary-label">总金币</div>
            <div class="summary-value gold">{{ weekSummary.totalGold }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-icon">✨</div>
            <div class="summary-label">总经验</div>
            <div class="summary-value xp">{{ weekSummary.totalXp }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-icon">📋</div>
            <div class="summary-label">完成任务</div>
            <div class="summary-value">{{ weekSummary.totalTasks }}</div>
          </div>
        </div>
      </div>

      <!-- 每日记录 -->
      <div v-for="date in weekDates" :key="date" class="day-history-card">
        <div class="day-history-header" @click="toggleDay(date)">
          <div class="day-info">
            <h3>{{ formatDateCN(date) }}</h3>
            <span v-if="date === today()" class="today-badge">今日</span>
          </div>
          <div class="day-summary">
            <span v-if="dailySheets[date]" class="status-badge" :class="dailySheets[date].status">
              {{ getStatusText(dailySheets[date].status) }}
            </span>
            <span v-if="dailySheets[date]?.settled" class="reward-badge">
              +{{ dailySheets[date].totalGold }}💰
            </span>
            <span class="expand-icon" :class="{ expanded: expandedDays.has(date) }">▼</span>
          </div>
        </div>

        <!-- 展开内容 -->
        <div v-if="expandedDays.has(date)" class="day-history-content">
          <!-- 计划任务 -->
          <div v-if="dailyPlans[date]" class="section">
            <h4>📅 计划任务 ({{ dailyPlans[date].tasks.length }}项)</h4>
            <div class="task-list">
              <div v-for="(task, idx) in dailyPlans[date].tasks" :key="idx" class="task-item-simple">
                <span class="task-icon">{{ getCatIcon(task.taskId) }}</span>
                <div class="task-item-content">
                  <span class="task-name">{{ getTaskName(task.taskId) }}</span>
                  <span v-if="task.targetVariant" class="variant-tag target">{{ task.targetVariant }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 实际完成 -->
          <div v-if="dailySheets[date]" class="section">
            <h4>✅ 实际完成</h4>
            <div class="task-list">
              <div v-for="(task, idx) in dailySheets[date].tasks" :key="idx" class="task-item-detail">
                <div class="task-main">
                  <span class="task-icon">{{ getCatIcon(task.taskId) }}</span>
                  <span class="task-name">{{ getTaskName(task.taskId) }}</span>
                  <span v-if="task.completed" class="completed-badge">✓ 完成</span>
                  <span v-else class="incomplete-badge">未完成</span>
                  <span v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</span>
                </div>
                <div v-if="task.completed && dailySheets[date].settled" class="task-reward">
                  <span class="gold">+{{ task.finalGold }}💰</span>
                  <span v-if="task.finalXp" class="xp">+{{ task.finalXp }}✨</span>
                </div>
                <div v-if="task.kidComment" class="task-comment">
                  💬 {{ task.kidComment }}
                </div>
                <div v-if="task.approverComment" class="approver-comment">
                  🔍 审批意见：{{ task.approverComment }}
                </div>
              </div>
            </div>
          </div>

          <!-- 审批结果 -->
          <div v-if="dailySheets[date]?.status === 'approved'" class="section approval-section">
            <h4>🎉 审批结果</h4>
            <div class="approval-result">
              <div class="approval-rewards">
                <div class="reward-item">
                  <span class="reward-label">获得金币</span>
                  <span class="reward-value gold">+{{ dailySheets[date].totalGold }} 💰</span>
                </div>
                <div class="reward-item">
                  <span class="reward-label">获得经验</span>
                  <span class="reward-value xp">+{{ dailySheets[date].totalXp }} ✨</span>
                </div>
              </div>
              <div v-if="dailySheets[date].reviewComment" class="review-comment">
                <strong>审批评语：</strong>
                <p>{{ dailySheets[date].reviewComment }}</p>
              </div>
            </div>
          </div>

          <!-- 未开始/待填写 -->
          <div v-else-if="!dailySheets[date] || dailySheets[date].status === 'pending'" class="section empty-section">
            <p class="dim">该日尚未填写进度</p>
          </div>

          <!-- 已提交待审 -->
          <div v-else-if="dailySheets[date].status === 'submitted'" class="section pending-section">
            <p class="dim">已提交，等待审批中...</p>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-if="!weekSummary" class="card empty-state">
        <p class="dim">该周暂无记录</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()
const progressStore = useProgressStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const selectedWeekId = ref(currentWeek())
const weekDates = computed(() => getWeekDates(selectedWeekId.value))
const loading = ref(false)
const expandedDays = ref(new Set<string>())

const isCurrentWeek = computed(() => selectedWeekId.value === currentWeek())

// 每日计划 map
const dailyPlans = ref<Record<string, DailyPlan>>({})

// 每日进度单 map
const dailySheets = ref<Record<string, DailyProgressSheet>>({})

// 周总结
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
    // 加载周计划
    await planStore.loadWeek(selectedWeekId.value)

    // 构建每日计划 map
    const planMap: Record<string, DailyPlan> = {}
    if (planStore.plan?.dailyPlans) {
      for (const dp of planStore.plan.dailyPlans) {
        planMap[dp.date] = dp
      }
    }
    dailyPlans.value = planMap

    // 加载所有进度单
    await progressStore.loadWeekSheets(selectedWeekId.value, weekDates.value)

    // 构建进度单 map
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
  router.push('/history')
}

watch(selectedWeekId, () => {
  loadWeekData()
  expandedDays.value.clear()
})

onMounted(() => {
  taskDefinitionsStore.load()
  // 从路由参数读取周ID
  const weekId = route.params.weekId as string
  if (weekId) {
    selectedWeekId.value = weekId
  }
  loadWeekData()
})
</script>

<style scoped>
/* 返回按钮 */
.back-button-row {
  margin-bottom: 20px;
}

.btn-back {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-back:hover {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  transform: translateX(-4px);
  box-shadow: var(--shadow-sm);
}

/* 周选择器 */
.week-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
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
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.btn-week-nav:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 157, 0.4);
}

.btn-week-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.week-info {
  text-align: center;
  flex: 1;
}

.week-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.week-range {
  font-size: 0.95rem;
  color: var(--color-text-dim);
}

/* 周总结 */
.week-summary {
  animation: slideUp 0.6s ease-out;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.summary-item {
  text-align: center;
  padding: 20px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 2px solid rgba(255, 107, 157, 0.08);
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-sm);
}

.summary-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  margin-bottom: 8px;
}

.summary-value {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text);
}

/* 每日历史卡片 */
.day-history-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.day-history-card:nth-child(1) { animation-delay: 0.05s; }
.day-history-card:nth-child(2) { animation-delay: 0.1s; }
.day-history-card:nth-child(3) { animation-delay: 0.15s; }

.day-history-card:hover {
  box-shadow: var(--shadow-md);
}

.day-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.day-history-header:hover {
  background: var(--color-bg-elevated);
}

.day-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day-info h3 {
  font-family: 'Fredoka', sans-serif;
  margin: 0;
}

.today-badge {
  background: var(--gradient-gold);
  color: var(--color-text-inverse);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.day-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
  color: var(--color-text-dim);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.day-history-content {
  padding: 0 18px 18px;
  border-top: 2px solid rgba(255, 107, 157, 0.08);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

/* 内容区块 */
.section {
  margin-top: 16px;
}

.section h4 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: 10px;
}

/* 任务列表 */
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
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.task-item-simple:hover {
  background: rgba(255, 107, 157, 0.05);
  transform: translateX(4px);
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
}

.task-icon {
  font-size: 1.2rem;
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
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.incomplete-badge {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.task-reward {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
}

.task-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(94, 174, 255, 0.1);
  border-left: 3px solid var(--color-xp);
  border-radius: 6px;
  font-size: 0.85rem;
  font-style: italic;
}

.approver-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(255, 168, 0, 0.1);
  border-left: 3px solid var(--color-warning);
  border-radius: 6px;
  font-size: 0.85rem;
}

/* 审批结果 */
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.reward-item {
  text-align: center;
  padding: 12px;
  background: var(--color-bg-card);
  border-radius: 10px;
}

.reward-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: 6px;
}

.reward-value {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
}

.review-comment {
  background: var(--color-bg-card);
  padding: 12px;
  border-radius: 10px;
}

.review-comment strong {
  color: var(--color-success);
}

.review-comment p {
  margin-top: 8px;
  line-height: 1.6;
}

/* 空状态 */
.empty-section,
.pending-section {
  padding: 40px 20px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
}

/* 状态徽章 */
.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
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
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  border: 1px solid var(--color-gold);
}

.variant-tag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
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

/* 响应式 */
@media (max-width: 768px) {
  .week-selector {
    flex-direction: column;
    gap: 16px;
  }

  .btn-week-nav {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
