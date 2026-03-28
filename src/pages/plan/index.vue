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
          <view class="day-cell-label">{{ getDayLabel(dp.date) }}</view>
          <view class="day-cell-date">{{ getMonthDay(dp.date) }}</view>
          <view class="day-cell-dot"></view>
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
            :class="[{ 'task-row-locked': t.isLocked }, `cat-${getTaskCat(t.taskId)}`]"
          >
            <view class="task-row-left">
              <view class="task-icon-wrap" :class="`cat-icon-${getTaskCat(t.taskId)}`">
                <text class="task-icon">{{ t.isLocked ? '🔒' : getCatIcon(t.taskId) }}</text>
              </view>
              <view class="task-info">
                <text class="task-name">{{ t.isLocked ? t.note : getTaskName(t.taskId) }}</text>
                <text v-if="t.targetVariant" class="variant-chip">{{ t.targetVariant }}</text>
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
          <button class="btn-action btn-save" @click="handleSave" :disabled="saving">💾 保存草稿</button>
          <button class="btn-action btn-activate" @click="handleActivate" :disabled="hasNoTasks || saving">
            🚀 激活计划
          </button>
          <text v-if="hasNoTasks" class="hint-text">请先为某天添加任务再激活</text>
        </template>
        <template v-else-if="planStore.isActive">
          <button class="btn-action btn-save" @click="handleSave" :disabled="saving">💾 保存</button>
          <button class="btn-action btn-reactivate" @click="handleReactivate" :disabled="hasNoTasks || saving">
            🔄 保存并重新生成进度单
          </button>
        </template>
        <button class="btn-action btn-danger" @click="handleDelete" :disabled="saving">🗑️ 清空</button>
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
const saving = ref(false)

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
function getTaskCat(id: string): string { return getTaskById(id)?.category ?? '' }

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
  if (saving.value) return
  saving.value = true
  try {
    await planStore.save()
    await showAlert('保存成功')
  } finally {
    saving.value = false
  }
}

async function handleActivate() {
  if (saving.value) return
  if (!await showConfirm('激活后将为每天生成进度单，确认？')) return
  saving.value = true
  try {
    await planStore.activate()
    await showAlert('计划已激活，进度单已生成！')
  } finally {
    saving.value = false
  }
}

async function handleReactivate() {
  if (saving.value) return
  if (!await showConfirm('保存修改并重新生成进度单？原有的进度填写和审批记录将被清空。')) return
  saving.value = true
  try {
    await planStore.reactivate()
    await showAlert('计划已保存，进度单已重新生成！')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (saving.value) return
  if (!await showConfirm('确认清空本周计划？')) return
  saving.value = true
  try {
    await planStore.deletePlan()
    selectedDate.value = ''
    await showAlert('已清空')
  } finally {
    saving.value = false
  }
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
  margin-bottom: 28rpx;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.page-title {
  font-size: 58rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.week-id {
  font-size: 28rpx;
  color: var(--color-text-dim);
}

.status-pill {
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.status-pill.draft {
  background: rgba(138, 120, 120, 0.1);
  color: var(--color-text-dim);
  border: 2rpx solid rgba(138, 120, 120, 0.2);
}

.status-pill.active {
  background: rgba(6, 214, 160, 0.12);
  color: var(--color-success);
  border: 2rpx solid var(--color-success);
}

.status-pill.completed {
  background: rgba(94, 174, 255, 0.12);
  color: var(--color-xp);
  border: 2rpx solid var(--color-xp);
}

/* 7天日历 */
.week-nav {
  display: flex;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.day-cell {
  flex: 1;
  background: var(--color-bg-card);
  border: 2rpx solid rgba(255, 107, 157, 0.1);
  border-radius: 6rpx;
  padding: 8rpx 4rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.day-cell.today {
  border-color: var(--color-gold);
  border-width: 3rpx;
}

.day-cell.active {
  background: var(--gradient-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.day-cell-label {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 2rpx;
}

.day-cell-date {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.day-cell.active .day-cell-label {
  color: rgba(255, 255, 255, 0.8);
}

.day-cell.active .day-cell-date {
  color: var(--color-text-inverse);
}

.day-cell-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  margin: 4rpx auto 0;
  background: rgba(136, 136, 136, 0.2);
}

.day-cell.has-tasks .day-cell-dot {
  background: var(--color-success);
  box-shadow: 0 0 6rpx rgba(6, 214, 160, 0.5);
}

.day-cell.active .day-cell-dot {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: none;
}

/* 详情面板 */
.day-panel {
  background: var(--color-bg-card);
  border: 2rpx solid rgba(255, 107, 157, 0.1);
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.panel-header {
  padding: 18rpx 20rpx 14rpx;
  border-bottom: 2rpx solid rgba(255, 107, 157, 0.07);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.panel-date {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.task-count-chip {
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  border: 2rpx solid rgba(255, 107, 157, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 700;
}

/* 模版栏 */
.template-bar {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}

.select-sm {
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 10rpx;
  padding: 8rpx 16rpx;
  font-size: 26rpx;
}

.btn-tpl {
  background: none;
  border: 2rpx solid rgba(255, 107, 157, 0.2);
  color: var(--color-primary);
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
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
  padding: 12rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 14rpx;
  background: var(--color-bg-elevated);
  border: 2rpx solid rgba(255, 107, 157, 0.06);
  border-left: 5rpx solid rgba(136, 136, 136, 0.15);
  border-radius: 12rpx;
}

.task-row-locked {
  opacity: 0.92;
}

/* Category accent borders on task rows */
.task-row.cat-academic { border-left-color: var(--color-cat-academic); }
.task-row.cat-sports   { border-left-color: var(--color-cat-sports); }
.task-row.cat-language { border-left-color: var(--color-cat-language); }
.task-row.cat-art      { border-left-color: var(--color-cat-art); }
.task-row.cat-behavior { border-left-color: var(--color-cat-behavior); }

.locked-chip {
  background: rgba(94, 174, 255, 0.15);
  color: var(--color-xp);
  border: 2rpx solid rgba(94, 174, 255, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
  align-self: flex-start;
}

.lock-placeholder {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
}

.task-row-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.task-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: rgba(136, 136, 136, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-icon-wrap.cat-icon-academic { background: rgba(94, 174, 255, 0.15); }
.task-icon-wrap.cat-icon-sports   { background: rgba(6, 214, 160, 0.15); }
.task-icon-wrap.cat-icon-language { background: rgba(255, 182, 39, 0.15); }
.task-icon-wrap.cat-icon-art      { background: rgba(199, 125, 255, 0.15); }
.task-icon-wrap.cat-icon-behavior { background: rgba(255, 107, 157, 0.15); }

.task-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
  flex: 1;
}

.task-name {
  font-weight: 700;
  font-size: 28rpx;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variant-chip {
  background: rgba(255, 182, 39, 0.12);
  color: var(--color-gold-dark);
  border: 2rpx solid rgba(255, 182, 39, 0.25);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.note-input {
  flex: 1;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.1);
  border-radius: 10rpx;
  padding: 10rpx 16rpx;
  font-size: 26rpx;
}

.btn-delete {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 2rpx solid rgba(239, 71, 111, 0.2);
  border-radius: 10rpx;
  color: var(--color-danger);
  font-size: 22rpx;
  opacity: 0.6;
  padding: 0;
}

/* 空状态 */
.empty-tasks {
  padding: 40rpx 20rpx;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 28rpx;
}

/* 添加任务区 */
.add-section {
  padding: 12rpx 20rpx 20rpx;
  border-top: 2rpx dashed rgba(255, 107, 157, 0.1);
}

.add-row {
  display: flex;
  gap: 8rpx;
  align-items: center;
  flex-wrap: wrap;
}

.select-task {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.15);
  border-radius: 12rpx;
  padding: 14rpx 20rpx;
  font-size: 28rpx;
  flex-shrink: 0;
}

.note-add-input {
  flex: 1;
  min-width: 180rpx;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.12);
  border-radius: 12rpx;
  padding: 14rpx 20rpx;
  font-size: 28rpx;
}

.btn-add {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 12rpx;
  padding: 14rpx 28rpx;
  font-size: 28rpx;
  font-weight: 700;
  flex-shrink: 0;
}

/* 提示 */
.overview-hint {
  text-align: center;
  padding: 56rpx 20rpx;
  color: var(--color-text-dim);
  font-size: 28rpx;
  background: var(--color-bg-card);
  border: 2rpx dashed rgba(255, 107, 157, 0.12);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

/* 操作栏 */
.actions-bar {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 8rpx;
}

.btn-action {
  padding: 20rpx 40rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  font-weight: 700;
  border: none;
}

.btn-save {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2rpx solid rgba(255, 107, 157, 0.2);
}

.btn-activate {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
}

.btn-reactivate {
  background: var(--gradient-gold);
  color: var(--color-text);
}

.btn-danger {
  background: transparent;
  color: var(--color-danger);
  border: 2rpx solid rgba(239, 71, 111, 0.25);
}

.hint-text {
  width: 100%;
  color: var(--color-warning);
  font-size: 26rpx;
  margin-top: 8rpx;
}
</style>
