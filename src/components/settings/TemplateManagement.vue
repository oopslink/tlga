<template>
  <view>
    <view class="header-row">
      <text class="header-title">模版管理</text>
      <view class="btn-icon btn-icon-success" @click="showAddDialog">
        <text>➕</text>
      </view>
    </view>

    <text class="page-desc">管理每日任务模版，可在周计划中快速应用</text>

    <!-- 空状态 -->
    <view v-if="templateStore.templates.value.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text>还没有模版</text>
      <text class="dim">在这里创建模版，或在周计划中将某天的任务保存为模版</text>
    </view>

    <!-- 模版列表 -->
    <view class="template-cards">
      <view v-for="tpl in templateStore.templates.value" :key="tpl.id" class="template-card">
        <view class="template-card-header">
          <view class="template-info">
            <text class="template-name-bold">{{ tpl.name }}</text>
            <text class="task-count">{{ tpl.tasks.length }} 项任务</text>
          </view>
          <view class="template-actions">
            <view class="btn-icon btn-icon-sm" @click="viewTemplate(tpl)"><text>👁️</text></view>
            <view class="btn-icon btn-icon-sm" @click="editTemplate(tpl)"><text>✏️</text></view>
            <view class="btn-icon btn-icon-danger btn-icon-sm" @click="confirmDelete(tpl)"><text>🗑️</text></view>
          </view>
        </view>
        <view v-if="tpl.description" class="template-card-desc">
          <text>{{ tpl.description }}</text>
        </view>
        <view class="template-card-body">
          <view v-for="(task, idx) in tpl.tasks" :key="idx" class="template-task-item">
            <text class="task-cat">{{ getCatIcon(task.taskId) }}</text>
            <text>{{ getTaskName(task.taskId) }}</text>
            <text v-if="task.note" class="note-tag">{{ task.note }}</text>
          </view>
        </view>
        <view class="template-card-footer dim">
          <text>创建于 {{ formatTime(tpl.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 查看/编辑对话框 -->
    <view v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <view class="dialog">
        <view class="dialog-header">
          <text class="dialog-title">{{ dialogMode === 'view' ? '查看模版' : dialogMode === 'edit' ? '编辑模版' : '新建模版' }}</text>
          <view class="btn-icon btn-icon-sm" @click="closeDialog"><text>✕</text></view>
        </view>
        <view class="dialog-body">
          <!-- 模版名称 -->
          <view class="form-group">
            <text class="label">模版名称 *</text>
            <input
              :value="formData.name"
              @input="formData.name = $event.detail.value"
              class="input"
              placeholder="例如：平日任务"
              :disabled="dialogMode === 'view'"
            />
          </view>

          <!-- 描述 -->
          <view class="form-group">
            <text class="label">描述</text>
            <input
              :value="formData.description"
              @input="formData.description = $event.detail.value"
              class="input"
              placeholder="例如：周一到周五的标准任务安排"
              :disabled="dialogMode === 'view'"
            />
          </view>

          <!-- 任务列表 -->
          <view class="form-group">
            <text class="label">任务列表</text>
            <view class="tasks-editor">
              <view v-for="(task, idx) in formData.tasks" :key="idx" class="task-edit-row">
                <text class="task-cat">{{ getCatIcon(task.taskId) }}</text>
                <text class="task-edit-name">{{ getTaskName(task.taskId) }}</text>
                <input
                  class="input input-sm"
                  :value="formData.tasks[idx].note"
                  @input="formData.tasks[idx].note = $event.detail.value"
                  placeholder="备注"
                  :disabled="dialogMode === 'view'"
                />
                <view
                  v-if="dialogMode !== 'view'"
                  class="btn-icon btn-icon-danger btn-icon-sm"
                  @click="removeTask(idx)"
                ><text>🗑️</text></view>
              </view>

              <!-- 添加任务 -->
              <view v-if="dialogMode !== 'view'" class="add-task-row">
                <picker :range="taskPickerRange" :range-key="'label'" :value="0" @change="onTaskPickerChange">
                  <view class="picker-display">
                    <text>{{ addTaskId ? getTaskName(addTaskId) : '选择任务...' }}</text>
                  </view>
                </picker>
                <input class="input" :value="addTaskNote" @input="addTaskNote = $event.detail.value" placeholder="任务描述（可选）" style="flex:1" />
                <view class="btn-icon btn-icon-success btn-icon-sm" @click="doAddTask" :class="{ disabled: !addTaskId }">
                  <text>➕</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="dialog-footer">
          <view class="button btn-secondary" @click="closeDialog">
            <text>{{ dialogMode === 'view' ? '关闭' : '取消' }}</text>
          </view>
          <view
            v-if="dialogMode !== 'view'"
            class="button"
            @click="saveTemplate"
            :class="{ disabled: !isFormValid }"
          >
            <text>{{ dialogMode === 'edit' ? '保存' : '创建' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
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

// Build a flat picker range for task selection
const taskPickerRange = computed(() => {
  const items: { value: string; label: string }[] = [{ value: '', label: '选择任务...' }]
  for (const cat of categories) {
    const tasks = getTasksByCategoryUtil(cat)
    for (const td of tasks) {
      items.push({ value: td.id, label: CATEGORY_ICONS[cat] + ' ' + td.name })
    }
  }
  return items
})

function onTaskPickerChange(e: any) {
  const idx = e.detail.value
  addTaskId.value = taskPickerRange.value[idx]?.value || ''
}

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

function getTaskName(id: string) { return getTaskById(id)?.name ?? id }
function getCatIcon(id: string) { const t = getTaskById(id); return t ? CATEGORY_ICONS[t.category] : '📌' }

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function showAddDialog() {
  dialogMode.value = 'add'
  editingId.value = null
  addTaskId.value = ''
  formData.value = { name: '', description: '', tasks: [] }
  addTaskNote.value = ''
  dialogVisible.value = true
}

function viewTemplate(tpl: DailyTemplate) {
  dialogMode.value = 'view'
  editingId.value = tpl.id
  formData.value = {
    name: tpl.name,
    description: tpl.description ?? '',
    tasks: (tpl.tasks || []).map(t => ({ taskId: t.taskId, note: t.note })) as PlannedTaskItem[],
  }
  dialogVisible.value = true
}

function editTemplate(tpl: DailyTemplate) {
  dialogMode.value = 'edit'
  editingId.value = tpl.id
  addTaskId.value = ''
  formData.value = {
    name: tpl.name,
    description: tpl.description ?? '',
    tasks: (tpl.tasks || []).map(t => ({ taskId: t.taskId, note: t.note })) as PlannedTaskItem[],
  }
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

.header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.page-desc {
  display: block;
  color: var(--color-text-dim);
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-text-dim);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 60rpx;
  margin-bottom: 16px;
}

.template-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  overflow: hidden;
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

.template-name-bold {
  font-weight: 700;
}

.task-count {
  background: rgba(255, 107, 157, 0.1);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 24rpx;
  font-weight: 600;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.template-card-desc {
  padding: 0 16px 10px;
  color: var(--color-text-dim);
  font-size: 26rpx;
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
  font-size: 28rpx;
  border-bottom: 1px dashed rgba(255, 107, 157, 0.06);
}

.template-task-item:last-child {
  border-bottom: none;
}

.task-cat {
  font-size: 32rpx;
  flex-shrink: 0;
}

.note-tag {
  color: var(--color-text-dim);
  font-size: 24rpx;
  font-style: italic;
  margin-left: auto;
}

.template-card-footer {
  padding: 10px 16px;
  font-size: 24rpx;
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
}

.dialog {
  background: var(--color-bg);
  border-radius: 16px;
  width: 90%;
  max-height: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
}

.dialog-title {
  font-weight: 700;
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
  font-size: 28rpx;
}

.input-sm {
  margin: 0;
  padding: 4px 8px;
  font-size: 26rpx;
  width: 200rpx;
}

.add-task-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.picker-display {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.dim {
  color: var(--color-text-dim);
}

.disabled {
  opacity: 0.5;
}
</style>
