<template>
  <div class="container">
    <h1>📝 每日进度</h1>

    <!-- 日期选择 -->
    <div class="date-nav">
      <button class="btn-nav" @click="prevDay" :disabled="!canGoPrev">&larr;</button>
      <span class="date-display">{{ formatDateCN(selectedDate) }}</span>
      <button class="btn-nav" @click="nextDay" :disabled="!canGoNext">&rarr;</button>
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
          <strong>{{ getTaskName(task.taskId) }}</strong>
          <span v-if="task.targetVariant" class="variant-tag target">目标: {{ task.targetVariant }}</span>
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
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress.store'
import { usePlanStore } from '@/stores/plan.store'
import { getTaskById, type TaskVariant } from '@/types/tasks'
import { CATEGORY_ICONS } from '@/types/tasks'
import { formatDateCN, today, currentWeek, getWeekDates } from '@/utils/date'
import { useModal } from '@/composables/useModal'

const { showAlert, showConfirm } = useModal()

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const planStore = usePlanStore()

const weekId = currentWeek()
const weekDates = getWeekDates(weekId)

const selectedDate = computed(() => (route.params.date as string) || today())

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
  await progressStore.loadSheet(weekId, selectedDate.value)
}

async function handleSave() {
  if (!sheet.value) return
  await progressStore.saveSheet(sheet.value)
  await showAlert('已暂存')
}

async function handleSubmit() {
  if (!await showConfirm('确认提交？提交后需要审批员审批。')) return
  await progressStore.submitSheet()
  await showAlert('已提交，等待审批')
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
.task-note { font-size:13px; margin-bottom:12px; }
.task-body { border-top:1px solid var(--color-bg-lighter); padding-top:12px; margin-top:8px; }

.variant-tag { padding:2px 8px; border-radius:4px; font-size:13px; }
.variant-tag.target { background:rgba(255,215,0,.15); color:var(--color-gold); }
.variant-tag.achieved { background:rgba(16,185,129,.15); color:var(--color-success); }

.form-group { margin-bottom:12px; }
.form-group .select, .form-group .input { margin-bottom:0; }

.readonly-row { display:flex; align-items:center; gap:12px; margin-bottom:4px; }
.completed-yes { color:var(--color-success); font-weight:600; }
.completed-no { color:var(--color-text-dim); }
.approver-note { color:var(--color-warning); font-size:13px; margin-top:4px; }
.reward-line { margin-top:8px; font-weight:600; }

.actions-bar { display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; align-items:center; }
.btn-submit { background:var(--color-success); }

.status-badge { padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.status-badge.pending { background:rgba(160,160,160,.15); color:var(--color-text-dim); }
.status-badge.submitted { background:rgba(245,158,11,.15); color:var(--color-warning); }
.status-badge.approved { background:rgba(16,185,129,.15); color:var(--color-success); }
.status-badge.rejected { background:rgba(233,69,96,.15); color:var(--color-primary); }

.dim { color:var(--color-text-dim); }
.form-row { display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:8px; }
</style>
