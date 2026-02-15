<template>
  <div class="container">
    <h1>🔍 审批进度单</h1>

    <!-- 日期选择 -->
    <div class="date-nav">
      <button class="btn-nav" @click="prevDay" :disabled="!canGoPrev">&larr;</button>
      <span class="date-display">{{ formatDateCN(selectedDate) }}</span>
      <button class="btn-nav" @click="nextDay" :disabled="!canGoNext">&rarr;</button>
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
            <strong>{{ getTaskName(task.taskId) }}</strong>
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
          <div class="approve-section" v-if="isReviewable">
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
            <button class="button btn-approve" @click="handleApprove">✅ 通过并结算</button>
            <button class="button btn-reject" @click="handleReject">❌ 驳回</button>
          </template>
          <template v-else-if="sheet.status === 'approved'">
            <p class="dim">已审批通过并结算</p>
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
import { getTaskById, getTaskReward, type TaskVariant } from '@/types/tasks'
import { CATEGORY_ICONS } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'

const { showAlert, showConfirm } = useModal()

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = computed(() => (route.params.date as string) || today())

const sheet = computed(() => progressStore.currentSheet)
const isReviewable = computed(() => sheet.value?.status === 'submitted')

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

function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '' }
function hasVariants(id: string) { const t = getTaskById(id); return t?.variants && t.variants.length > 0 }
function getVariants(id: string): TaskVariant[] { return getTaskById(id)?.variants ?? [] }

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
  bonus.multiplier = 1
  bonus.gold = 0
  bonus.xp = 0
  if (!sheet.value) return
  for (const task of sheet.value.tasks) {
    const result = inferResult(task)
    const reward = calcDefaultReward(task.taskId, result)
    overrides.push({ result, gold: reward.gold, xp: reward.xp, comment: '' })
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
  if (!await showConfirm('确认审批通过？将自动结算积分。')) return
  applyOverrides()
  await progressStore.approveSheet(reviewComment.value || undefined)
  await showAlert('审批通过，积分已结算！')
}

async function handleReject() {
  if (!await showConfirm('确认驳回？小学霸需要修改后重新提交。')) return
  applyOverrides()
  await progressStore.rejectSheet(reviewComment.value || '请修改后重新提交')
  await showAlert('已驳回')
}

async function loadData() {
  await progressStore.loadSheet(weekId, selectedDate.value)
  initOverrides()
}

watch(() => route.params.date, () => { loadData() })
onMounted(() => { loadData() })
</script>

<style scoped>
.date-nav { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
.date-display { font-size:20px; font-weight:700; min-width:160px; text-align:center; }
.btn-nav { background:var(--color-bg-lighter); color:var(--color-text); border:none; border-radius:8px; padding:8px 16px; font-size:18px; cursor:pointer; transition:background .2s; }
.btn-nav:hover:not(:disabled) { background:var(--color-primary); }
.btn-nav:disabled { opacity:.3; cursor:not-allowed; }

.task-card { background:var(--color-bg-light); border-radius:12px; padding:20px; margin-bottom:12px; }
.task-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.task-cat { font-size:20px; }

.variant-tag { padding:2px 8px; border-radius:4px; font-size:13px; }
.variant-tag.achieved { background:rgba(16,185,129,.15); color:var(--color-success); }

.kid-section { background:var(--color-bg); border-radius:8px; padding:12px; margin:8px 0; }
.kid-row { display:flex; align-items:center; gap:12px; }
.kid-comment { margin-top:4px; font-size:13px; }
.completed-yes { color:var(--color-success); font-weight:600; }
.completed-no { color:var(--color-text-dim); }

.approve-section { border-top:1px solid var(--color-bg-lighter); padding-top:12px; margin-top:12px; }
.approve-section .input { margin-top:8px; margin-bottom:0; }

.form-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.label-inline { font-weight:600; min-width:80px; flex-shrink:0; }
.select-inline { background:var(--color-bg); color:var(--color-text); border:2px solid var(--color-bg-lighter); border-radius:8px; padding:6px 12px; font-size:14px; flex:1; }
.select-inline:focus { outline:none; border-color:var(--color-primary); }

.reward-edit-row { display:flex; gap:16px; margin:8px 0; }
.reward-edit-item { display:flex; align-items:center; gap:6px; }
.label-sm { font-size:13px; font-weight:600; }
.input-sm { background:var(--color-bg); color:var(--color-text); border:2px solid var(--color-bg-lighter); border-radius:6px; padding:4px 8px; font-size:14px; width:80px; text-align:center; }
.input-sm:focus { outline:none; border-color:var(--color-primary); }

.bonus-card { margin-top:16px; }
.bonus-row { display:flex; gap:24px; flex-wrap:wrap; }
.bonus-item { display:flex; flex-direction:column; gap:6px; }
.bonus-item .label { font-size:13px; font-weight:600; }
.bonus-input-wrap { display:flex; align-items:center; gap:4px; }
.bonus-prefix { font-weight:700; font-size:16px; color:var(--color-text-dim); }

.result-section { border-top:1px solid var(--color-bg-lighter); padding-top:12px; margin-top:12px; }
.result-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:4px; }
.override-tag { background:rgba(245,158,11,.15); color:var(--color-warning); padding:2px 8px; border-radius:4px; font-size:13px; }
.reward-line { font-weight:600; }

.reward-preview { background:rgba(255,215,0,.1); border:2px solid var(--color-gold); padding:20px; border-radius:10px; margin-top:16px; }
.breakdown-item { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.1); }
.breakdown-item:last-child { border-bottom:none; }
.breakdown-item.total { font-weight:700; font-size:18px; border-top:2px solid rgba(255,255,255,.15); border-bottom:none; padding-top:12px; margin-top:4px; }

.actions-bar { display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; align-items:center; }
.btn-approve { background:var(--color-success); }
.btn-reject { background:transparent; border:2px solid var(--color-primary); color:var(--color-primary); }

.status-badge { padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.status-badge.pending { background:rgba(160,160,160,.15); color:var(--color-text-dim); }
.status-badge.submitted { background:rgba(245,158,11,.15); color:var(--color-warning); }
.status-badge.approved { background:rgba(16,185,129,.15); color:var(--color-success); }
.status-badge.rejected { background:rgba(233,69,96,.15); color:var(--color-primary); }

.dim { color:var(--color-text-dim); }
.gold { color:var(--color-gold); }
.xp { color:var(--color-xp); }
</style>
