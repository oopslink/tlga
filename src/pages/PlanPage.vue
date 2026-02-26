<template>
  <div class="container">

    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">本周计划</h1>
        <span class="week-id">{{ planStore.weekId }}</span>
      </div>
      <span v-if="planStore.plan" class="status-pill" :class="planStore.plan.status">{{ statusText }}</span>
    </div>

    <div v-if="planStore.loading" class="loading">加载中...</div>

    <template v-else-if="planStore.plan">

      <!-- 7天日历导航 -->
      <div class="week-nav">
        <div
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
          <div class="day-cell-label">{{ getDayLabel(dp.date) }}</div>
          <div class="day-cell-date">{{ getMonthDay(dp.date) }}</div>
          <div class="day-cell-count">
            <span v-if="dp.tasks.length > 0" class="count-badge">{{ dp.tasks.length }}</span>
            <span v-else class="count-empty">—</span>
          </div>
        </div>
      </div>

      <!-- 选中日详情面板 -->
      <transition name="panel-slide">
        <div v-if="selectedDay" class="day-panel" :key="selectedDate">

          <!-- 面板标题栏 -->
          <div class="panel-header">
            <div class="panel-title-row">
              <h2 class="panel-date">{{ formatDateCN(selectedDate) }}</h2>
              <span v-if="selectedDay.tasks.length" class="task-count-chip">
                {{ selectedDay.tasks.length }} 项任务
              </span>
            </div>
            <!-- 模版快捷操作 -->
            <div class="template-bar" v-if="templateStore.templates.value.length > 0 || true">
              <select class="select-sm" v-model="templateState[selectedDate]">
                <option value="">📋 选择模版...</option>
                <option v-for="tpl in templateStore.templates.value" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
              </select>
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
            </div>
          </div>

          <!-- 已添加的任务列表 -->
          <div class="tasks-list" v-if="selectedDay.tasks.length > 0">
            <div
              v-for="(t, i) in selectedDay.tasks"
              :key="i"
              class="task-row"
              :class="{ 'task-row-locked': t.isLocked }"
            >
              <div class="task-row-left">
                <span class="task-icon">{{ t.isLocked ? '🔒' : getCatIcon(t.taskId) }}</span>
                <div class="task-info">
                  <span class="task-name">{{ t.isLocked ? t.note : getTaskName(t.taskId) }}</span>
                  <span v-if="t.isLocked" class="locked-chip">模板</span>
                  <span v-else-if="t.targetVariant" class="variant-chip">{{ t.targetVariant }}</span>
                </div>
              </div>
              <input
                v-if="t.isLocked"
                class="note-input"
                :value="t.targetVariant ?? ''"
                placeholder="具体内容（可选，如：P45-47）"
                @input="planStore.editTask(selectedDate, i, { targetVariant: ($event.target as HTMLInputElement).value })"
              />
              <input
                v-else
                class="note-input"
                :value="t.note"
                placeholder="备注..."
                @input="planStore.editTask(selectedDate, i, { note: ($event.target as HTMLInputElement).value })"
              />
              <button
                v-if="!t.isLocked"
                class="btn-delete"
                @click="planStore.removeTask(selectedDate, i)"
                title="移除"
              >✕</button>
              <span v-else class="lock-placeholder"></span>
            </div>
          </div>

          <div v-else class="empty-tasks">
            <span>暂无任务，从下方添加 👇</span>
          </div>

          <!-- 添加任务 -->
          <div class="add-section">
            <div class="add-row">
              <select class="select-task" v-model="addState[selectedDate].taskId">
                <option value="">选择任务...</option>
                <optgroup v-for="cat in categories" :key="cat" :label="catName(cat)">
                  <option v-for="td in tasksByCat(cat)" :key="td.id" :value="td.id">
                    {{ getCatIconByCategory(td.category) }} {{ td.name }}
                  </option>
                </optgroup>
              </select>
              <input
                class="note-add-input"
                v-model="addState[selectedDate].note"
                placeholder="备注（可选）"
                @keydown.enter="doAdd(selectedDate)"
              />
              <button
                class="btn-add"
                @click="doAdd(selectedDate)"
                :disabled="!addState[selectedDate]?.taskId"
              >+ 添加</button>
            </div>
          </div>

        </div>
      </transition>

      <!-- 全周任务概览（未选中时显示） -->
      <div v-if="!selectedDate" class="overview-hint">
        <span>👆 点击上方日期卡片开始编辑</span>
      </div>

      <!-- 底部操作栏 -->
      <div class="actions-bar">
        <template v-if="planStore.isDraft">
          <button class="btn-action btn-save" @click="handleSave">💾 保存草稿</button>
          <button class="btn-action btn-activate" @click="handleActivate" :disabled="hasNoTasks">
            🚀 激活计划
          </button>
          <p v-if="hasNoTasks" class="hint-text">请先为某天添加任务再激活</p>
        </template>
        <template v-else-if="planStore.isActive">
          <button class="btn-action btn-save" @click="handleSave">💾 保存</button>
          <button class="btn-action btn-reactivate" @click="handleReactivate" :disabled="hasNoTasks">
            🔄 保存并重新生成进度单
          </button>
        </template>
        <button class="btn-action btn-danger" @click="handleDelete">🗑️ 清空</button>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { usePlanStore } from '@/stores/plan.store'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
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

onMounted(async () => {
  taskDefinitionsStore.load()
  templateStore.load()
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
/* ── 页头 ── */
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
  font-family: 'Fredoka', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.week-id {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  font-family: 'Fredoka', sans-serif;
}

.status-pill {
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  letter-spacing: 0.03em;
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

/* ── 7天日历 ── */
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
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
}

.day-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.day-cell:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

.day-cell.today {
  border-color: var(--color-gold);
  border-width: 2.5px;
  box-shadow: 0 0 0 3px var(--color-gold-glow);
}

.day-cell.active {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px) scale(1.04);
}

.day-cell.active::before {
  opacity: 1;
}

.day-cell.active .day-cell-label,
.day-cell.active .day-cell-date,
.day-cell.active .count-badge,
.day-cell.active .count-empty {
  color: white;
  -webkit-text-fill-color: white;
  position: relative;
  z-index: 1;
}

.day-cell-label {
  font-family: 'Fredoka', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.day-cell-date {
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
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
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  box-shadow: 0 2px 6px rgba(255, 107, 157, 0.35);
}

.day-cell.active .count-badge {
  background: rgba(255,255,255,0.25);
  box-shadow: none;
}

.count-empty {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  opacity: 0.4;
}

/* ── 详情面板 ── */
.day-panel {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.1);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
}

.panel-slide-enter-active {
  animation: panelIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-leave-active {
  animation: panelIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) reverse;
}

@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 面板标题栏 */
.panel-header {
  padding: 18px 20px 14px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.07);
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.03) 0%, rgba(255, 154, 118, 0.03) 100%);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-date {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.task-count-chip {
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(255, 107, 157, 0.2);
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
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
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.15);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s;
  flex-shrink: 0;
}

.select-sm:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-tpl {
  background: none;
  border: 1.5px solid rgba(255, 107, 157, 0.2);
  color: var(--color-primary);
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-tpl:hover {
  background: rgba(255, 107, 157, 0.08);
  border-color: var(--color-primary);
}

.btn-tpl-all {
  color: var(--color-xp);
  border-color: rgba(94, 174, 255, 0.25);
}

.btn-tpl-all:hover {
  background: rgba(94, 174, 255, 0.08);
  border-color: var(--color-xp);
}

.btn-tpl-save {
  color: var(--color-gold);
  border-color: rgba(255, 182, 39, 0.25);
}

.btn-tpl-save:hover {
  background: rgba(255, 182, 39, 0.08);
  border-color: var(--color-gold);
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
  transition: all 0.2s ease;
}

.task-row:hover {
  border-color: rgba(255, 107, 157, 0.15);
  box-shadow: var(--shadow-sm);
}

.task-row-locked {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.04), rgba(94, 174, 255, 0.08));
  border-color: rgba(94, 174, 255, 0.15) !important;
}

.task-row-locked:hover {
  border-color: rgba(94, 174, 255, 0.3) !important;
  box-shadow: var(--shadow-sm);
}

.locked-chip {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.15), rgba(94, 174, 255, 0.25));
  color: var(--color-xp);
  border: 1px solid rgba(94, 174, 255, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  letter-spacing: 0.05em;
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
  font-size: 1.2rem;
  flex-shrink: 0;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 0.95rem;
  color: var(--color-text);
}

.variant-chip {
  background: linear-gradient(135deg, rgba(255, 182, 39, 0.12), rgba(255, 218, 118, 0.15));
  color: var(--color-gold-dark);
  border: 1px solid rgba(255, 182, 39, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
}

.note-input {
  flex: 1;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.1);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.85rem;
  font-family: 'Quicksand', sans-serif;
  transition: border-color 0.2s;
}

.note-input:focus {
  outline: none;
  border-color: var(--color-primary-light);
}

.note-input::placeholder {
  color: var(--color-text-dim);
  opacity: 0.5;
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
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.5;
}

.task-row:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: rgba(239, 71, 111, 0.1);
  border-color: var(--color-danger);
  transform: scale(1.1);
}

/* 空状态 */
.empty-tasks {
  padding: 24px 20px;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  font-family: 'Quicksand', sans-serif;
}

/* 添加任务区 */
.add-section {
  padding: 12px 20px 16px;
  border-top: 2px dashed rgba(255, 107, 157, 0.1);
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.02), transparent);
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
  font-size: 0.88rem;
  font-family: 'Quicksand', sans-serif;
  flex-shrink: 0;
  transition: border-color 0.2s;
  cursor: pointer;
}

.select-task:focus {
  outline: none;
  border-color: var(--color-primary);
}

.note-add-input {
  flex: 1;
  min-width: 120px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 0.88rem;
  font-family: 'Quicksand', sans-serif;
  transition: border-color 0.2s;
}

.note-add-input:focus {
  outline: none;
  border-color: var(--color-primary-light);
}

.note-add-input::placeholder {
  color: var(--color-text-dim);
  opacity: 0.5;
}

.btn-add {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 9px 20px;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-add:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 提示 */
.overview-hint {
  text-align: center;
  padding: 32px;
  color: var(--color-text-dim);
  font-size: 0.95rem;
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
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-save {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.2);
}

.btn-save:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

.btn-danger:hover {
  background: rgba(239, 71, 111, 0.08);
  border-color: var(--color-danger);
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-sm) !important;
}

.hint-text {
  width: 100%;
  color: var(--color-warning);
  font-size: 0.82rem;
  margin-top: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .week-nav {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .task-row {
    flex-wrap: wrap;
  }

  .task-row-left {
    min-width: 0;
  }

  .note-input {
    min-width: 100%;
    order: 3;
  }

  .add-row {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add {
    width: 100%;
  }
}
</style>
