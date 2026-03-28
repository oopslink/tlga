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
          submitted: getSheetStatus(date) === 'submitted',
          approved: getSheetStatus(date) === 'approved',
          rejected: getSheetStatus(date) === 'rejected',
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
      <text class="dim">该日没有进度单</text>
    </view>

    <template v-else>
      <view class="status-row">
        <text class="dim">状态：</text>
        <text class="status-badge" :class="sheet.status">{{ statusText }}</text>
        <text v-if="sheet.submittedAt" class="dim"> · 提交于 {{ formatTime(sheet.submittedAt) }}</text>
      </view>

      <view v-if="sheet.status === 'pending'" class="card">
        <text class="dim">进度单尚未提交，等待小学霸填写</text>
      </view>

      <template v-else>
        <!-- 任务审批列表 -->
        <view v-for="(task, idx) in sheet.tasks" :key="idx" class="task-card" :class="`cat-${getTaskCategory(task.taskId)}`">
          <view class="task-header">
            <view class="task-cat-wrap" :class="`cat-icon-${getTaskCategory(task.taskId)}`">
              <text class="task-cat">{{ getCatIcon(task.taskId) }}</text>
            </view>
            <view class="task-header-content">
              <text class="task-name-text">{{ getTaskName(task.taskId) }}</text>
            </view>
          </view>

          <!-- 小学霸填写的内容 -->
          <view class="kid-section">
            <view class="kid-row">
              <text :class="task.completed ? 'completed-yes' : 'completed-no'">
                {{ task.completed ? '小学霸标记: 已完成' : '小学霸标记: 未完成' }}
              </text>
              <text v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</text>
            </view>
            <text v-if="task.kidComment" class="kid-comment">💬 {{ task.kidComment }}</text>
          </view>

          <!-- 审批操作 -->
          <view class="approve-section" v-if="isReviewable && overrides[idx]">
            <view class="form-row">
              <text class="label-inline">确认结果:</text>
              <picker
                :value="getOverridePickerIndex(idx, task.taskId)"
                :range="getOverridePickerRange(task.taskId)"
                @change="onResultChange(idx, task.taskId, $event.detail.value)"
              >
                <view class="picker-display">{{ overrides[idx].result === '__uncompleted' ? '未完成' : (overrides[idx].result === '__completed' ? '已完成' : overrides[idx].result) }}</view>
              </picker>
            </view>

            <view class="reward-edit-row">
              <view class="reward-edit-item">
                <text class="label-sm gold">金币</text>
                <input type="number" class="input-sm" :value="String(overrides[idx].gold)" @input="overrides[idx].gold = Number($event.detail.value)" />
              </view>
              <view class="reward-edit-item">
                <text class="label-sm xp">XP</text>
                <input type="number" class="input-sm" :value="String(overrides[idx].xp)" @input="overrides[idx].xp = Number($event.detail.value)" />
              </view>
            </view>
            <view v-if="getEffectiveMultiplier(task.taskId, overrides[idx].result) > 1" class="multiplier-badge">
              <text>×{{ getEffectiveMultiplier(task.taskId, overrides[idx].result) }} 加成</text>
            </view>

            <input class="input" :value="overrides[idx].comment" @input="overrides[idx].comment = $event.detail.value" placeholder="对此任务的批注（可选）" />
          </view>

          <!-- 已审批结果 -->
          <view class="result-section" v-if="sheet.settled">
            <view class="result-row">
              <text v-if="task.approverOverrideCompleted !== undefined" class="override-tag">
                {{ task.approverOverrideCompleted ? (task.approverOverrideVariant || '已完成') : '未完成' }}
              </text>
              <text v-if="task.approverComment" class="dim">批注: {{ task.approverComment }}</text>
            </view>
            <view class="reward-line">
              <text class="gold">+{{ task.finalGold }} 金币</text>
              <text v-if="task.finalXp" class="xp"> +{{ task.finalXp }} XP</text>
            </view>
          </view>
        </view>

        <!-- 反思与创造（只读展示） -->
        <view v-if="(sheet.reflections ?? []).length > 0 || sheet.weeklyReview" class="reflection-section">
          <text class="section-title">🧠 锚点三：反思与创造</text>
          <template v-if="(sheet.reflections ?? []).length > 0">
            <view v-for="r in sheet.reflections" :key="r.type" class="reflection-block">
              <view class="reflection-type-row">
                <text class="reflection-icon">{{ getReflectionIcon(r.type) }}</text>
                <text class="reflection-label">{{ getReflectionLabel(r.type) }}</text>
                <text class="gold">+{{ r.goldEarned }} 金</text>
              </view>
              <view v-if="r.methodLog" class="method-log-view">
                <text>问题：{{ r.methodLog.problem }}</text>
                <text>方法：{{ r.methodLog.method }}</text>
                <text>原理：{{ r.methodLog.principle }}</text>
              </view>
              <text v-else class="reflection-content">{{ r.content }}</text>
            </view>
          </template>
          <text v-else class="dim">未填写反思内容</text>

          <view v-if="sheet.weeklyReview?.completed" class="weekly-review-block">
            <text class="weekly-review-title">📖 本周回顾 </text><text class="gold">+{{ sheet.weeklyReview.goldEarned }} 金</text>
            <text>最骄傲：{{ sheet.weeklyReview.answers.proudest }}</text>
            <text>新发现：{{ sheet.weeklyReview.answers.discovery }}</text>
            <text>下周目标：{{ sheet.weeklyReview.answers.nextWeek }}</text>
          </view>

          <view v-if="sheet.allAnchorsCompleted" class="all-anchors-badge">
            <text>🏆 三锚点全完成！+{{ sheet.allAnchorsBonusGold ?? 2 }} 金 +{{ sheet.allAnchorsBonusXp ?? 10 }} XP</text>
          </view>
        </view>

        <!-- 额外加成 -->
        <view v-if="isReviewable" class="card bonus-card">
          <text class="card-title">额外加成</text>
          <view class="bonus-row">
            <view class="bonus-item">
              <text class="label">倍率</text>
              <view class="bonus-input-wrap">
                <text class="bonus-prefix">×</text>
                <input type="number" class="input-sm" :value="String(bonus.multiplier)" @input="bonus.multiplier = Number($event.detail.value)" />
              </view>
            </view>
            <view class="bonus-item">
              <text class="label gold">额外金币</text>
              <input type="number" class="input-sm" :value="String(bonus.gold)" @input="bonus.gold = Number($event.detail.value)" />
            </view>
            <view class="bonus-item">
              <text class="label xp">额外 XP</text>
              <input type="number" class="input-sm" :value="String(bonus.xp)" @input="bonus.xp = Number($event.detail.value)" />
            </view>
          </view>
        </view>

        <!-- 结算预览 -->
        <view class="reward-preview">
          <text class="preview-title">{{ sheet.settled ? '结算结果' : '结算预览' }}</text>
          <template v-if="isReviewable">
            <view class="breakdown-item">
              <text>任务小计</text>
              <text><text class="gold">{{ previewTaskGold }}</text> 金币 / <text class="xp">{{ previewTaskXp }}</text> XP</text>
            </view>
            <template v-for="(task, idx) in sheet.tasks" :key="'task-'+idx">
              <view class="breakdown-item task-detail"
                   v-if="overrides[idx] && overrides[idx].result !== '__uncompleted'">
                <text>{{ getTaskName(task.taskId) }}
                  <text v-if="getEffectiveMultiplier(task.taskId, overrides[idx].result) > 1" class="multiplier-inline">
                    ×{{ getEffectiveMultiplier(task.taskId, overrides[idx].result) }}
                  </text>
                </text>
                <text><text class="gold">{{ overrides[idx].gold }}</text> 金币</text>
              </view>
            </template>
            <view v-if="bonus.multiplier !== 1" class="breakdown-item">
              <text>倍率 ×{{ bonus.multiplier }}</text>
              <text><text class="gold">{{ previewAfterMultGold }}</text> 金币 / <text class="xp">{{ previewAfterMultXp }}</text> XP</text>
            </view>
            <view v-if="bonus.gold || bonus.xp" class="breakdown-item">
              <text>额外加成</text>
              <text><text class="gold">+{{ bonus.gold }}</text> 金币 / <text class="xp">+{{ bonus.xp }}</text> XP</text>
            </view>
            <view class="breakdown-item total">
              <text>总计</text>
              <text><text class="gold">{{ previewTotalGold }}</text> 金币 / <text class="xp">{{ previewTotalXp }}</text> XP</text>
            </view>
          </template>
          <template v-else>
            <view v-if="sheet.bonusMultiplier && sheet.bonusMultiplier !== 1" class="breakdown-item">
              <text>倍率</text>
              <text>×{{ sheet.bonusMultiplier }}</text>
            </view>
            <view v-if="sheet.bonusGold || sheet.bonusXp" class="breakdown-item">
              <text>额外加成</text>
              <text><text class="gold">+{{ sheet.bonusGold ?? 0 }}</text> 金币 / <text class="xp">+{{ sheet.bonusXp ?? 0 }}</text> XP</text>
            </view>
            <view class="breakdown-item total">
              <text>总计</text>
              <text><text class="gold">{{ sheet.totalGold }}</text> 金币 / <text class="xp">{{ sheet.totalXp }}</text> XP</text>
            </view>
          </template>
        </view>

        <!-- 整体评语 -->
        <view v-if="isReviewable" class="card">
          <text class="card-title">整体评语</text>
          <textarea class="input" :value="reviewComment" @input="reviewComment = $event.detail.value" placeholder="写一句鼓励的话..."></textarea>
        </view>

        <!-- 已审批评语 -->
        <view v-if="sheet.reviewComment && !isReviewable" class="card" style="margin-top:16rpx">
          <text class="card-title">审批评语</text>
          <text>{{ sheet.reviewComment }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="actions-bar">
          <template v-if="isReviewable">
            <button class="button btn-approve" @click="handleApprove" :disabled="saving">
              {{ sheet.status === 'approved' ? '✅ 重新审批并结算' : '✅ 通过并结算' }}
            </button>
            <button class="button btn-reject" @click="handleReject" :disabled="saving">❌ 驳回</button>
            <text v-if="sheet.status === 'approved'" class="dim" style="width: 100%;">
              💡 提示：此进度单已审批，可以调整奖励后重新结算
            </text>
          </template>
          <template v-else-if="sheet.status === 'rejected'">
            <text class="dim">已驳回，等待小学霸修改重新提交</text>
          </template>
        </view>
      </template>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProgressStore } from '@/stores/progress.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById, getTaskReward } from '@/utils/tasks'
import { CATEGORY_ICONS, type TaskVariant, type ReflectionType } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import { REFLECTION_TYPE_LABELS, REFLECTION_TYPE_ICONS } from '@/engine/reflection-anchor'

const { showAlert, showConfirm } = useModal()
const saving = ref(false)

const progressStore = useProgressStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = ref(today())

const sheet = computed(() => progressStore.currentSheet)
// 允许已审批的进度单重新审批
const isReviewable = computed(() =>
  sheet.value?.status === 'submitted' || sheet.value?.status === 'approved'
)

// 用于存储所有进度单状态
const sheetsMap = computed(() => {
  const map: Record<string, string> = {}
  for (const s of progressStore.weekSheets) {
    map[s.date] = s.status
  }
  return map
})

const statusText = computed(() => {
  const m: Record<string, string> = { pending: '待填写', submitted: '待审批', approved: '已审批', rejected: '已驳回' }
  return m[sheet.value?.status ?? ''] ?? ''
})

const overrides = reactive<Array<{ result: string; gold: number; xp: number; comment: string }>>([])
const bonus = reactive({ multiplier: 1, gold: 0, xp: 0 })
const reviewComment = ref('')

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
function getTaskCategory(id: string): string { return getTaskById(id)?.category ?? '' }
function hasVariants(id: string) { const t = getTaskById(id); return !!(t?.variants && t.variants.length > 0) }
function getVariants(id: string): TaskVariant[] { return getTaskById(id)?.variants ?? [] }

/** 计算任务变体相对于基础奖励的有效倍率 */
function getEffectiveMultiplier(taskId: string, result: string): number {
  if (result === '__uncompleted' || result === '__completed') return 1
  const task = getTaskById(taskId)
  if (!task || !task.variants) return 1
  const variant = task.variants.find(v => v.level === result)
  if (!variant || task.gold === 0) return 1
  const multiplier = variant.gold / task.gold
  return Math.round(multiplier * 10) / 10
}

function getReflectionIcon(type: ReflectionType) { return REFLECTION_TYPE_ICONS[type] }
function getReflectionLabel(type: ReflectionType) { return REFLECTION_TYPE_LABELS[type] }

function isSundayDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.getDay() === 0
}

const isSunday = computed(() => isSundayDate(selectedDate.value))

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 根据确认结果计算默认奖励 */
function calcDefaultReward(taskId: string, result: string): { gold: number; xp: number } {
  if (result === '__uncompleted') return { gold: 0, xp: 0 }
  if (result === '__completed') return getTaskReward(taskId)
  return getTaskReward(taskId, result)
}

/** 从小学霸填写的数据推导初始确认结果 */
function inferResult(task: { taskId: string; completed: boolean; achievedVariant?: string }): string {
  if (!task.completed) return '__uncompleted'
  if (task.achievedVariant && hasVariants(task.taskId)) return task.achievedVariant
  if (hasVariants(task.taskId)) {
    const variants = getVariants(task.taskId)
    return variants.length > 0 ? variants[0].level : '__completed'
  }
  return '__completed'
}

function getOverridePickerRange(taskId: string): string[] {
  if (hasVariants(taskId)) {
    return ['未完成', ...getVariants(taskId).map(v => v.level)]
  }
  return ['未完成', '已完成']
}

function getOverridePickerIndex(idx: number, taskId: string): number {
  const result = overrides[idx]?.result
  if (!result || result === '__uncompleted') return 0
  if (result === '__completed') return 1
  const variants = getVariants(taskId)
  const vi = variants.findIndex(v => v.level === result)
  return vi >= 0 ? vi + 1 : 0
}

function initOverrides() {
  overrides.length = 0
  bonus.multiplier = sheet.value?.bonusMultiplier ?? 1
  bonus.gold = sheet.value?.bonusGold ?? 0
  bonus.xp = sheet.value?.bonusXp ?? 0
  reviewComment.value = sheet.value?.reviewComment ?? ''

  if (!sheet.value) return

  if (sheet.value.status === 'approved') {
    for (const task of sheet.value.tasks) {
      let result = '__uncompleted'
      if (task.approverOverrideCompleted !== undefined) {
        if (task.approverOverrideCompleted) {
          result = task.approverOverrideVariant || '__completed'
        }
      } else if (task.completed) {
        result = task.achievedVariant || '__completed'
      }

      overrides.push({
        result,
        gold: task.finalGold ?? 0,
        xp: task.finalXp ?? 0,
        comment: task.approverComment ?? '',
      })
    }
  } else {
    for (const task of sheet.value.tasks) {
      const result = inferResult(task)
      const reward = calcDefaultReward(task.taskId, result)
      overrides.push({ result, gold: reward.gold, xp: reward.xp, comment: '' })
    }
  }
}

/** 确认结果 picker 变化时，自动更新预计奖励 */
function onResultChange(idx: number, taskId: string, pickerIndex: number) {
  const range = getOverridePickerRange(taskId)
  const label = range[pickerIndex]
  let result: string
  if (pickerIndex === 0) {
    result = '__uncompleted'
  } else if (!hasVariants(taskId)) {
    result = '__completed'
  } else {
    const variants = getVariants(taskId)
    result = variants[pickerIndex - 1]?.level ?? '__completed'
  }
  overrides[idx].result = result
  const reward = calcDefaultReward(taskId, result)
  overrides[idx].gold = reward.gold
  overrides[idx].xp = reward.xp
}

// ==================== 结算预览 ====================

const previewTaskGold = computed(() => overrides.reduce((s, o) => s + o.gold, 0))
const previewTaskXp = computed(() => overrides.reduce((s, o) => s + o.xp, 0))

const previewAfterMultGold = computed(() => Math.floor(previewTaskGold.value * bonus.multiplier))
const previewAfterMultXp = computed(() => Math.floor(previewTaskXp.value * bonus.multiplier))

const previewTotalGold = computed(() => previewAfterMultGold.value + bonus.gold)
const previewTotalXp = computed(() => previewAfterMultXp.value + bonus.xp)

// ==================== 审批操作 ====================

function applyOverrides() {
  if (!sheet.value) return
  for (let i = 0; i < sheet.value.tasks.length; i++) {
    const o = overrides[i]
    if (!o) continue
    const task = sheet.value.tasks[i]

    if (o.result === '__uncompleted') {
      task.approverOverrideCompleted = false
      task.approverOverrideVariant = undefined
    } else if (o.result === '__completed') {
      task.approverOverrideCompleted = true
      task.approverOverrideVariant = undefined
    } else {
      task.approverOverrideCompleted = true
      task.approverOverrideVariant = o.result
    }

    task.finalGold = o.gold
    task.finalXp = o.xp
    task.approverComment = o.comment || undefined
  }

  sheet.value.bonusMultiplier = bonus.multiplier
  sheet.value.bonusGold = bonus.gold
  sheet.value.bonusXp = bonus.xp
}

async function handleApprove() {
  if (saving.value) return
  const isReApproval = sheet.value?.status === 'approved'
  const message = isReApproval
    ? '确认重新审批？将使用新的奖励重新结算积分。'
    : '确认审批通过？将自动结算积分。'

  if (!await showConfirm(message)) return
  saving.value = true
  try {
    applyOverrides()
    await progressStore.approveSheet(reviewComment.value || undefined)
    const successMsg = isReApproval
      ? '重新审批成功，积分已更新！'
      : '审批通过，积分已结算！'
    await showAlert(successMsg)
  } finally {
    saving.value = false
  }
}

async function handleReject() {
  if (saving.value) return
  if (!await showConfirm('确认驳回？小学霸需要修改后重新提交。')) return
  saving.value = true
  try {
    applyOverrides()
    await progressStore.rejectSheet(reviewComment.value || '请修改后重新提交')
    await showAlert('已驳回')
  } finally {
    saving.value = false
  }
}

async function loadData() {
  await progressStore.loadWeekSheets(weekId, weekDates)
  await progressStore.loadSheet(weekId, selectedDate.value)
  initOverrides()
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
  border-radius: 6rpx;
  padding: 8rpx 4rpx;
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

.day-nav-item.approved {
  border-color: var(--color-success);
}

.day-nav-item.rejected {
  border-color: var(--color-danger);
}

.day-label {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 2rpx;
}

.day-date {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.day-nav-item.active .day-label {
  color: rgba(255, 255, 255, 0.8);
}

.day-nav-item.active .day-date {
  color: var(--color-text-inverse);
}

.day-status-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  margin: 4rpx auto 0;
  background: rgba(136, 136, 136, 0.2);
}

.day-nav-item.submitted .day-status-dot {
  background: var(--color-warning);
  box-shadow: 0 0 6rpx rgba(255, 168, 0, 0.5);
}

.day-nav-item.approved .day-status-dot {
  background: var(--color-success);
  box-shadow: 0 0 6rpx rgba(6, 214, 160, 0.5);
}

.day-nav-item.rejected .day-status-dot {
  background: var(--color-danger);
  box-shadow: 0 0 6rpx rgba(239, 71, 111, 0.5);
}

.day-nav-item.active .day-status-dot {
  background: rgba(255, 255, 255, 0.9);
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

.status-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
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

/* 任务卡片 */
.task-card {
  background: var(--color-bg-card);
  border: 2rpx solid rgba(255, 107, 157, 0.08);
  border-left: 5rpx solid rgba(136, 136, 136, 0.2);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 10rpx;
}

/* Category accent borders */
.task-card.cat-academic { border-left-color: var(--color-cat-academic); background: linear-gradient(to right, rgba(94, 174, 255, 0.04), var(--color-bg-card)); }
.task-card.cat-sports   { border-left-color: var(--color-cat-sports);   background: linear-gradient(to right, rgba(6, 214, 160, 0.04), var(--color-bg-card)); }
.task-card.cat-language { border-left-color: var(--color-cat-language); background: linear-gradient(to right, rgba(255, 182, 39, 0.04), var(--color-bg-card)); }
.task-card.cat-art      { border-left-color: var(--color-cat-art);      background: linear-gradient(to right, rgba(199, 125, 255, 0.04), var(--color-bg-card)); }
.task-card.cat-behavior { border-left-color: var(--color-cat-behavior); background: linear-gradient(to right, rgba(255, 107, 157, 0.04), var(--color-bg-card)); }

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.task-header-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}

.task-name-text {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-cat-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: rgba(136, 136, 136, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-cat-wrap.cat-icon-academic { background: rgba(94, 174, 255, 0.15); }
.task-cat-wrap.cat-icon-sports   { background: rgba(6, 214, 160, 0.15); }
.task-cat-wrap.cat-icon-language { background: rgba(255, 182, 39, 0.15); }
.task-cat-wrap.cat-icon-art      { background: rgba(199, 125, 255, 0.15); }
.task-cat-wrap.cat-icon-behavior { background: rgba(255, 107, 157, 0.15); }

.task-cat {
  font-size: 36rpx;
  flex-shrink: 0;
}

.kid-section {
  background: var(--color-bg-elevated);
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
  margin-bottom: 10rpx;
}

.kid-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 4rpx;
}

.kid-comment {
  font-size: 26rpx;
  color: var(--color-text-dim);
}

.approve-section {
  border-top: 2rpx solid rgba(255, 107, 157, 0.1);
  padding-top: 10rpx;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.label-inline {
  font-size: 26rpx;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.picker-display {
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 8rpx;
  padding: 8rpx 14rpx;
  font-size: 28rpx;
  color: var(--color-text);
  flex: 1;
}

.reward-edit-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.reward-edit-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.label-sm {
  font-size: 24rpx;
  font-weight: 600;
}

.input-sm {
  width: 100rpx;
  height: 60rpx;
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 8rpx;
  padding: 0 10rpx;
  font-size: 26rpx;
  text-align: center;
}

.multiplier-badge {
  display: inline-block;
  background: rgba(255, 182, 39, 0.15);
  border: 1rpx solid var(--color-gold);
  border-radius: 8rpx;
  padding: 4rpx 10rpx;
  font-size: 24rpx;
  color: var(--color-gold);
  margin-bottom: 10rpx;
}

.result-section {
  border-top: 2rpx solid rgba(255, 107, 157, 0.1);
  padding-top: 10rpx;
  margin-top: 8rpx;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 4rpx;
  flex-wrap: wrap;
}

.override-tag {
  background: rgba(6, 214, 160, 0.15);
  color: var(--color-success);
  border: 1rpx solid var(--color-success);
  border-radius: 6rpx;
  padding: 3rpx 10rpx;
  font-size: 24rpx;
}

.reward-line {
  margin-top: 8rpx;
  font-weight: 700;
  font-size: 28rpx;
}

.variant-tag {
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.variant-tag.achieved {
  background: rgba(6, 214, 160, 0.15);
  color: var(--color-success);
  border: 1rpx solid var(--color-success);
}

/* 反思部分 */
.reflection-section {
  background: var(--color-bg-card);
  border: 2rpx solid rgba(94, 174, 255, 0.2);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 16rpx;
}

.reflection-block {
  background: var(--color-bg-elevated);
  border-radius: 10rpx;
  padding: 12rpx;
  margin-bottom: 10rpx;
}

.reflection-type-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
  font-weight: 700;
}

.reflection-icon {
  font-size: 28rpx;
}

.reflection-label {
  flex: 1;
  font-size: 28rpx;
}

.reflection-content {
  font-size: 26rpx;
}

.method-log-view {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: 26rpx;
}

.weekly-review-block {
  background: var(--color-bg-elevated);
  border-radius: 10rpx;
  padding: 12rpx;
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.weekly-review-title {
  font-size: 28rpx;
  font-weight: 700;
}

.all-anchors-badge {
  margin-top: 12rpx;
  padding: 8rpx 14rpx;
  background: rgba(255, 182, 39, 0.15);
  border: 1rpx solid var(--color-gold);
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-gold);
}

/* 额外加成 */
.bonus-card {
  margin-bottom: 16rpx;
}

.bonus-row {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.bonus-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.bonus-input-wrap {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.bonus-prefix {
  font-size: 28rpx;
  font-weight: 700;
}

/* 结算预览 */
.reward-preview {
  background: var(--color-bg-card);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
}

.preview-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 12rpx;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
}

.breakdown-item.total {
  border-top: 2rpx solid rgba(255, 107, 157, 0.15);
  margin-top: 8rpx;
  padding-top: 12rpx;
  font-weight: 700;
  font-size: 30rpx;
}

.task-detail {
  opacity: 0.85;
  font-size: 24rpx;
  padding-left: 16rpx;
}

.multiplier-inline {
  color: var(--color-gold);
  font-size: 22rpx;
}

/* 操作按钮 */
.actions-bar {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  flex-wrap: wrap;
  align-items: center;
}

.btn-approve {
  background: linear-gradient(135deg, var(--color-success) 0%, #06d6a0 100%) !important;
}

.btn-reject {
  background: linear-gradient(135deg, var(--color-danger) 0%, #ff6b9d 100%) !important;
}

.dim {
  color: var(--color-text-dim);
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 8rpx;
}
</style>
