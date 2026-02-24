<template>
  <div class="container">
    <!-- 本周快速导航 -->
    <div class="week-quick-nav">
      <div
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
        <div class="day-label">{{ getDayLabel(date) }}</div>
        <div class="day-date">{{ getMonthDay(date) }}</div>
        <div class="day-status-dot"></div>
      </div>
    </div>

    <!-- 传统左右箭头导航(保留) -->
    <div class="date-nav-arrows">
      <button class="btn-nav" @click="prevDay" :disabled="!canGoPrev">&larr; 上一天</button>
      <span class="date-display">{{ formatDateCN(selectedDate) }}</span>
      <button class="btn-nav" @click="nextDay" :disabled="!canGoNext">下一天 &rarr;</button>
    </div>

    <div v-if="progressStore.loading" class="loading">加载中...</div>

    <div v-else-if="!progressStore.currentSheet" class="card">
      <p class="dim">该日没有进度单（未在计划中或计划未激活）</p>
      <router-link to="/plan"><button class="button" style="margin-top:12px">查看周计划</button></router-link>
    </div>

    <template v-else>
      <p class="dim" style="margin-bottom:16px">
        状态：<span class="status-badge" :class="sheet.status">{{ statusText }}</span>
      </p>

      <!-- 任务列表 -->
      <div v-for="(task, idx) in sheet.tasks" :key="idx" class="task-card">
        <div class="task-header">
          <span class="task-cat">{{ getCatIcon(task.taskId) }}</span>
          <div class="task-header-content">
            <strong>{{ getTaskName(task.taskId) }}</strong>
            <span v-if="task.targetVariant" class="variant-tag target">目标: {{ task.targetVariant }}</span>
          </div>
        </div>
        <div v-if="task.note" class="task-note dim">{{ task.note }}</div>

        <div class="task-body" v-if="isEditable">
          <!-- 有完成程度的任务：下拉选择 -->
          <div v-if="hasVariants(task.taskId)" class="form-group">
            <label class="label">完成程度</label>
            <select class="select" :value="task.achievedVariant || ''" @change="onVariantChange(idx, ($event.target as HTMLSelectElement).value)">
              <option value="">未完成</option>
              <option v-for="v in getVariants(task.taskId)" :key="v.level" :value="v.level">
                {{ v.level }} (+{{ v.gold }} 金币)
              </option>
            </select>
          </div>

          <!-- 无完成程度的任务：复选框 -->
          <label v-else class="form-row">
            <input type="checkbox" class="checkbox" v-model="task.completed" />
            <span>已完成</span>
          </label>

          <div class="form-group">
            <label class="label">备注</label>
            <input class="input" v-model="task.kidComment" placeholder="写点什么..." />
          </div>
        </div>

        <!-- 只读模式（已提交/已审批） -->
        <div class="task-body" v-else>
          <div class="readonly-row">
            <span :class="task.completed ? 'completed-yes' : 'completed-no'">
              {{ task.completed ? '已完成' : '未完成' }}
            </span>
            <span v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</span>
          </div>
          <div v-if="task.kidComment" class="dim">{{ task.kidComment }}</div>
          <div v-if="task.approverComment" class="approver-note">审批批注: {{ task.approverComment }}</div>
          <div v-if="sheet.settled" class="reward-line">
            <span class="gold">+{{ task.finalGold }} 金币</span>
            <span v-if="task.finalXp" class="xp"> +{{ task.finalXp }} XP</span>
          </div>
        </div>
      </div>

      <!-- 锚点三：反思与创造 -->
      <div class="anchor-card">
        <div class="anchor-header">
          <span class="anchor-icon">🧠</span>
          <h3>锚点三：反思与创造</h3>
          <span class="anchor-badge">三选一 · 每日必做</span>
        </div>

        <div v-if="isEditable">
          <div class="reflection-types">
            <label
              v-for="rt in reflectionTypes"
              :key="rt.type"
              class="reflection-type-option"
              :class="{ selected: reflectionType === rt.type }"
            >
              <input type="radio" :value="rt.type" v-model="reflectionType" style="display:none" />
              <span class="rt-icon">{{ rt.icon }}</span>
              <span class="rt-name">{{ rt.label }}</span>
              <span class="rt-gold">+{{ rt.gold }} 金</span>
            </label>
          </div>

          <template v-if="reflectionType">
            <!-- 方法日志：三行结构化输入 -->
            <div v-if="reflectionType === 'method-log'" class="method-log-form">
              <div class="form-group">
                <label class="label">问题是什么？</label>
                <input class="input" v-model="methodLogProblem" placeholder="描述你遇到的问题..." />
              </div>
              <div class="form-group">
                <label class="label">用了什么方法？</label>
                <input class="input" v-model="methodLogMethod" placeholder="描述你的解题方法..." />
              </div>
              <div class="form-group">
                <label class="label">背后的原理是什么？</label>
                <input class="input" v-model="methodLogPrinciple" placeholder="总结核心原理..." />
              </div>
            </div>
            <!-- 其他类型：单个文本域 -->
            <div v-else class="form-group">
              <label class="label">{{ reflectionType === 'discovery' ? '我发现了什么？' : '我想到了什么问题？' }}</label>
              <textarea class="input" v-model="reflectionContent" rows="3" placeholder="写下你的想法..."></textarea>
            </div>
          </template>
        </div>

        <!-- 只读模式 -->
        <div v-else-if="sheet.reflection" class="reflection-readonly">
          <div class="reflection-type-tag">
            <span>{{ getReflectionIcon(sheet.reflection.type) }}</span>
            <span>{{ getReflectionLabel(sheet.reflection.type) }}</span>
            <span class="gold">+{{ sheet.reflection.goldEarned }} 金</span>
          </div>
          <div v-if="sheet.reflection.methodLog" class="method-log-readonly">
            <p><strong>问题：</strong>{{ sheet.reflection.methodLog.problem }}</p>
            <p><strong>方法：</strong>{{ sheet.reflection.methodLog.method }}</p>
            <p><strong>原理：</strong>{{ sheet.reflection.methodLog.principle }}</p>
          </div>
          <p v-else>{{ sheet.reflection.content }}</p>
          <div v-if="sheet.allAnchorsCompleted" class="anchors-bonus-tag">
            🏆 三锚点全完成！+{{ sheet.allAnchorsBonusGold }} 金 +{{ sheet.allAnchorsBonusXp }} XP
          </div>
        </div>
        <div v-else class="dim" style="padding:12px 0">未填写反思内容</div>
      </div>

      <!-- 周日本周回顾 -->
      <div v-if="isSunday" class="anchor-card weekly-review-card">
        <div class="anchor-header">
          <span class="anchor-icon">📖</span>
          <h3>本周回顾</h3>
          <span class="anchor-badge">周日限定 · +5 金</span>
        </div>

        <div v-if="isEditable">
          <div class="form-group">
            <label class="label">本周最骄傲的事是什么？</label>
            <textarea class="input" v-model="reviewProudest" rows="2" placeholder="写下让你最自豪的事..."></textarea>
          </div>
          <div class="form-group">
            <label class="label">本周有什么新发现？</label>
            <textarea class="input" v-model="reviewDiscovery" rows="2" placeholder="写下你的新发现..."></textarea>
          </div>
          <div class="form-group">
            <label class="label">下周想挑战什么？</label>
            <textarea class="input" v-model="reviewNextWeek" rows="2" placeholder="设定下周的小目标..."></textarea>
          </div>
        </div>

        <!-- 只读模式 -->
        <div v-else-if="sheet.weeklyReview?.completed" class="reflection-readonly">
          <p><strong>最骄傲：</strong>{{ sheet.weeklyReview.answers.proudest }}</p>
          <p><strong>新发现：</strong>{{ sheet.weeklyReview.answers.discovery }}</p>
          <p><strong>下周目标：</strong>{{ sheet.weeklyReview.answers.nextWeek }}</p>
          <span class="gold">+{{ sheet.weeklyReview.goldEarned }} 金</span>
        </div>
        <div v-else class="dim" style="padding:12px 0">未填写本周回顾</div>
      </div>

      <!-- 结算预览 -->
      <div v-if="sheet.settled" class="reward-preview">
        <h3>结算结果</h3>
        <div class="breakdown-item">
          <span>总金币</span>
          <span class="gold">{{ sheet.totalGold }}</span>
        </div>
        <div class="breakdown-item">
          <span>总经验</span>
          <span class="xp">{{ sheet.totalXp }}</span>
        </div>
      </div>

      <!-- 审批评语 -->
      <div v-if="sheet.reviewComment" class="card" style="margin-top:16px">
        <h3>审批评语</h3>
        <p>{{ sheet.reviewComment }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-bar">
        <template v-if="sheet.status !== 'approved'">
          <button class="button" @click="handleSave">💾 暂存</button>
          <button class="button btn-submit" @click="handleSubmit"
                  :disabled="sheet.tasks.every(t => !t.completed)">
            📤 {{ sheet.status === 'submitted' ? '重新提交' : '提交审批' }}
          </button>
          <p v-if="sheet.status === 'rejected'" class="dim">进度单已驳回，请修改后重新提交</p>
        </template>
        <template v-else>
          <p class="dim">已审批通过</p>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress.store'
import { usePlanStore } from '@/stores/plan.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById } from '@/utils/tasks'
import { CATEGORY_ICONS, type TaskVariant, type ReflectionType } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import {
  REFLECTION_GOLD,
  REFLECTION_TYPE_LABELS,
  REFLECTION_TYPE_ICONS,
  validateMethodLog,
  calcReflectionGold,
} from '@/engine/reflection-anchor'

const { showAlert, showConfirm } = useModal()

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const planStore = usePlanStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = computed(() => (route.params.date as string) || today())

// ==================== 反思与创造 ====================

const reflectionType = ref<ReflectionType | null>(null)
const reflectionContent = ref('')
const methodLogProblem = ref('')
const methodLogMethod = ref('')
const methodLogPrinciple = ref('')

const reflectionTypes = [
  { type: 'discovery' as ReflectionType, icon: '💡', label: '发现时刻', gold: REFLECTION_GOLD['discovery'] },
  { type: 'open-question' as ReflectionType, icon: '❓', label: '开放问题', gold: REFLECTION_GOLD['open-question'] },
  { type: 'method-log' as ReflectionType, icon: '📝', label: '方法日志', gold: REFLECTION_GOLD['method-log'] },
]

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
  if (s.reflection) {
    reflectionType.value = s.reflection.type
    if (s.reflection.methodLog) {
      methodLogProblem.value = s.reflection.methodLog.problem
      methodLogMethod.value = s.reflection.methodLog.method
      methodLogPrinciple.value = s.reflection.methodLog.principle
    } else {
      reflectionContent.value = s.reflection.content
    }
  } else {
    reflectionType.value = null
    reflectionContent.value = ''
    methodLogProblem.value = ''
    methodLogMethod.value = ''
    methodLogPrinciple.value = ''
  }
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

function buildReflectionData() {
  if (!reflectionType.value) return undefined
  if (reflectionType.value === 'method-log') {
    const log = { problem: methodLogProblem.value, method: methodLogMethod.value, principle: methodLogPrinciple.value }
    const content = `问题：${log.problem} / 方法：${log.method} / 原理：${log.principle}`
    return {
      type: reflectionType.value,
      content,
      methodLog: log,
      goldEarned: calcReflectionGold(reflectionType.value),
    }
  }
  return {
    type: reflectionType.value,
    content: reflectionContent.value,
    goldEarned: calcReflectionGold(reflectionType.value),
  }
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
  for (const sheet of progressStore.weekSheets) {
    map[sheet.date] = sheet.status
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
  if (idx > 0) router.push(`/progress/${weekDates[idx - 1]}`)
}

function nextDay() {
  const idx = weekDates.indexOf(selectedDate.value)
  if (idx >= 0 && idx < weekDates.length - 1) router.push(`/progress/${weekDates[idx + 1]}`)
}

function goToDate(date: string) {
  router.push(`/progress/${date}`)
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
function hasVariants(id: string) { const t = getTaskById(id); return t?.variants && t.variants.length > 0 }
function getVariants(id: string): TaskVariant[] { return getTaskById(id)?.variants ?? [] }

function onVariantChange(taskIdx: number, value: string) {
  if (!sheet.value) return
  const task = sheet.value.tasks[taskIdx]
  if (!task) return
  task.achievedVariant = value || undefined
  task.completed = !!value
}

async function loadData() {
  await planStore.loadWeek(weekId)
  await progressStore.loadWeekSheets(weekId, weekDates)
  await progressStore.loadSheet(weekId, selectedDate.value)
  initReflectionFromSheet()
}

async function handleSave() {
  if (!sheet.value) return
  progressStore.updateReflection(buildReflectionData())
  progressStore.updateWeeklyReview(buildWeeklyReviewData())
  await progressStore.saveSheet(sheet.value)
  await showAlert('已暂存')
}

async function handleSubmit() {
  if (!await showConfirm('确认提交？提交后需要审批员审批。')) return
  progressStore.updateReflection(buildReflectionData())
  progressStore.updateWeeklyReview(buildWeeklyReviewData())
  await progressStore.submitSheet()
  await showAlert('已提交，等待审批')
}


watch(() => route.params.date, () => { loadData() })
onMounted(() => {
  taskDefinitionsStore.load()
  loadData()
})
</script>

<style scoped>
/* 本周快速导航 */
.week-quick-nav {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 32px;
  animation: slideUp 0.6s ease-out;
}

.day-nav-item {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.1);
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.day-nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.day-nav-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

.day-nav-item:hover::before {
  transform: scaleX(1);
}

.day-nav-item.active {
  background: var(--gradient-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.day-nav-item.active::before {
  transform: scaleX(1);
}

.day-nav-item.today {
  border-color: var(--color-gold);
  border-width: 3px;
}

.day-label {
  font-family: 'Fredoka', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
}

.day-date {
  font-family: 'Fredoka', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.7;
}

.day-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 8px auto 0;
  background: var(--color-text-dim);
  opacity: 0.3;
}

.day-nav-item.completed .day-status-dot {
  background: var(--color-success);
  opacity: 1;
  box-shadow: 0 0 8px var(--color-success);
  animation: twinkle 1.5s ease-in-out infinite;
}

.day-nav-item.submitted .day-status-dot {
  background: var(--color-warning);
  opacity: 1;
  animation: pulse 1.5s ease-in-out infinite;
}

.day-nav-item.active .day-status-dot {
  background: var(--color-text-inverse);
  opacity: 1;
}

/* 传统箭头导航 */
.date-nav-arrows {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
}

.date-display {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
  color: var(--color-primary);
}

.btn-nav {
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
}

.btn-nav:hover:not(:disabled) {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

/* 任务卡片 */
.task-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.task-card:nth-child(1) { animation-delay: 0.05s; }
.task-card:nth-child(2) { animation-delay: 0.1s; }
.task-card:nth-child(3) { animation-delay: 0.15s; }
.task-card:nth-child(4) { animation-delay: 0.2s; }

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.task-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-cat {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.task-note {
  font-size: 0.85rem;
  margin-bottom: 8px;
  font-style: italic;
  color: var(--color-text-dim);
}

.task-body {
  border-top: 2px solid rgba(255, 107, 157, 0.1);
  padding-top: 12px;
  margin-top: 8px;
}

.variant-tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
  white-space: nowrap;
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

.form-group {
  margin-bottom: 12px;
}

.form-group .select,
.form-group .input {
  margin-bottom: 0;
  padding: 8px 14px;
}

.readonly-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.completed-yes {
  color: var(--color-success);
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.completed-no {
  color: var(--color-text-dim);
  font-weight: 600;
}

.approver-note {
  background: rgba(255, 168, 0, 0.1);
  border-left: 3px solid var(--color-warning);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 8px;
}

.reward-line {
  margin-top: 12px;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.1rem;
}

.actions-bar {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-success) 0%, #06d6a0 100%) !important;
}

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

.dim {
  color: var(--color-text-dim);
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  transition: background 0.3s ease;
}

.form-row:hover {
  background: rgba(255, 107, 157, 0.05);
}

/* 锚点卡片 */
.anchor-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(94, 174, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  animation: slideUp 0.5s ease-out;
}

.weekly-review-card {
  border-color: rgba(255, 182, 39, 0.3);
}

.anchor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.anchor-header h3 {
  margin: 0;
  flex: 1;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.1rem;
}

.anchor-icon {
  font-size: 1.4rem;
}

.anchor-badge {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.15), rgba(94, 174, 255, 0.25));
  color: var(--color-xp);
  border: 1px solid var(--color-xp);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  white-space: nowrap;
}

.reflection-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.reflection-type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--color-bg-elevated);
  border: 2px solid rgba(94, 174, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}

.reflection-type-option:hover {
  border-color: var(--color-xp);
  transform: translateY(-2px);
}

.reflection-type-option.selected {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.15), rgba(94, 174, 255, 0.25));
  border-color: var(--color-xp);
  box-shadow: 0 4px 12px rgba(94, 174, 255, 0.2);
}

.rt-icon { font-size: 1.5rem; }
.rt-name {
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}
.rt-gold {
  font-size: 0.8rem;
  color: var(--color-gold);
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.method-log-form { margin-top: 4px; }

.reflection-readonly {
  padding: 12px;
  background: var(--color-bg-elevated);
  border-radius: 10px;
}

.reflection-type-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.method-log-readonly p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.anchors-bonus-tag {
  margin-top: 12px;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.15), rgba(255, 218, 118, 0.2));
  border: 1px solid var(--color-gold);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  color: var(--color-gold);
}

/* 响应式 */
@media (max-width: 768px) {
  .week-quick-nav {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .day-nav-item {
    padding: 12px 8px;
  }

  .day-label {
    font-size: 0.8rem;
  }

  .day-date {
    font-size: 0.75rem;
  }

  .reflection-types {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}
</style>
