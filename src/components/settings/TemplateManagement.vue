<template>
  <div>
    <div class="header-row">
      <h2>模版管理</h2>
      <button class="btn-icon btn-icon-success" @click="showAddDialog" title="新建模版">➕</button>
    </div>

    <p class="page-desc">管理每日任务模版，可在周计划中快速应用</p>

    <!-- 空状态 -->
    <div v-if="templateStore.templates.value.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>还没有模版</p>
      <p class="dim">在这里创建模版，或在周计划中将某天的任务保存为模版</p>
    </div>

    <!-- 模版列表 -->
    <div class="template-cards">
      <div v-for="tpl in templateStore.templates.value" :key="tpl.id" class="template-card">
        <div class="template-card-header">
          <div class="template-info">
            <strong>{{ tpl.name }}</strong>
            <span class="task-count">{{ tpl.tasks.length }} 项任务</span>
          </div>
          <div class="template-actions">
            <button class="btn-icon btn-icon-sm" @click="viewTemplate(tpl)" title="查看">👁️</button>
            <button class="btn-icon btn-icon-sm" @click="editTemplate(tpl)" title="编辑">✏️</button>
            <button class="btn-icon btn-icon-danger btn-icon-sm" @click="confirmDelete(tpl)" title="删除">🗑️</button>
          </div>
        </div>
        <div v-if="tpl.description" class="template-card-desc">{{ tpl.description }}</div>
        <div class="template-card-body">
          <div v-for="(task, idx) in tpl.tasks" :key="idx" class="template-task-item">
            <span class="task-cat">{{ getCatIcon(task.taskId) }}</span>
            <span>{{ getTaskName(task.taskId) }}</span>
            <span v-if="task.targetVariant" class="variant-tag">{{ task.targetVariant }}</span>
            <span v-if="task.note" class="note-tag">{{ task.note }}</span>
          </div>
        </div>
        <div class="template-card-footer dim">
          创建于 {{ formatTime(tpl.createdAt) }}
        </div>
      </div>
    </div>

    <!-- 查看/编辑对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'view' ? '查看模版' : dialogMode === 'edit' ? '编辑模版' : '新建模版' }}</h3>
          <button class="btn-icon btn-icon-sm" @click="closeDialog">✕</button>
        </div>
        <div class="dialog-body">
          <!-- 模版名称 -->
          <div class="form-group">
            <label class="label">模版名称 *</label>
            <input
              v-model="formData.name"
              class="input"
              placeholder="例如：平日任务"
              :disabled="dialogMode === 'view'"
            />
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label class="label">描述</label>
            <input
              v-model="formData.description"
              class="input"
              placeholder="例如：周一到周五的标准任务安排"
              :disabled="dialogMode === 'view'"
            />
          </div>

          <!-- 任务列表 -->
          <div class="form-group">
            <label class="label">任务列表</label>
            <div class="tasks-editor">
              <div v-for="(task, idx) in formData.tasks" :key="idx" class="task-edit-row">
                <span class="task-cat">{{ getCatIcon(task.taskId) }}</span>
                <span class="task-edit-name">{{ getTaskName(task.taskId) }}</span>
                <select
                  v-if="hasVariants(task.taskId)"
                  class="select select-sm"
                  v-model="formData.tasks[idx].targetVariant"
                  :disabled="dialogMode === 'view'"
                >
                  <option value="">默认</option>
                  <option v-for="v in getVariants(task.taskId)" :key="v.level" :value="v.level">{{ v.level }}</option>
                </select>
                <input
                  class="input input-sm"
                  v-model="formData.tasks[idx].note"
                  placeholder="备注"
                  :disabled="dialogMode === 'view'"
                />
                <button
                  v-if="dialogMode !== 'view'"
                  class="btn-icon btn-icon-danger btn-icon-sm"
                  @click="removeTask(idx)"
                >🗑️</button>
              </div>

              <!-- 添加任务 -->
              <div v-if="dialogMode !== 'view'" class="add-task-row">
                <select class="select" v-model="addTaskId">
                  <option value="">选择任务...</option>
                  <optgroup v-for="cat in categories" :key="cat" :label="catName(cat)">
                    <option v-for="td in tasksByCat(cat)" :key="td.id" :value="td.id">{{ td.name }}</option>
                  </optgroup>
                </select>
                <input class="input" v-model="addTaskNote" placeholder="任务描述（可选）" style="flex:1" />
                <button class="btn-icon btn-icon-success btn-icon-sm" @click="doAddTask" :disabled="!addTaskId" title="添加">➕</button>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="button btn-secondary" @click="closeDialog">
            {{ dialogMode === 'view' ? '关闭' : '取消' }}
          </button>
          <button
            v-if="dialogMode !== 'view'"
            class="button"
            @click="saveTemplate"
            :disabled="!isFormValid"
          >
            {{ dialogMode === 'edit' ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { getTaskById, getTasksByCategory as getTasksByCategoryUtil } from '@/utils/tasks'
import { CATEGORY_NAMES, CATEGORY_ICONS, type TaskCategory, type TaskVariant, type DailyTemplate, type PlannedTaskItem } from '@/types/tasks'
import { useModal } from '@/composables/useModal'

const templateStore = useTemplates()
const taskDefinitionsStore = useTaskDefinitionsStore()
const { showAlert, showConfirm } = useModal()

const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

const dialogVisible = ref(false)
const dialogMode = ref<'view' | 'edit' | 'add'>('view')
const editingId = ref<string | null>(null)
const addTaskId = ref('')
const addTaskNote = ref('')

const formData = ref<{ name: string; description: string; tasks: PlannedTaskItem[] }>({
  name: '',
  description: '',
  tasks: [],
})

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.tasks.length > 0
})

function catName(c: TaskCategory) { return CATEGORY_NAMES[c] }
function tasksByCat(c: TaskCategory) { return getTasksByCategoryUtil(c) }
function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '📌' }
function hasVariants(id: string) { const t = getTaskById(id); return t?.variants && t.variants.length > 0 }
function getVariants(id: string): TaskVariant[] { return getTaskById(id)?.variants ?? [] }

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function showAddDialog() {
  dialogMode.value = 'add'
  editingId.value = null
  addTaskId.value = ''
  formData.value = { name: '', description: '', tasks: [] }
  addTaskId.value = ''
  addTaskNote.value = ''
  dialogVisible.value = true
}

function viewTemplate(tpl: DailyTemplate) {
  dialogMode.value = 'view'
  editingId.value = tpl.id
  formData.value = { name: tpl.name, description: tpl.description ?? '', tasks: JSON.parse(JSON.stringify(tpl.tasks)) }
  dialogVisible.value = true
}

function editTemplate(tpl: DailyTemplate) {
  dialogMode.value = 'edit'
  editingId.value = tpl.id
  addTaskId.value = ''
  formData.value = { name: tpl.name, description: tpl.description ?? '', tasks: JSON.parse(JSON.stringify(tpl.tasks)) }
  dialogVisible.value = true
}

async function confirmDelete(tpl: DailyTemplate) {
  if (await showConfirm(`确认删除模版"${tpl.name}"？`)) {
    templateStore.deleteTemplate(tpl.id)
    await showAlert('模版已删除')
  }
}

function closeDialog() {
  dialogVisible.value = false
  editingId.value = null
}

function doAddTask() {
  if (!addTaskId.value) return
  formData.value.tasks.push({ taskId: addTaskId.value, note: addTaskNote.value })
  addTaskId.value = ''
  addTaskNote.value = ''
}

function removeTask(idx: number) {
  formData.value.tasks.splice(idx, 1)
}

async function saveTemplate() {
  if (!isFormValid.value) return

  if (dialogMode.value === 'edit' && editingId.value) {
    templateStore.updateTemplate(editingId.value, {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      tasks: formData.value.tasks,
    })
    await showAlert('模版已更新')
  } else {
    templateStore.addTemplate(formData.value.name.trim(), formData.value.tasks, formData.value.description.trim())
    await showAlert('模版已创建')
  }

  closeDialog()
}

onMounted(() => {
  taskDefinitionsStore.load()
  templateStore.load()
})
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-row h2 {
  margin: 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.page-desc {
  color: var(--color-text-dim);
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-text-dim);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.template-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.template-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.task-count {
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.template-card-desc {
  padding: 0 16px 10px;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  font-style: italic;
}

.template-card-body {
  padding: 0 16px 12px;
  border-top: 1px solid rgba(255, 107, 157, 0.08);
}

.template-task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.9rem;
  border-bottom: 1px dashed rgba(255, 107, 157, 0.06);
}

.template-task-item:last-child {
  border-bottom: none;
}

.task-cat {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.variant-tag {
  background: rgba(255, 215, 0, 0.15);
  color: var(--color-gold);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.note-tag {
  color: var(--color-text-dim);
  font-size: 0.8rem;
  font-style: italic;
  margin-left: auto;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card-footer {
  padding: 10px 16px;
  font-size: 0.8rem;
  border-top: 1px solid rgba(255, 107, 157, 0.06);
  background: var(--color-bg-elevated);
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.dialog {
  background: var(--color-bg);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
}

.dialog-header h3 {
  font-family: 'Fredoka', sans-serif;
  margin: 0;
  color: var(--color-primary);
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 2px solid rgba(255, 107, 157, 0.1);
}

.btn-secondary {
  background: var(--color-bg-elevated) !important;
  color: var(--color-text) !important;
  box-shadow: none !important;
}

.form-group {
  margin-bottom: 16px;
}

.tasks-editor {
  background: var(--color-bg-elevated);
  padding: 12px;
  border-radius: 8px;
}

.task-edit-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  padding: 8px;
  background: var(--color-bg-card);
  border-radius: 8px;
}

.task-edit-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
}

.select-sm {
  margin: 0;
  padding: 4px 8px;
  font-size: 0.85rem;
  width: auto;
  min-width: 100px;
}

.input-sm {
  margin: 0;
  padding: 4px 8px;
  font-size: 0.85rem;
  width: 100px;
}

.add-task-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.add-task-row .select {
  margin: 0;
  width: auto;
  flex-shrink: 0;
}

.add-task-row .input {
  margin: 0;
}

.dim {
  color: var(--color-text-dim);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .template-cards {
    grid-template-columns: 1fr;
  }

  .dialog {
    width: 95%;
    max-height: 95vh;
  }

  .task-edit-row {
    flex-wrap: wrap;
  }
}
</style>
