<template>
  <view class="container">
    <!-- 本周快速导航 -->
    <view class="week-quick-nav">
      <view
        v-for="date in weekDates"
        :key="date"
        class="day-nav-item"
        :class="{
          active: date === selectedDate,
          today: date === today(),
          completed: getSheetStatus(date) === 'approved',
          submitted: getSheetStatus(date) === 'submitted',
          pending: getSheetStatus(date) === 'pending'
        }"
        @click="goToDate(date)"
      >
        <view class="day-label">{{ getDayLabel(date) }}</view>
        <view class="day-date">{{ getMonthDay(date) }}</view>
        <view class="day-status-dot"></view>
      </view>
    </view>

    <!-- 传统左右箭头导航 -->
    <view class="date-nav-arrows">
      <button class="btn-nav" @click="prevDay" :disabled="!canGoPrev">← 上一天</button>
      <text class="date-display">{{ formatDateCN(selectedDate) }}</text>
      <button class="btn-nav" @click="nextDay" :disabled="!canGoNext">下一天 →</button>
    </view>

    <view v-if="progressStore.loading" class="loading"><text>加载中...</text></view>

    <view v-else-if="!progressStore.currentSheet" class="card">
      <text class="dim">该日没有进度单（未在计划中或计划未激活）</text>
      <button class="button" style="margin-top:12px" @click="goToPlan">查看周计划</button>
    </view>

    <template v-else>
      <text class="dim" style="margin-bottom:16px">
        状态：<text class="status-badge" :class="sheet.status">{{ statusText }}</text>
      </text>

      <!-- 任务列表 -->
      <view v-for="(task, idx) in sheet.tasks" :key="idx" class="task-card">
        <view class="task-header">
          <text class="task-cat">{{ getCatIcon(task.taskId) }}</text>
          <view class="task-header-content">
            <text style="font-weight:bold">{{ getTaskName(task.taskId) }}</text>
            <text v-if="task.targetVariant" class="variant-tag target">目标: {{ task.targetVariant }}</text>
          </view>
        </view>
        <view v-if="task.note" class="task-note dim">{{ task.note }}</view>

        <view class="task-body" v-if="isEditable">
          <!-- 有完成程度的任务：picker 选择 -->
          <view v-if="hasVariants(task.taskId)" class="form-group">
            <text class="label">完成程度</text>
            <picker
              class="select"
              :value="getVariantIndex(task.taskId, task.achievedVariant)"
              :range="getVariantRange(task.taskId)"
              @change="onVariantChange(idx, $event.detail.value)"
            >
              <view class="picker-display">
                {{ task.achievedVariant ? task.achievedVariant + ' (+' + getVariantGold(task.taskId, task.achievedVariant) + ' 金币)' : '未完成' }}
              </view>
            </picker>
          </view>

          <!-- 无完成程度的任务：复选框 -->
          <view v-else class="form-row" @click="task.completed = !task.completed">
            <view class="checkbox-wrap">
              <view class="checkbox" :class="{ checked: task.completed }"></view>
            </view>
            <text>已完成</text>
          </view>

          <view class="form-group">
            <text class="label">备注</text>
            <input class="input" :value="task.kidComment" @input="task.kidComment = $event.detail.value" placeholder="写点什么..." />
          </view>
        </view>

        <!-- 只读模式（已提交/已审批） -->
        <view class="task-body" v-else>
          <view class="readonly-row">
            <text :class="task.completed ? 'completed-yes' : 'completed-no'">
              {{ task.completed ? '已完成' : '未完成' }}
            </text>
            <text v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</text>
          </view>
          <text v-if="task.kidComment" class="dim">{{ task.kidComment }}</text>
          <view v-if="task.approverComment" class="approver-note">
            <text>审批批注: {{ task.approverComment }}</text>
          </view>
          <view v-if="sheet.settled" class="reward-line">
            <text class="gold">+{{ task.finalGold }} 金币</text>
            <text v-if="task.finalXp" class="xp"> +{{ task.finalXp }} XP</text>
          </view>
        </view>
      </view>

      <!-- 锚点三：反思与创造 -->
      <view class="anchor-card">
        <view class="anchor-header">
          <text class="anchor-icon">🧠</text>
          <text class="anchor-title">锚点三：反思与创造</text>
          <text class="anchor-badge">可填1~3项 · 各自计金币</text>
        </view>

        <view v-if="isEditable">
          <!-- 发现时刻 -->
          <view class="reflection-item">
            <view class="reflection-item-header">
              <text>💡 发现时刻</text>
              <text class="rt-gold">+3 金</text>
            </view>
            <textarea class="input" :value="discoveryContent" @input="discoveryContent = $event.detail.value" placeholder="今天的数学/生活观察，写下你的发现..."></textarea>
          </view>

          <!-- 开放问题 -->
          <view class="reflection-item">
            <view class="reflection-item-header">
              <text>❓ 开放问题</text>
              <text class="rt-gold">+2 金</text>
            </view>
            <textarea class="input" :value="openQuestionContent" @input="openQuestionContent = $event.detail.value" placeholder="回答当天开放问题，2-3句话..."></textarea>
          </view>

          <!-- 方法日志 -->
          <view class="reflection-item">
            <view class="reflection-item-header">
              <text>📝 方法日志</text>
              <text class="rt-gold">+3 金</text>
            </view>
            <view class="method-log-form">
              <input class="input" :value="methodLogProblem" @input="methodLogProblem = $event.detail.value" placeholder="我遇到了什么问题..." />
              <input class="input" :value="methodLogMethod" @input="methodLogMethod = $event.detail.value" placeholder="我想到了什么方法..." />
              <input class="input" :value="methodLogPrinciple" @input="methodLogPrinciple = $event.detail.value" placeholder="我觉得这个方法的原理是..." />
            </view>
          </view>
        </view>

        <!-- 只读模式 -->
        <template v-else>
          <view v-if="(sheet.reflections ?? []).length > 0">
            <view v-for="r in sheet.reflections" :key="r.type" class="reflection-readonly">
              <view class="reflection-type-tag">
                <text>{{ getReflectionIcon(r.type) }}</text>
                <text>{{ getReflectionLabel(r.type) }}</text>
                <text class="gold">+{{ r.goldEarned }} 金</text>
              </view>
              <view v-if="r.methodLog" class="method-log-readonly">
                <text>问题：{{ r.methodLog.problem }}</text>
                <text>方法：{{ r.methodLog.method }}</text>
                <text>原理：{{ r.methodLog.principle }}</text>
              </view>
              <text v-else>{{ r.content }}</text>
            </view>
            <view v-if="sheet.allAnchorsCompleted" class="anchors-bonus-tag">
              <text>🏆 三锚点全完成！+{{ sheet.allAnchorsBonusGold }} 金 +{{ sheet.allAnchorsBonusXp }} XP</text>
            </view>
          </view>
          <text v-else class="dim" style="padding:12px 0">未填写反思内容</text>
        </template>
      </view>

      <!-- 周日本周回顾 -->
      <view v-if="isSunday" class="anchor-card weekly-review-card">
        <view class="anchor-header">
          <text class="anchor-icon">📖</text>
          <text class="anchor-title">本周回顾</text>
          <text class="anchor-badge">周日限定 · +5 金</text>
        </view>

        <view v-if="isEditable">
          <view class="form-group">
            <text class="label">本周最骄傲的事是什么？</text>
            <textarea class="input" :value="reviewProudest" @input="reviewProudest = $event.detail.value" placeholder="写下让你最自豪的事..."></textarea>
          </view>
          <view class="form-group">
            <text class="label">本周有什么新发现？</text>
            <textarea class="input" :value="reviewDiscovery" @input="reviewDiscovery = $event.detail.value" placeholder="写下你的新发现..."></textarea>
          </view>
          <view class="form-group">
            <text class="label">下周想挑战什么？</text>
            <textarea class="input" :value="reviewNextWeek" @input="reviewNextWeek = $event.detail.value" placeholder="设定下周的小目标..."></textarea>
          </view>
        </view>

        <!-- 只读模式 -->
        <view v-else-if="sheet.weeklyReview?.completed" class="reflection-readonly">
          <text>最骄傲：{{ sheet.weeklyReview.answers.proudest }}</text>
          <text>新发现：{{ sheet.weeklyReview.answers.discovery }}</text>
          <text>下周目标：{{ sheet.weeklyReview.answers.nextWeek }}</text>
          <text class="gold">+{{ sheet.weeklyReview.goldEarned }} 金</text>
        </view>
        <text v-else class="dim" style="padding:12px 0">未填写本周回顾</text>
      </view>

      <!-- 结算预览 -->
      <view v-if="sheet.settled" class="reward-preview">
        <text class="reward-title">结算结果</text>
        <view class="breakdown-item">
          <text>总金币</text>
          <text class="gold">{{ sheet.totalGold }}</text>
        </view>
        <view class="breakdown-item">
          <text>总经验</text>
          <text class="xp">{{ sheet.totalXp }}</text>
        </view>
      </view>

      <!-- 审批评语 -->
      <view v-if="sheet.reviewComment" class="card" style="margin-top:16px">
        <text class="card-title">审批评语</text>
        <text>{{ sheet.reviewComment }}</text>
      </view>

      <!-- 操作按钮 -->
      <view class="actions-bar">
        <template v-if="sheet.status !== 'approved'">
          <button class="button" @click="handleSave">💾 暂存</button>
          <button class="button btn-submit" @click="handleSubmit"
                  :disabled="sheet.tasks.every(t => !t.completed)">
            📤 {{ sheet.status === 'submitted' ? '重新提交' : '提交审批' }}
          </button>
          <text v-if="sheet.status === 'rejected'" class="dim">进度单已驳回，请修改后重新提交</text>
        </template>
        <template v-else>
          <text class="dim">已审批通过</text>
        </template>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProgressStore } from '@/stores/progress.store'
import { usePlanStore } from '@/stores/plan.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById } from '@/utils/tasks'
import { CATEGORY_ICONS, type TaskVariant, type ReflectionType } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import {
  REFLECTION_TYPE_LABELS,
  REFLECTION_TYPE_ICONS,
  calcReflectionGold,
} from '@/engine/reflection-anchor'

const { showAlert, showConfirm } = useModal()

const progressStore = useProgressStore()
const planStore = usePlanStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = ref(today())

// ==================== 反思与创造 ====================

const discoveryContent = ref('')
const openQuestionContent = ref('')
const methodLogProblem = ref('')
const methodLogMethod = ref('')
const methodLogPrinciple = ref('')

function getReflectionIcon(type: ReflectionType) { return REFLECTION_TYPE_ICONS[type] }
function getReflectionLabel(type: ReflectionType) { return REFLECTION_TYPE_LABELS[type] }

function isSundayDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.getDay() === 0
}

const isSunday = computed(() => isSundayDate(selectedDate.value))

// ==================== 周日回顾 ====================

const reviewProudest = ref('')
const reviewDiscovery = ref('')
const reviewNextWeek = ref('')

function initReflectionFromSheet() {
  const s = progressStore.currentSheet
  if (!s) return
  discoveryContent.value = s.reflections?.find(r => r.type === 'discovery')?.content ?? ''
  openQuestionContent.value = s.reflections?.find(r => r.type === 'open-question')?.content ?? ''
  const ml = s.reflections?.find(r => r.type === 'method-log')
  methodLogProblem.value = ml?.methodLog?.problem ?? ''
  methodLogMethod.value = ml?.methodLog?.method ?? ''
  methodLogPrinciple.value = ml?.methodLog?.principle ?? ''
  if (s.weeklyReview) {
    reviewProudest.value = s.weeklyReview.answers.proudest
    reviewDiscovery.value = s.weeklyReview.answers.discovery
    reviewNextWeek.value = s.weeklyReview.answers.nextWeek
  } else {
    reviewProudest.value = ''
    reviewDiscovery.value = ''
    reviewNextWeek.value = ''
  }
}

function buildReflectionsData(): NonNullable<import('@/types/tasks').DailyProgressSheet['reflections']> {
  const result: NonNullable<import('@/types/tasks').DailyProgressSheet['reflections']> = []
  if (discoveryContent.value.trim()) {
    result.push({ type: 'discovery', content: discoveryContent.value, goldEarned: calcReflectionGold('discovery') })
  }
  if (openQuestionContent.value.trim()) {
    result.push({ type: 'open-question', content: openQuestionContent.value, goldEarned: calcReflectionGold('open-question') })
  }
  const hasMethodLog = methodLogProblem.value.trim() || methodLogMethod.value.trim() || methodLogPrinciple.value.trim()
  if (hasMethodLog) {
    const log = { problem: methodLogProblem.value, method: methodLogMethod.value, principle: methodLogPrinciple.value }
    const content = `问题：${log.problem} / 方法：${log.method} / 原理：${log.principle}`
    result.push({ type: 'method-log', content, methodLog: log, goldEarned: calcReflectionGold('method-log') })
  }
  return result
}

function buildWeeklyReviewData() {
  if (!isSunday.value) return undefined
  const hasContent = reviewProudest.value.trim() || reviewDiscovery.value.trim() || reviewNextWeek.value.trim()
  if (!hasContent) return undefined
  return {
    completed: true,
    answers: {
      proudest: reviewProudest.value,
      discovery: reviewDiscovery.value,
      nextWeek: reviewNextWeek.value,
    },
    goldEarned: 5,
  }
}

// 用于存储所有进度单状态
const sheetsMap = computed(() => {
  const map: Record<string, string> = {}
  for (const s of progressStore.weekSheets) {
    map[s.date] = s.status
  }
  return map
})

const sheet = computed(() => progressStore.currentSheet)
const isEditable = computed(() => sheet.value?.status !== 'approved')

const statusText = computed(() => {
  const m: Record<string, string> = { pending: '待填写', submitted: '已提交', approved: '已审批', rejected: '已驳回' }
  return m[sheet.value?.status ?? ''] ?? ''
})

const canGoPrev = computed(() => {
  const idx = weekDates.indexOf(selectedDate.value)
  return idx > 0
})

const canGoNext = computed(() => {
  const idx = weekDates.indexOf(selectedDate.value)
  return idx >= 0 && idx < weekDates.length - 1
})

function prevDay() {
  const idx = weekDates.indexOf(selectedDate.value)
  if (idx > 0) selectedDate.value = weekDates[idx - 1]
}

function nextDay() {
  const idx = weekDates.indexOf(selectedDate.value)
  if (idx >= 0 && idx < weekDates.length - 1) selectedDate.value = weekDates[idx + 1]
}

function goToDate(date: string) {
  selectedDate.value = date
}

function goToPlan() {
  uni.switchTab({ url: '/pages/plan/index' })
}

function getDayLabel(date: string) {
  const d = new Date(date + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[d.getDay()]
}

function getMonthDay(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getSheetStatus(date: string): string {
  return sheetsMap.value[date] || 'pending'
}

function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '' }
function hasVariants(id: string) { const t = getTaskById(id); return !!(t?.variants && t.variants.length > 0) }
function getVariants(id: string): TaskVariant[] { return getTaskById(id)?.variants ?? [] }

function getVariantRange(taskId: string): string[] {
  const variants = getVariants(taskId)
  return ['未完成', ...variants.map(v => `${v.level} (+${v.gold} 金币)`)]
}

function getVariantIndex(taskId: string, achievedVariant?: string): number {
  if (!achievedVariant) return 0
  const variants = getVariants(taskId)
  const idx = variants.findIndex(v => v.level === achievedVariant)
  return idx >= 0 ? idx + 1 : 0
}

function getVariantGold(taskId: string, level: string): number {
  const v = getVariants(taskId).find(x => x.level === level)
  return v?.gold ?? 0
}

function onVariantChange(taskIdx: number, pickerIndex: number) {
  if (!sheet.value) return
  const task = sheet.value.tasks[taskIdx]
  if (!task) return
  const variants = getVariants(task.taskId)
  if (pickerIndex === 0) {
    task.achievedVariant = undefined
    task.completed = false
  } else {
    const variant = variants[pickerIndex - 1]
    if (variant) {
      task.achievedVariant = variant.level
      task.completed = true
    }
  }
}

async function loadData() {
  await planStore.loadWeek(weekId)
  await progressStore.loadWeekSheets(weekId, weekDates)
  await progressStore.loadSheet(weekId, selectedDate.value)
  initReflectionFromSheet()
}

async function handleSave() {
  if (!sheet.value) return
  progressStore.updateReflections(buildReflectionsData())
  progressStore.updateWeeklyReview(buildWeeklyReviewData())
  await progressStore.saveSheet(sheet.value)
  await showAlert('已暂存')
}

async function handleSubmit() {
  if (!await showConfirm('确认提交？提交后需要审批员审批。')) return
  progressStore.updateReflections(buildReflectionsData())
  progressStore.updateWeeklyReview(buildWeeklyReviewData())
  await progressStore.submitSheet()
  await showAlert('已提交，等待审批')
}

watch(selectedDate, () => { loadData() })

onLoad((options?: Record<string, string>) => {
  if (options?.date) selectedDate.value = options.date
  taskDefinitionsStore.load()
  loadData()
})
</script>

<style scoped>
/* 本周快速导航 */
.week-quick-nav {
  display: flex;
  gap: 8rpx;
  margin-bottom: 32rpx;
}

.day-nav-item {
  flex: 1;
  background: var(--color-bg-card);
  border: 2rpx solid rgba(255, 107, 157, 0.1);
  border-radius: 16rpx;
  padding: 16rpx 8rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.day-nav-item.active {
  background: var(--gradient-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.day-nav-item.today {
  border-color: var(--color-gold);
  border-width: 3rpx;
}

.day-label {
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
  opacity: 0.8;
}

.day-date {
  font-size: 22rpx;
  font-weight: 500;
  opacity: 0.7;
}

.day-status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin: 8rpx auto 0;
  background: var(--color-text-dim);
  opacity: 0.3;
}

.day-nav-item.completed .day-status-dot {
  background: var(--color-success);
  opacity: 1;
}

.day-nav-item.submitted .day-status-dot {
  background: var(--color-warning);
  opacity: 1;
}

.day-nav-item.active .day-status-dot {
  background: var(--color-text-inverse);
  opacity: 1;
}

/* 传统箭头导航 */
.date-nav-arrows {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  justify-content: center;
}

.date-display {
  font-size: 32rpx;
  font-weight: 700;
  min-width: 200rpx;
  text-align: center;
  color: var(--color-primary);
}

.btn-nav {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 12rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.btn-nav[disabled] {
  opacity: 0.3;
}

/* 任务卡片 */
.task-card {
  background: var(--color-bg-card);
  border: 2rpx solid rgba(255, 107, 157, 0.08);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 10rpx;
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.task-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}

.task-cat {
  font-size: 36rpx;
  flex-shrink: 0;
}

.task-note {
  font-size: 24rpx;
  margin-bottom: 8rpx;
  font-style: italic;
  color: var(--color-text-dim);
}

.task-body {
  border-top: 2rpx solid rgba(255, 107, 157, 0.1);
  padding-top: 12rpx;
  margin-top: 8rpx;
}

.variant-tag {
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
}

.variant-tag.target {
  background: rgba(255, 182, 39, 0.15);
  color: var(--color-gold);
  border: 1rpx solid var(--color-gold);
}

.variant-tag.achieved {
  background: rgba(6, 214, 160, 0.15);
  color: var(--color-success);
  border: 1rpx solid var(--color-success);
}

.form-group {
  margin-bottom: 12rpx;
}

.picker-display {
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 8rpx;
  padding: 8rpx 14rpx;
  font-size: 28rpx;
  color: var(--color-text);
}

.checkbox-wrap {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid var(--color-primary);
  border-radius: 6rpx;
  margin-right: 12rpx;
}

.checkbox.checked {
  background: var(--color-primary);
}

.readonly-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.completed-yes {
  color: var(--color-success);
  font-weight: 700;
}

.completed-no {
  color: var(--color-text-dim);
  font-weight: 600;
}

.approver-note {
  background: rgba(255, 168, 0, 0.1);
  border-left: 6rpx solid var(--color-warning);
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  margin-top: 8rpx;
}

.reward-line {
  margin-top: 12rpx;
  font-weight: 700;
  font-size: 32rpx;
}

.actions-bar {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  flex-wrap: wrap;
  align-items: center;
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-success) 0%, #06d6a0 100%) !important;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.status-badge.pending {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
}

.status-badge.submitted {
  background: rgba(255, 168, 0, 0.2);
  color: var(--color-warning);
  border: 1rpx solid var(--color-warning);
}

.status-badge.approved {
  background: rgba(6, 214, 160, 0.2);
  color: var(--color-success);
  border: 1rpx solid var(--color-success);
}

.status-badge.rejected {
  background: rgba(239, 71, 111, 0.2);
  color: var(--color-danger);
  border: 1rpx solid var(--color-danger);
}

.dim {
  color: var(--color-text-dim);
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  padding: 12rpx;
  background: var(--color-bg-elevated);
  border-radius: 12rpx;
}

/* 锚点卡片 */
.anchor-card {
  background: var(--color-bg-card);
  border: 2rpx solid rgba(94, 174, 255, 0.2);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.weekly-review-card {
  border-color: rgba(255, 182, 39, 0.3);
}

.anchor-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.anchor-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
}

.anchor-icon {
  font-size: 40rpx;
}

.anchor-badge {
  background: rgba(94, 174, 255, 0.15);
  color: var(--color-xp);
  border: 1rpx solid var(--color-xp);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.reflection-item {
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(94, 174, 255, 0.12);
  border-radius: 12rpx;
  padding: 14rpx;
  margin-bottom: 12rpx;
}

.reflection-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
  font-weight: 700;
  font-size: 28rpx;
}

.rt-gold {
  font-size: 24rpx;
  color: var(--color-gold);
  font-weight: 700;
}

.method-log-form {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.reflection-readonly {
  padding: 12rpx;
  background: var(--color-bg-elevated);
  border-radius: 10rpx;
}

.reflection-type-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
  font-weight: 700;
}

.method-log-readonly {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: 26rpx;
}

.anchors-bonus-tag {
  margin-top: 12rpx;
  padding: 8rpx 14rpx;
  background: rgba(255, 182, 39, 0.15);
  border: 1rpx solid var(--color-gold);
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-gold);
}

.reward-preview {
  background: var(--color-bg-card);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 16rpx;
}

.reward-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 12rpx;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 8rpx;
}
</style>
