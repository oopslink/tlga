<template>
  <div class="container">
    <p class="dim">{{ planStore.weekId }} &nbsp; <span class="status-badge" :class="planStore.plan?.status">{{ statusText }}</span></p>

    <div v-if="planStore.loading" class="loading">加载中...</div>
    <template v-else-if="planStore.plan">
      <!-- 每一天 -->
      <div v-for="(dp, dayIdx) in planStore.plan.dailyPlans" :key="dp.date" class="day-card">
        <div class="day-header" @click="toggle(dp.date)">
          <h3>{{ formatDate(dp.date) }}</h3>
          <span class="dim">{{ dp.tasks.length }} 项任务</span>
        </div>

        <div v-if="expanded.has(dp.date)" class="day-body">
          <!-- 已添加的任务 -->
          <div v-for="(t, i) in dp.tasks" :key="i" class="plan-task-row">
            <div class="plan-task-info">
              <span class="task-cat">{{ getCatIcon(t.taskId) }}</span>
              <strong>{{ getTaskName(t.taskId) }}</strong>
            </div>
            <div class="plan-task-note">
              <input class="input" v-model="dp.tasks[i].note" placeholder="备注说明..." />
            </div>
            <button class="btn-icon btn-icon-danger btn-icon-sm" @click="planStore.removeTask(dp.date, i)" title="删除任务">🗑️</button>
          </div>

          <!-- 添加新任务 -->
          <div class="add-row">
            <select class="select" v-model="addState[dp.date].taskId">
              <option value="">选择任务...</option>
              <optgroup v-for="cat in categories" :key="cat" :label="catName(cat)">
                <option v-for="td in tasksByCat(cat)" :key="td.id" :value="td.id">{{ td.name }}</option>
              </optgroup>
            </select>
            <input class="input" v-model="addState[dp.date].note" placeholder="备注说明" style="flex:1" />
            <button class="btn-icon btn-icon-success btn-icon-sm" @click="doAdd(dp.date)" :disabled="!addState[dp.date].taskId" title="添加任务">➕</button>
          </div>

          <!-- 模版操作 -->
          <div class="template-row">
            <select class="select" v-model="templateState[dp.date]">
              <option value="">选择模版...</option>
              <option v-for="tpl in templateStore.templates.value" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
            </select>
            <button class="btn-link" @click="applyTemplateToDay(dp.date)" :disabled="!templateState[dp.date]">📋 应用模版</button>
            <span class="template-divider" v-if="dp.tasks.length > 0">|</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-bar">
        <template v-if="planStore.isDraft">
          <button class="button" @click="handleSave">💾 保存草稿</button>
          <button class="button btn-activate" @click="handleActivate"
                  :disabled="hasNoTasks">
            🚀 激活计划（生成进度单）
          </button>
          <p v-if="hasNoTasks" class="hint">请先展开某一天并添加任务后，才能激活计划</p>
        </template>
        <template v-else-if="planStore.isActive">
          <button class="button" @click="handleSave">💾 保存</button>
          <button class="button btn-warning" @click="handleReactivate"
                  :disabled="hasNoTasks">
            🔄 保存并重新生成进度单
          </button>
          <p v-if="hasNoTasks" class="hint">请先添加任务后，才能重新生成进度单</p>
        </template>
        <button class="button btn-danger" @click="handleDelete">🗑️ 清空计划</button>
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
import { formatDateCN, currentWeek } from '@/utils/date'
import { useModal } from '@/composables/useModal'
import { useTemplates } from '@/composables/useTemplates'

const { showAlert, showConfirm, showPrompt } = useModal()
const templateStore = useTemplates()
const templateState = reactive<Record<string, string>>({})

const planStore = usePlanStore()
const taskDefinitionsStore = useTaskDefinitionsStore()
const expanded = ref(new Set<string>())
const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

const addState = reactive<Record<string, { taskId: string; note: string }>>({})

const hasNoTasks = computed(() => planStore.plan?.dailyPlans.every(d => d.tasks.length === 0) ?? true)

const statusText = computed(() => {
  const m: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return m[planStore.plan?.status ?? ''] ?? ''
})

function toggle(date: string) {
  expanded.value.has(date) ? expanded.value.delete(date) : expanded.value.add(date)
}

function formatDate(d: string) { return formatDateCN(d) }
function catName(c: TaskCategory) { return CATEGORY_NAMES[c] }
function tasksByCat(c: TaskCategory) { return getTasksByCategory(c) }
function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '' }

function doAdd(date: string) {
  const s = addState[date]
  if (!s.taskId) return
  planStore.addTask(date, s.taskId, s.note)
  s.taskId = ''
  s.note = ''
}

async function handleSave() {
  await planStore.save()
  await showAlert('保存成功')
}

async function handleActivate() {
  if (!await showConfirm('激活后将为每一天生成进度单，确认？')) return
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
  // replace array contents to ensure reactivity
  const clonedTasks = JSON.parse(JSON.stringify(tpl.tasks || [])) as any[]
  dp.tasks.splice(0, dp.tasks.length, ...(clonedTasks))
  planStore.plan.updatedAt = new Date().toISOString()
}

async function applyTemplateToAll(date: string) {
  const tpl = templateStore.getTemplate(templateState[date])
  if (!tpl || !planStore.plan) return
  if (!await showConfirm('将模版应用到所有天？现有任务将被替换。')) return
  const clonedTasksAll = JSON.parse(JSON.stringify(tpl.tasks || [])) as any[]
  for (const dp of planStore.plan.dailyPlans) {
    dp.tasks.splice(0, dp.tasks.length, ...(clonedTasksAll))
  }
  planStore.plan.updatedAt = new Date().toISOString()
  await showAlert('已应用到所有天')
}

async function handleDeleteTemplate(date: string) {
  if (!await showConfirm('确认删除此模版？')) return
  templateStore.deleteTemplate(templateState[date])
  templateState[date] = ''
  await showAlert('模版已删除')
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
  }
})
</script>

<style scoped>
.day-card { background:var(--color-bg-light); border-radius:12px; margin-bottom:12px; overflow:hidden; }
.day-header { padding:16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background .2s; }
.day-header:hover { background:var(--color-bg-lighter); }
.day-body { padding:0 16px 16px; border-top:1px solid var(--color-bg-lighter); }
.plan-task-row { display:flex; align-items:center; gap:12px; padding:12px; background:var(--color-bg); border-radius:8px; margin-top:8px; flex-wrap:wrap; }
.plan-task-info { display:flex; align-items:center; gap:8px; }
.plan-task-note { flex:1; min-width:200px; }
.plan-task-note .input { margin:0; }
.variant-tag { background:rgba(255,215,0,.15); color:var(--color-gold); padding:2px 8px; border-radius:4px; font-size:13px; }
.add-row { display:flex; gap:8px; margin-top:12px; align-items:center; flex-wrap:wrap; }
.add-row .select { margin:0; width:auto; flex-shrink:0; }
.add-row .input { margin:0; }
.add-row .button { margin:0; }
.actions-bar { display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; }
.btn-activate { background:var(--color-success); }
.btn-warning { background:var(--color-warning); color:#1a1a2e; }
.btn-danger { background:transparent; border:2px solid var(--color-primary); color:var(--color-primary); }
.dim { color:var(--color-text-dim); }
.hint { color:var(--color-warning); font-size:0.85rem; width:100%; margin-top:4px; }
.template-row { display:flex; gap:8px; margin-top:12px; align-items:center; flex-wrap:wrap; border-top:1px dashed var(--color-bg-lighter); padding-top:12px; }
.template-row .select { margin:0; width:auto; flex-shrink:0; min-width:140px; }
.template-divider { color:var(--color-text-dim); opacity:0.3; }
.btn-link-danger { color:var(--color-danger) !important; }
.btn-link { background:none; border:none; color:var(--color-primary); cursor:pointer; font-size:0.85rem; padding:4px 8px; border-radius:6px; transition:background 0.2s; }
.btn-link:hover { background:rgba(255,107,157,0.1); }
</style>
