<template>
  <view class="container">

    <!-- 页头 -->
    <view class="page-header">
      <view class="header-left">
        <text class="page-title">本周计划</text>
        <text class="week-id">{{ planStore.weekId }}</text>
      </view>
      <text v-if="planStore.plan" class="status-pill" :class="planStore.plan.status">{{ statusText }}</text>
    </view>

    <view v-if="planStore.loading" class="loading"><text>加载中...</text></view>

    <template v-else-if="planStore.plan">

      <!-- 7天日历导航 -->
      <view class="week-nav">
        <view
          v-for="(dp, idx) in planStore.plan.dailyPlans"
          :key="dp.date"
          class="day-cell"
          :class="{
            active: dp.date === selectedDate,
            today: dp.date === todayDate,
            'has-tasks': dp.tasks.length > 0,
            empty: dp.tasks.length === 0,
          }"
          @click="selectDay(dp.date)"
        >
          <text class="day-cell-label">{{ getDayLabel(dp.date) }}</text>
          <text class="day-cell-date">{{ getMonthDay(dp.date) }}</text>
          <view class="day-cell-count">
            <text v-if="dp.tasks.length > 0" class="count-badge">{{ dp.tasks.length }}</text>
            <text v-else class="count-empty">—</text>
          </view>
        </view>
      </view>

      <!-- 选中日详情面板 -->
      <view v-if="selectedDay" class="day-panel" :key="selectedDate">

        <!-- 面板标题栏 -->
        <view class="panel-header">
          <view class="panel-title-row">
            <text class="panel-date">{{ formatDateCN(selectedDate) }}</text>
            <text v-if="selectedDay.tasks.length" class="task-count-chip">
              {{ selectedDay.tasks.length }} 项任务
            </text>
          </view>
          <!-- 模版快捷操作 -->
          <view class="template-bar">
            <picker
              :value="getTemplateIndex(selectedDate)"
              :range="getTemplateOptions()"
              @change="(e) => onTemplateChange(selectedDate, e.detail.value)"
            >
              <view class="select-sm">
                <text>{{ templateState[selectedDate] ? getTemplateName(templateState[selectedDate]) : '📋 选择模版...' }}</text>
              </view>
            </picker>
            <button
              v-if="templateState[selectedDate]"
              class="btn-tpl"
              @click="applyTemplateToDay(selectedDate)"
            >应用到今天</button>
            <button
              v-if="templateState[selectedDate]"
              class="btn-tpl btn-tpl-all"
              @click="applyTemplateToAll(selectedDate)"
            >应用到全周</button>
            <button
              v-if="selectedDay.tasks.length > 0"
              class="btn-tpl btn-tpl-save"
              @click="handleSaveAsTemplate(selectedDay)"
            >💾 存为模版</button>
          </view>
        </view>

        <!-- 已添加的任务列表 -->
        <view class="tasks-list" v-if="selectedDay.tasks.length > 0">
          <view
            v-for="(t, i) in selectedDay.tasks"
            :key="i"
            class="task-row"
            :class="{ 'task-row-locked': t.isLocked }"
          >
            <view class="task-row-left">
              <text class="task-icon">{{ t.isLocked ? '🔒' : getCatIcon(t.taskId) }}</text>
              <view class="task-info">
                <text class="task-name">{{ t.isLocked ? t.note : getTaskName(t.taskId) }}</text>
                <text v-if="t.isLocked" class="locked-chip">模板</text>
                <text v-else-if="t.targetVariant" class="variant-chip">{{ t.targetVariant }}</text>
              </view>
            </view>
            <input
              v-if="t.isLocked"
              class="note-input"
              :value="t.targetVariant ?? ''"
              placeholder="具体内容（可选，如：P45-47）"
              @input="planStore.editTask(selectedDate, i, { targetVariant: $event.detail.value })"
            />
            <input
              v-else
              class="note-input"
              :value="t.note"
              placeholder="备注..."
              @input="planStore.editTask(selectedDate, i, { note: $event.detail.value })"
            />
            <button
              v-if="!t.isLocked"
              class="btn-delete"
              @click="planStore.removeTask(selectedDate, i)"
            >✕</button>
            <view v-else class="lock-placeholder"></view>
          </view>
        </view>

        <view v-else class="empty-tasks">
          <text>暂无任务，从下方添加 👇</text>
        </view>

        <!-- 添加任务 -->
        <view class="add-section">
          <view class="add-row">
            <picker
              :value="getAddTaskIndex(selectedDate)"
              :range="getAddTaskOptions()"
              :range-key="'label'"
              @change="(e) => onAddTaskChange(selectedDate, e.detail.value)"
            >
              <view class="select-task">
                <text>{{ addState[selectedDate]?.taskId ? getTaskName(addState[selectedDate].taskId) : '选择任务...' }}</text>
              </view>
            </picker>
            <input
              class="note-add-input"
              :value="addState[selectedDate]?.note ?? ''"
              placeholder="备注（可选）"
              @input="addState[selectedDate].note = $event.detail.value"
            />
            <button
              class="btn-add"
              @click="doAdd(selectedDate)"
              :disabled="!addState[selectedDate]?.taskId"
            >+ 添加</button>
          </view>
        </view>

      </view>

      <!-- 全周任务概览（未选中时显示） -->
      <view v-if="!selectedDate" class="overview-hint">
        <text>👆 点击上方日期卡片开始编辑</text>
      </view>

      <!-- 底部操作栏 -->
      <view class="actions-bar">
        <template v-if="planStore.isDraft">
          <button class="btn-action btn-save" @click="handleSave">💾 保存草稿</button>
          <button class="btn-action btn-activate" @click="handleActivate" :disabled="hasNoTasks">
            🚀 激活计划
          </button>
          <text v-if="hasNoTasks" class="hint-text">请先为某天添加任务再激活</text>
        </template>
        <template v-else-if="planStore.isActive">
          <button class="btn-action btn-save" @click="handleSave">💾 保存</button>
          <button class="btn-action btn-reactivate" @click="handleReactivate" :disabled="hasNoTasks">
            🔄 保存并重新生成进度单
          </button>
        </template>
        <button class="btn-action btn-danger" @click="handleDelete">🗑️ 清空</button>
      </view>

    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { reactive, ref, computed } from 'vue'
import { usePlanStore } from '@/stores/plan.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { usePlayerStore } from '@/stores/player.store'
import { getTaskById, getTasksByCategory } from '@/utils/tasks'
import { CATEGORY_NAMES, CATEGORY_ICONS, type TaskCategory, type DailyPlan } from '@/types/tasks'
import { formatDateCN, currentWeek, today } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import { useTemplates } from '@/composables/useTemplates'

const { showAlert, showConfirm, showPrompt } = useModal()
const templateStore = useTemplates()
const templateState = reactive<Record<string, string>>({})

const planStore = usePlanStore()
const taskDefinitionsStore = useTaskDefinitionsStore()
const playerStore = usePlayerStore()
const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

const addState = reactive<Record<string, { taskId: string; note: string }>>({})
const selectedDate = ref('')
const todayDate = today()

const selectedDay = computed(() =>
  planStore.plan?.dailyPlans.find(d => d.date === selectedDate.value) ?? null
)

const hasNoTasks = computed(() => planStore.plan?.dailyPlans.every(d => d.tasks.length === 0) ?? true)

const statusText = computed(() => {
  const m: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return m[planStore.plan?.status ?? ''] ?? ''
})

function selectDay(date: string) {
  selectedDate.value = selectedDate.value === date ? '' : date
}

function getDayLabel(date: string) {
  const d = new Date(date + 'T00:00:00')
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

function getMonthDay(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function catName(c: TaskCategory) { return CATEGORY_NAMES[c] }
function tasksByCat(c: TaskCategory) { return getTasksByCategory(c) }
function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '' }
function getCatIconByCategory(cat: TaskCategory) { return CATEGORY_ICONS[cat] }

// Template picker helpers
function getTemplateOptions(): string[] {
  return ['📋 选择模版...', ...templateStore.templates.value.map(t => t.name)]
}

function getTemplateIndex(date: string): number {
  const id = templateState[date]
  if (!id) return 0
  const idx = templateStore.templates.value.findIndex(t => t.id === id)
  return idx >= 0 ? idx + 1 : 0
}

function getTemplateName(id: string): string {
  return templateStore.templates.value.find(t => t.id === id)?.name ?? '📋 选择模版...'
}

function onTemplateChange(date: string, index: number | string) {
  const i = Number(index)
  if (i === 0) {
    templateState[date] = ''
  } else {
    const tpl = templateStore.templates.value[i - 1]
    if (tpl) templateState[date] = tpl.id
  }
}

// Add task picker helpers
interface TaskOption { label: string; value: string }
let _taskOptions: TaskOption[] = []

function getAddTaskOptions(): TaskOption[] {
  const opts: TaskOption[] = [{ label: '选择任务...', value: '' }]
  for (const cat of categories) {
    for (const td of tasksByCat(cat)) {
      opts.push({ label: `${getCatIconByCategory(td.category)} ${td.name}`, value: td.id })
    }
  }
  _taskOptions = opts
  return opts
}

function getAddTaskIndex(date: string): number {
  const id = addState[date]?.taskId
  if (!id) return 0
  const opts = getAddTaskOptions()
  const idx = opts.findIndex(o => o.value === id)
  return idx >= 0 ? idx : 0
}

function onAddTaskChange(date: string, index: number | string) {
  const i = Number(index)
  const opts = getAddTaskOptions()
  if (addState[date]) {
    addState[date].taskId = opts[i]?.value ?? ''
  }
}

function doAdd(date: string) {
  const s = addState[date]
  if (!s?.taskId) return
  planStore.addTask(date, s.taskId, s.note)
  s.taskId = ''
  s.note = ''
}

async function handleSave() {
  await planStore.save()
  await showAlert('保存成功')
}

async function handleActivate() {
  if (!await showConfirm('激活后将为每天生成进度单，确认？')) return
  await planStore.activate()
  await showAlert('计划已激活，进度单已生成！')
}

async function handleReactivate() {
  if (!await showConfirm('保存修改并重新生成进度单？原有的进度填写和审批记录将被清空。')) return
  await planStore.reactivate()
  await showAlert('计划已保存，进度单已重新生成！')
}

async function handleDelete() {
  if (!await showConfirm('确认清空本周计划？')) return
  await planStore.deletePlan()
  selectedDate.value = ''
  await showAlert('已清空')
}

async function handleSaveAsTemplate(dp: DailyPlan) {
  const name = await showPrompt('请输入模版名称', '保存模版')
  if (!name) return
  templateStore.addTemplate(name, dp.tasks)
  await showAlert(`模版 "${name}" 已保存！`)
}

async function applyTemplateToDay(date: string) {
  const tpl = templateStore.getTemplate(templateState[date])
  if (!tpl || !planStore.plan) return
  const dp = planStore.plan.dailyPlans.find(d => d.date === date)
  if (!dp) return
  if (dp.tasks.length > 0 && !await showConfirm('将替换当天已有的任务，确认？')) return
  const cloned = JSON.parse(JSON.stringify(tpl.tasks || []))
  dp.tasks.splice(0, dp.tasks.length, ...cloned)
  planStore.plan.updatedAt = new Date().toISOString()
}

async function applyTemplateToAll(date: string) {
  const tpl = templateStore.getTemplate(templateState[date])
  if (!tpl || !planStore.plan) return
  if (!await showConfirm('将模版应用到全部7天？现有任务将被替换。')) return
  const cloned = JSON.parse(JSON.stringify(tpl.tasks || []))
  for (const dp of planStore.plan.dailyPlans) {
    dp.tasks.splice(0, dp.tasks.length, ...JSON.parse(JSON.stringify(cloned)))
  }
  planStore.plan.updatedAt = new Date().toISOString()
  await showAlert('已应用到全部7天')
}

onLoad(async () => {
  taskDefinitionsStore.load()
  templateStore.load()
  playerStore.load()
  await planStore.loadWeek(currentWeek())
  if (planStore.plan) {
    for (const dp of planStore.plan.dailyPlans) {
      addState[dp.date] = { taskId: '', note: '' }
      templateState[dp.date] = ''
    }
    // 默认选中今天（如果在本周内）
    const todayPlan = planStore.plan.dailyPlans.find(d => d.date === todayDate)
    if (todayPlan) selectedDate.value = todayDate
    else selectedDate.value = planStore.plan.dailyPlans[0]?.date ?? ''
  }
})
</script>

<style scoped>
/* 页头 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 29px;
  font-weight: 700;
  color: var(--color-primary);
}

.week-id {
  font-size: 14px;
  color: var(--color-text-dim);
}

.status-pill {
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.status-pill.draft {
  background: rgba(136, 136, 136, 0.12);
  color: var(--color-text-dim);
  border: 1.5px solid rgba(136, 136, 136, 0.2);
}

.status-pill.active {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.12), rgba(6, 214, 160, 0.2));
  color: var(--color-success);
  border: 1.5px solid var(--color-success);
}

.status-pill.completed {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.12), rgba(94, 174, 255, 0.2));
  color: var(--color-xp);
  border: 1.5px solid var(--color-xp);
}

/* 7天日历 */
.week-nav {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.day-cell {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 18px;
  padding: 14px 8px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.day-cell.today {
  border-color: var(--color-gold);
  border-width: 2.5px;
}

.day-cell.active {
  border-color: var(--color-primary);
  background: var(--gradient-primary);
}

.day-cell.active .day-cell-label,
.day-cell.active .day-cell-date,
.day-cell.active .count-badge,
.day-cell.active .count-empty {
  color: white;
}

.day-cell-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 4px;
  display: block;
}

.day-cell-date {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
  display: block;
}

.day-cell-count {
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.count-empty {
  font-size: 12px;
  color: var(--color-text-dim);
  opacity: 0.4;
}

/* 详情面板 */
.day-panel {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.1);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
}

.panel-header {
  padding: 18px 20px 14px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.07);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-date {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.task-count-chip {
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(255, 107, 157, 0.2);
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

/* 模版栏 */
.template-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.select-sm {
  background: var(--color-bg-elevated);
  border: 1.5px solid rgba(255, 107, 157, 0.15);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-tpl {
  background: none;
  border: 1.5px solid rgba(255, 107, 157, 0.2);
  color: var(--color-primary);
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.btn-tpl-all {
  color: var(--color-xp);
  border-color: rgba(94, 174, 255, 0.25);
}

.btn-tpl-save {
  color: var(--color-gold);
  border-color: rgba(255, 182, 39, 0.25);
}

/* 任务列表 */
.tasks-list {
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1.5px solid rgba(255, 107, 157, 0.06);
  border-radius: 12px;
}

.task-row-locked {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.04), rgba(94, 174, 255, 0.08));
  border-color: rgba(94, 174, 255, 0.15) !important;
}

.locked-chip {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.15), rgba(94, 174, 255, 0.25));
  color: var(--color-xp);
  border: 1px solid rgba(94, 174, 255, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.lock-placeholder {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}

.task-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 150px;
}

.task-icon {
  font-size: 19px;
  flex-shrink: 0;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text);
}

.variant-chip {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.12), rgba(255, 218, 118, 0.15));
  color: var(--color-gold-dark);
  border: 1px solid rgba(255, 182, 39, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.note-input {
  flex: 1;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.1);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 14px;
}

.btn-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1.5px solid rgba(239, 71, 111, 0.2);
  border-radius: 8px;
  color: var(--color-danger);
  font-size: 12px;
  opacity: 0.5;
  padding: 0;
}

/* 空状态 */
.empty-tasks {
  padding: 24px 20px;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 14px;
}

/* 添加任务区 */
.add-section {
  padding: 12px 20px 16px;
  border-top: 2px dashed rgba(255, 107, 157, 0.1);
}

.add-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.select-task {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 14px;
  flex-shrink: 0;
}

.note-add-input {
  flex: 1;
  min-width: 120px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 14px;
}

.btn-add {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

/* 提示 */
.overview-hint {
  text-align: center;
  padding: 32px;
  color: var(--color-text-dim);
  font-size: 15px;
  background: var(--color-bg-card);
  border: 2px dashed rgba(255, 107, 157, 0.12);
  border-radius: 20px;
  margin-bottom: 20px;
}

/* 操作栏 */
.actions-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 8px;
}

.btn-action {
  padding: 11px 24px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  border: none;
}

.btn-save {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.2);
}

.btn-activate {
  background: var(--gradient-primary);
  color: white;
}

.btn-reactivate {
  background: linear-gradient(135deg, var(--color-warning) 0%, #ffda76 100%);
  color: #1a1a2e;
}

.btn-danger {
  background: transparent;
  color: var(--color-danger);
  border: 2px solid rgba(239, 71, 111, 0.25);
}

.hint-text {
  width: 100%;
  color: var(--color-warning);
  font-size: 13px;
  margin-top: 4px;
}
</style>
