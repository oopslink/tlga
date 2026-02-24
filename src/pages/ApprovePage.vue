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
          submitted: getSheetStatus(date) === 'submitted',
          approved: getSheetStatus(date) === 'approved',
          rejected: getSheetStatus(date) === 'rejected',
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
      <p class="dim">该日没有进度单</p>
    </div>

    <template v-else>
      <p class="dim" style="margin-bottom:16px">
        状态：<span class="status-badge" :class="sheet.status">{{ statusText }}</span>
        <span v-if="sheet.submittedAt" class="dim"> &middot; 提交于 {{ formatTime(sheet.submittedAt) }}</span>
      </p>

      <div v-if="sheet.status === 'pending'" class="card">
        <p class="dim">进度单尚未提交，等待小学霸填写</p>
      </div>

      <template v-else>
        <!-- 任务审批列表 -->
        <div v-for="(task, idx) in sheet.tasks" :key="idx" class="task-card">
          <div class="task-header">
            <span class="task-cat">{{ getCatIcon(task.taskId) }}</span>
            <div class="task-header-content">
              <strong>{{ getTaskName(task.taskId) }}</strong>
            </div>
          </div>

          <!-- 小学霸填写的内容 -->
          <div class="kid-section">
            <div class="kid-row">
              <span :class="task.completed ? 'completed-yes' : 'completed-no'">
                {{ task.completed ? '小学霸标记: 已完成' : '小学霸标记: 未完成' }}
              </span>
              <span v-if="task.achievedVariant" class="variant-tag achieved">{{ task.achievedVariant }}</span>
            </div>
            <div v-if="task.kidComment" class="kid-comment">💬 {{ task.kidComment }}</div>
          </div>

          <!-- 审批操作 -->
          <div class="approve-section" v-if="isReviewable && overrides[idx]">
            <div class="form-row">
              <span class="label-inline">确认结果:</span>
              <select class="select-inline" v-model="overrides[idx].result" @change="onResultChange(idx)">
                <option value="__uncompleted">未完成</option>
                <template v-if="hasVariants(task.taskId)">
                  <option v-for="v in getVariants(task.taskId)" :key="v.level" :value="v.level">
                    {{ v.level }}
                  </option>
                </template>
                <option v-else value="__completed">已完成</option>
              </select>
            </div>

            <div class="reward-edit-row">
              <label class="reward-edit-item">
                <span class="label-sm gold">金币</span>
                <input type="number" class="input-sm" v-model.number="overrides[idx].gold" min="0" />
              </label>
              <label class="reward-edit-item">
                <span class="label-sm xp">XP</span>
                <input type="number" class="input-sm" v-model.number="overrides[idx].xp" min="0" />
              </label>
            </div>
            <div v-if="getEffectiveMultiplier(task.taskId, overrides[idx].result) > 1" class="multiplier-badge">
              ×{{ getEffectiveMultiplier(task.taskId, overrides[idx].result) }} 加成
            </div>

            <input class="input" v-model="overrides[idx].comment" placeholder="对此任务的批注（可选）" />
          </div>

          <!-- 已审批结果 -->
          <div class="result-section" v-if="sheet.settled">
            <div class="result-row">
              <span v-if="task.approverOverrideCompleted !== undefined" class="override-tag">
                {{ task.approverOverrideCompleted ? (task.approverOverrideVariant || '已完成') : '未完成' }}
              </span>
              <span v-if="task.approverComment" class="dim">批注: {{ task.approverComment }}</span>
            </div>
            <div class="reward-line">
              <span class="gold">+{{ task.finalGold }} 金币</span>
              <span v-if="task.finalXp" class="xp"> +{{ task.finalXp }} XP</span>
            </div>
          </div>
        </div>

        <!-- 反思与创造（只读展示） -->
        <div v-if="sheet.reflection || (isSunday && sheet.weeklyReview)" class="reflection-section">
          <h3>🧠 锚点三：反思与创造</h3>
          <div v-if="sheet.reflection" class="reflection-block">
            <div class="reflection-type-row">
              <span class="reflection-icon">{{ getReflectionIcon(sheet.reflection.type) }}</span>
              <span class="reflection-label">{{ getReflectionLabel(sheet.reflection.type) }}</span>
              <span class="gold">+{{ sheet.reflection.goldEarned }} 金</span>
            </div>
            <div v-if="sheet.reflection.methodLog" class="method-log-view">
              <p><strong>问题：</strong>{{ sheet.reflection.methodLog.problem }}</p>
              <p><strong>方法：</strong>{{ sheet.reflection.methodLog.method }}</p>
              <p><strong>原理：</strong>{{ sheet.reflection.methodLog.principle }}</p>
            </div>
            <p v-else class="reflection-content">{{ sheet.reflection.content }}</p>
          </div>
          <div v-else class="dim">未填写反思内容</div>

          <div v-if="sheet.weeklyReview?.completed" class="weekly-review-block">
            <h4>📖 本周回顾 <span class="gold">+{{ sheet.weeklyReview.goldEarned }} 金</span></h4>
            <p><strong>最骄傲：</strong>{{ sheet.weeklyReview.answers.proudest }}</p>
            <p><strong>新发现：</strong>{{ sheet.weeklyReview.answers.discovery }}</p>
            <p><strong>下周目标：</strong>{{ sheet.weeklyReview.answers.nextWeek }}</p>
          </div>

          <div v-if="sheet.allAnchorsCompleted" class="all-anchors-badge">
            🏆 三锚点全完成！+{{ sheet.allAnchorsBonusGold ?? 2 }} 金 +{{ sheet.allAnchorsBonusXp ?? 10 }} XP
          </div>
        </div>

        <!-- 额外加成 -->
        <div v-if="isReviewable" class="card bonus-card">
          <h3>额外加成</h3>
          <div class="bonus-row">
            <label class="bonus-item">
              <span class="label">倍率</span>
              <div class="bonus-input-wrap">
                <span class="bonus-prefix">×</span>
                <input type="number" class="input-sm" v-model.number="bonus.multiplier" min="0" step="0.1" />
              </div>
            </label>
            <label class="bonus-item">
              <span class="label gold">额外金币</span>
              <input type="number" class="input-sm" v-model.number="bonus.gold" />
            </label>
            <label class="bonus-item">
              <span class="label xp">额外 XP</span>
              <input type="number" class="input-sm" v-model.number="bonus.xp" />
            </label>
          </div>
        </div>

        <!-- 结算预览（审批前实时预览 / 审批后最终结果） -->
        <div class="reward-preview">
          <h3>{{ sheet.settled ? '结算结果' : '结算预览' }}</h3>
          <template v-if="isReviewable">
            <div class="breakdown-item">
              <span>任务小计</span>
              <span><span class="gold">{{ previewTaskGold }}</span> 金币 / <span class="xp">{{ previewTaskXp }}</span> XP</span>
            </div>
            <div v-for="(task, idx) in sheet.tasks" :key="'task-'+idx"
                 class="breakdown-item task-detail"
                 v-if="overrides[idx] && overrides[idx].result !== '__uncompleted'">
              <span>{{ getTaskName(task.taskId) }}
                <span v-if="getEffectiveMultiplier(task.taskId, overrides[idx].result) > 1" class="multiplier-inline">
                  ×{{ getEffectiveMultiplier(task.taskId, overrides[idx].result) }}
                </span>
              </span>
              <span><span class="gold">{{ overrides[idx].gold }}</span> 金币</span>
            </div>
            <div v-if="bonus.multiplier !== 1" class="breakdown-item">
              <span>倍率 ×{{ bonus.multiplier }}</span>
              <span><span class="gold">{{ previewAfterMultGold }}</span> 金币 / <span class="xp">{{ previewAfterMultXp }}</span> XP</span>
            </div>
            <div v-if="bonus.gold || bonus.xp" class="breakdown-item">
              <span>额外加成</span>
              <span><span class="gold">+{{ bonus.gold }}</span> 金币 / <span class="xp">+{{ bonus.xp }}</span> XP</span>
            </div>
            <div class="breakdown-item total">
              <span>总计</span>
              <span><span class="gold">{{ previewTotalGold }}</span> 金币 / <span class="xp">{{ previewTotalXp }}</span> XP</span>
            </div>
          </template>
          <template v-else>
            <div v-if="sheet.bonusMultiplier && sheet.bonusMultiplier !== 1" class="breakdown-item">
              <span>倍率</span>
              <span>×{{ sheet.bonusMultiplier }}</span>
            </div>
            <div v-if="sheet.bonusGold || sheet.bonusXp" class="breakdown-item">
              <span>额外加成</span>
              <span><span class="gold">+{{ sheet.bonusGold ?? 0 }}</span> 金币 / <span class="xp">+{{ sheet.bonusXp ?? 0 }}</span> XP</span>
            </div>
            <div class="breakdown-item total">
              <span>总计</span>
              <span><span class="gold">{{ sheet.totalGold }}</span> 金币 / <span class="xp">{{ sheet.totalXp }}</span> XP</span>
            </div>
          </template>
        </div>

        <!-- 整体评语 -->
        <div v-if="isReviewable" class="card">
          <h3>整体评语</h3>
          <textarea class="input" v-model="reviewComment" rows="3" placeholder="写一句鼓励的话..."></textarea>
        </div>

        <!-- 已审批评语 -->
        <div v-if="sheet.reviewComment && !isReviewable" class="card" style="margin-top:16px">
          <h3>审批评语</h3>
          <p>{{ sheet.reviewComment }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="actions-bar">
          <template v-if="isReviewable">
            <button class="button btn-approve" @click="handleApprove">
              {{ sheet.status === 'approved' ? '✅ 重新审批并结算' : '✅ 通过并结算' }}
            </button>
            <button class="button btn-reject" @click="handleReject">❌ 驳回</button>
            <p v-if="sheet.status === 'approved'" class="dim" style="width: 100%;">
              💡 提示：此进度单已审批，可以调整奖励后重新结算
            </p>
          </template>
          <template v-else-if="sheet.status === 'rejected'">
            <p class="dim">已驳回，等待小学霸修改重新提交</p>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById, getTaskReward } from '@/utils/tasks'
import { CATEGORY_ICONS, type TaskVariant, type ReflectionType } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import { REFLECTION_TYPE_LABELS, REFLECTION_TYPE_ICONS } from '@/engine/reflection-anchor'

const { showAlert, showConfirm } = useModal()

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const taskDefinitionsStore = useTaskDefinitionsStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = computed(() => (route.params.date as string) || today())

const sheet = computed(() => progressStore.currentSheet)
// 允许已审批的进度单重新审批
const isReviewable = computed(() =>
  sheet.value?.status === 'submitted' || sheet.value?.status === 'approved'
)

// 用于存储所有进度单状态
const sheetsMap = computed(() => {
  const map: Record<string, string> = {}
  for (const sheet of progressStore.weekSheets) {
    map[sheet.date] = sheet.status
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
  if (idx > 0) router.push(`/approve/${weekDates[idx - 1]}`)
}

function nextDay() {
  const idx = weekDates.indexOf(selectedDate.value)
  if (idx >= 0 && idx < weekDates.length - 1) router.push(`/approve/${weekDates[idx + 1]}`)
}

function goToDate(date: string) {
  router.push(`/approve/${date}`)
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

/** 计算任务变体相对于基础奖励的有效倍率 */
function getEffectiveMultiplier(taskId: string, result: string): number {
  if (result === '__uncompleted' || result === '__completed') return 1
  const task = getTaskById(taskId)
  if (!task || !task.variants) return 1
  const variant = task.variants.find(v => v.level === result)
  if (!variant || task.gold === 0) return 1
  const multiplier = variant.gold / task.gold
  // Round to 1 decimal place
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
  // result 是一个 variant level
  return getTaskReward(taskId, result)
}

/** 从小学霸填写的数据推导初始确认结果 */
function inferResult(task: { taskId: string; completed: boolean; achievedVariant?: string }): string {
  if (!task.completed) return '__uncompleted'
  if (task.achievedVariant && hasVariants(task.taskId)) return task.achievedVariant
  if (hasVariants(task.taskId)) {
    // 已完成但没选 variant，默认第一个
    const variants = getVariants(task.taskId)
    return variants.length > 0 ? variants[0].level : '__completed'
  }
  return '__completed'
}

function initOverrides() {
  overrides.length = 0
  bonus.multiplier = sheet.value?.bonusMultiplier ?? 1
  bonus.gold = sheet.value?.bonusGold ?? 0
  bonus.xp = sheet.value?.bonusXp ?? 0
  reviewComment.value = sheet.value?.reviewComment ?? ''

  if (!sheet.value) return

  // 如果已审批，使用之前的审批结果初始化
  if (sheet.value.status === 'approved') {
    for (const task of sheet.value.tasks) {
      // 从 finalGold/finalXp 和 override 字段恢复审批结果
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
    // 未审批，使用小学霸填写的数据初始化
    for (const task of sheet.value.tasks) {
      const result = inferResult(task)
      const reward = calcDefaultReward(task.taskId, result)
      overrides.push({ result, gold: reward.gold, xp: reward.xp, comment: '' })
    }
  }
}

/** 确认结果下拉框变化时，自动更新预计奖励 */
function onResultChange(idx: number) {
  if (!sheet.value) return
  const o = overrides[idx]
  const task = sheet.value.tasks[idx]
  const reward = calcDefaultReward(task.taskId, o.result)
  o.gold = reward.gold
  o.xp = reward.xp
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

    // 确认结果 → override 字段
    if (o.result === '__uncompleted') {
      task.approverOverrideCompleted = false
      task.approverOverrideVariant = undefined
    } else if (o.result === '__completed') {
      task.approverOverrideCompleted = true
      task.approverOverrideVariant = undefined
    } else {
      // variant level
      task.approverOverrideCompleted = true
      task.approverOverrideVariant = o.result
    }

    // 手动设定的金币/XP
    task.finalGold = o.gold
    task.finalXp = o.xp
    task.approverComment = o.comment || undefined
  }

  // 额外加成
  sheet.value.bonusMultiplier = bonus.multiplier
  sheet.value.bonusGold = bonus.gold
  sheet.value.bonusXp = bonus.xp
}

async function handleApprove() {
  const isReApproval = sheet.value?.status === 'approved'
  const message = isReApproval
    ? '确认重新审批？将使用新的奖励重新结算积分。'
    : '确认审批通过？将自动结算积分。'

  if (!await showConfirm(message)) return
  applyOverrides()
  await progressStore.approveSheet(reviewComment.value || undefined)

  const successMsg = isReApproval
    ? '重新审批成功，积分已更新！'
    : '审批通过，积分已结算！'
  await showAlert(successMsg)
}

async function handleReject() {
  if (!await showConfirm('确认驳回？小学霸需要修改后重新提交。')) return
  applyOverrides()
  await progressStore.rejectSheet(reviewComment.value || '请修改后重新提交')
  await showAlert('已驳回')
}

async function loadData() {
  // 加载整周的进度单状态，用于显示导航状态
  await progressStore.loadWeekSheets(weekId, weekDates)
  // 加载当前选中日期的详细进度单
  await progressStore.loadSheet(weekId, selectedDate.value)
  initOverrides()
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

.day-nav-item.submitted .day-status-dot {
  background: var(--color-warning);
  opacity: 1;
  animation: pulse 1.5s ease-in-out infinite;
}

.day-nav-item.approved .day-status-dot {
  background: var(--color-success);
  opacity: 1;
  box-shadow: 0 0 8px var(--color-success);
  animation: twinkle 1.5s ease-in-out infinite;
}

.day-nav-item.rejected .day-status-dot {
  background: var(--color-danger);
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
}

.task-cat {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.variant-tag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
}

.variant-tag.achieved {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.2));
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.kid-section {
  background: var(--color-bg-elevated);
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0;
  border: 2px solid rgba(94, 174, 255, 0.15);
}

.kid-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.kid-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(94, 174, 255, 0.1);
  border-left: 3px solid var(--color-xp);
  border-radius: 6px;
  font-size: 0.85rem;
  font-style: italic;
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

.approve-section {
  border-top: 2px solid rgba(255, 107, 157, 0.1);
  padding-top: 12px;
  margin-top: 12px;
}

.approve-section .input {
  margin-top: 10px;
  margin-bottom: 0;
  padding: 8px 14px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background: var(--color-bg-elevated);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.form-row:hover {
  background: rgba(255, 107, 157, 0.05);
}

.label-inline {
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  min-width: 90px;
  flex-shrink: 0;
}

.select-inline {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-family: 'Quicksand', sans-serif;
  flex: 1;
  transition: all 0.3s ease;
}

.select-inline:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
}

.reward-edit-row {
  display: flex;
  gap: 20px;
  margin: 12px 0;
}

.reward-edit-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-sm {
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.input-sm {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.95rem;
  font-family: 'Fredoka', sans-serif;
  width: 90px;
  text-align: center;
  transition: all 0.3s ease;
}

.input-sm:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
}

.bonus-card {
  margin-top: 20px;
}

.bonus-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.bonus-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bonus-item .label {
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.bonus-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bonus-prefix {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text-dim);
  font-family: 'Fredoka', sans-serif;
}

.result-section {
  border-top: 2px solid rgba(255, 107, 157, 0.1);
  padding-top: 16px;
  margin-top: 16px;
}

.result-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.override-tag {
  background: linear-gradient(135deg, rgba(255, 168, 0, 0.2), rgba(255, 218, 118, 0.2));
  color: var(--color-warning);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  border: 1px solid var(--color-warning);
}

.reward-line {
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.05rem;
  margin-top: 8px;
}

.reward-preview {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.1) 0%, rgba(255, 218, 118, 0.15) 100%);
  border: 3px solid var(--color-gold);
  padding: 24px;
  border-radius: 20px;
  margin-top: 24px;
  box-shadow: 0 8px 24px var(--color-gold-glow);
  position: relative;
  overflow: hidden;
  animation: rewardPulse 2s ease-in-out infinite;
}

.reward-preview::before {
  content: '✨';
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 2rem;
  opacity: 0.5;
  animation: twinkle 1.5s ease-in-out infinite;
}

@keyframes rewardPulse {
  0%, 100% { box-shadow: 0 8px 24px var(--color-gold-glow); }
  50% { box-shadow: 0 12px 32px var(--color-gold-glow); }
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 2px solid rgba(255, 182, 39, 0.2);
  font-family: 'Quicksand', sans-serif;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item.total {
  font-weight: 700;
  font-size: 1.3rem;
  border-top: 3px solid var(--color-gold);
  border-bottom: none;
  padding-top: 16px;
  margin-top: 8px;
  font-family: 'Fredoka', sans-serif;
}

.actions-bar {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-approve {
  background: linear-gradient(135deg, var(--color-success) 0%, #06d6a0 100%) !important;
}

.btn-reject {
  background: transparent !important;
  border: 3px solid var(--color-danger) !important;
  color: var(--color-danger) !important;
  box-shadow: none !important;
}

.btn-reject:hover {
  background: linear-gradient(135deg, rgba(239, 71, 111, 0.1), rgba(255, 107, 157, 0.1)) !important;
  border-color: var(--color-danger) !important;
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

.gold {
  color: var(--color-gold);
  font-weight: 700;
  text-shadow: 0 2px 8px var(--color-gold-glow);
}

.xp {
  color: var(--color-xp);
  font-weight: 700;
  text-shadow: 0 2px 8px var(--color-xp-glow);
}

.multiplier-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.2), rgba(255, 218, 118, 0.3));
  color: var(--color-gold);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  border: 1px solid var(--color-gold);
  margin-top: 8px;
}

.breakdown-item.task-detail {
  font-size: 0.85rem;
  padding: 6px 0 6px 16px;
  opacity: 0.85;
  border-bottom: 1px dashed rgba(255, 182, 39, 0.15);
}

.multiplier-inline {
  color: var(--color-gold);
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 0.8rem;
  margin-left: 4px;
}

/* 反思区块 */
.reflection-section {
  background: var(--color-bg-card);
  border: 2px solid rgba(94, 174, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.reflection-section h3 {
  margin: 0 0 16px;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.1rem;
}

.reflection-section h4 {
  margin: 0 0 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
}

.reflection-block {
  background: var(--color-bg-elevated);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.reflection-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.reflection-icon { font-size: 1.3rem; }
.reflection-label { flex: 1; }

.method-log-view p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.reflection-content {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.weekly-review-block {
  background: var(--color-bg-elevated);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid rgba(255, 182, 39, 0.2);
}

.weekly-review-block p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.all-anchors-badge {
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.15), rgba(255, 218, 118, 0.2));
  border: 1px solid var(--color-gold);
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  color: var(--color-gold);
  text-align: center;
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
}
</style>
