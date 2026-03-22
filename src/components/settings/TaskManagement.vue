<template>
  <view>
    <view class="header-row">
      <text class="header-title">任务管理</text>
      <view class="btn-icon btn-icon-success" @click="showAddDialog">
        <text>➕</text>
      </view>
    </view>

    <text class="page-desc">管理自定义任务定义</text>

    <!-- 任务列表 -->
    <view class="tasks-section">
      <!-- 按类别分组显示 -->
      <view v-for="cat in categories" :key="cat" class="category-section">
        <view class="category-header">
          <text class="cat-icon">{{ CATEGORY_ICONS[cat] }}</text>
          <text>{{ CATEGORY_NAMES[cat] }}</text>
        </view>

        <view class="task-cards">
          <!-- 内置任务 -->
          <view
            v-for="task in getTasksByCategory(cat, 'builtin')"
            :key="task.id"
            class="task-card builtin"
          >
            <view class="task-card-header">
              <view class="task-info">
                <text class="task-icon">{{ CATEGORY_ICONS[task.category] }}</text>
                <text class="task-name-bold">{{ task.name }}</text>
                <text class="builtin-badge">内置</text>
              </view>
            </view>
            <view class="task-card-body">
              <view class="reward-row">
                <text class="reward gold">💰 {{ task.gold }}</text>
                <text class="reward xp">✨ {{ task.xp }}</text>
              </view>
              <view v-if="task.variants && task.variants.length" class="variants">
                <text class="variant-label">完成程度：</text>
                <view v-for="v in task.variants" :key="v.level" class="variant-item">
                  <text class="variant-level">{{ v.level }}</text>
                  <text class="variant-rewards">💰{{ v.gold }} ✨{{ v.xp }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 自定义任务 -->
          <view
            v-for="task in getTasksByCategory(cat, 'custom')"
            :key="task.id"
            class="task-card custom"
          >
            <view class="task-card-header">
              <view class="task-info">
                <text class="task-icon">{{ CATEGORY_ICONS[task.category] }}</text>
                <text class="task-name-bold">{{ task.name }}</text>
                <text class="custom-badge">自定义</text>
              </view>
              <view class="task-actions">
                <view class="btn-icon btn-icon-sm" @click="editTask(task)"><text>✏️</text></view>
                <view class="btn-icon btn-icon-danger btn-icon-sm" @click="confirmDelete(task)"><text>🗑️</text></view>
              </view>
            </view>
            <view class="task-card-body">
              <view class="reward-row">
                <text class="reward gold">💰 {{ task.gold }}</text>
                <text class="reward xp">✨ {{ task.xp }}</text>
              </view>
              <view v-if="task.variants && task.variants.length" class="variants">
                <text class="variant-label">完成程度：</text>
                <view v-for="v in task.variants" :key="v.level" class="variant-item">
                  <text class="variant-level">{{ v.level }}</text>
                  <text class="variant-rewards">💰{{ v.gold }} ✨{{ v.xp }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加/编辑对话框 -->
    <view v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <view class="dialog">
        <view class="dialog-header">
          <text class="dialog-title">{{ editingTask ? '编辑任务' : '添加任务' }}</text>
          <view class="btn-icon btn-icon-sm" @click="closeDialog"><text>✕</text></view>
        </view>
        <view class="dialog-body">
          <!-- 任务名称 -->
          <view class="form-group">
            <text class="label">任务名称 *</text>
            <input :value="formData.name" @input="formData.name = $event.detail.value" class="input" placeholder="例如：数学练习" />
          </view>

          <!-- 所属类别 -->
          <view class="form-group">
            <text class="label">所属类别 *</text>
            <picker :range="categoryPickerRange" :range-key="'label'" :value="categoryPickerIndex" @change="onCategoryChange">
              <view class="picker-display">
                <text>{{ formData.category ? (CATEGORY_ICONS[formData.category] + ' ' + CATEGORY_NAMES[formData.category]) : '请选择...' }}</text>
              </view>
            </picker>
          </view>

          <!-- 描述 -->
          <view class="form-group">
            <text class="label">描述</text>
            <input :value="formData.description" @input="formData.description = $event.detail.value" class="input" placeholder="任务描述" />
          </view>

          <!-- 基础奖励 -->
          <view class="form-row">
            <view class="form-group">
              <text class="label">基础金币 *</text>
              <input :value="String(formData.gold)" @input="formData.gold = Number($event.detail.value) || 0" type="number" class="input" />
            </view>
            <view class="form-group">
              <text class="label">基础经验 *</text>
              <input :value="String(formData.xp)" @input="formData.xp = Number($event.detail.value) || 0" type="number" class="input" />
            </view>
          </view>

          <!-- 完成程度列表 -->
          <view class="form-group">
            <text class="label">完成程度（可选）</text>
            <view class="variants-editor">
              <view v-for="(v, idx) in formData.variants" :key="idx" class="variant-row">
                <input :value="v.level" @input="v.level = $event.detail.value" class="input" placeholder="例如：完成80%" style="flex: 2" />
                <input :value="String(v.gold)" @input="v.gold = Number($event.detail.value) || 0" type="number" class="input" placeholder="金币" style="flex: 1" />
                <input :value="String(v.xp)" @input="v.xp = Number($event.detail.value) || 0" type="number" class="input" placeholder="经验" style="flex: 1" />
                <view class="btn-icon btn-icon-danger btn-icon-sm" @click="removeVariant(idx)"><text>🗑️</text></view>
              </view>
              <view class="button" style="width: 100%; margin-top: 8px" @click="addVariant">
                <text>➕ 添加完成程度</text>
              </view>
            </view>
          </view>
        </view>
        <view class="dialog-footer">
          <view class="button btn-secondary" @click="closeDialog">
            <text>取消</text>
          </view>
          <view class="button" @click="saveTask" :class="{ disabled: !isFormValid }">
            <text>{{ editingTask ? '保存' : '添加' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { TASK_DEFINITIONS, CATEGORY_NAMES, CATEGORY_ICONS, type TaskCategory, type TaskDefinition, type TaskVariant } from '@/types/tasks'
import { useModal } from '@/composables/useModal'

const taskStore = useTaskDefinitionsStore()
const { showAlert, showConfirm } = useModal()

const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

const categoryPickerRange = categories.map(c => ({ value: c, label: CATEGORY_ICONS[c] + ' ' + CATEGORY_NAMES[c] }))

const categoryPickerIndex = computed(() => {
  const idx = categories.indexOf(formData.value.category as TaskCategory)
  return idx >= 0 ? idx : 0
})

function onCategoryChange(e: any) {
  formData.value.category = categories[e.detail.value]
}

const dialogVisible = ref(false)
const editingTask = ref<TaskDefinition | null>(null)

const formData = ref({
  name: '',
  category: '' as TaskCategory | '',
  description: '',
  gold: 1,
  xp: 0,
  variants: [] as TaskVariant[]
})

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' &&
         formData.value.category !== '' &&
         formData.value.gold >= 0 &&
         formData.value.xp >= 0
})

function getTasksByCategory(cat: TaskCategory, type: 'builtin' | 'custom') {
  if (type === 'builtin') {
    return TASK_DEFINITIONS.filter(t => t.category === cat)
  } else {
    return taskStore.customTasks.filter(t => t.category === cat)
  }
}

function showAddDialog() {
  editingTask.value = null
  formData.value = {
    name: '',
    category: '',
    description: '',
    gold: 1,
    xp: 0,
    variants: []
  }
  dialogVisible.value = true
}

function editTask(task: TaskDefinition) {
  editingTask.value = task
  formData.value = {
    name: task.name,
    category: task.category,
    description: task.description,
    gold: task.gold,
    xp: task.xp,
    variants: task.variants ? [...task.variants] : []
  }
  dialogVisible.value = true
}

async function confirmDelete(task: TaskDefinition) {
  if (await showConfirm(`确认删除任务"${task.name}"？`)) {
    taskStore.deleteTask(task.id)
    await showAlert('任务已删除')
  }
}

function closeDialog() {
  dialogVisible.value = false
  editingTask.value = null
}

function addVariant() {
  formData.value.variants.push({ level: '', gold: 1, xp: 0 })
}

function removeVariant(idx: number) {
  formData.value.variants.splice(idx, 1)
}

async function saveTask() {
  if (!isFormValid.value) return

  const taskData: TaskDefinition = {
    id: editingTask.value?.id || taskStore.generateTaskId(formData.value.name),
    name: formData.value.name.trim(),
    category: formData.value.category as TaskCategory,
    description: formData.value.description.trim(),
    gold: formData.value.gold,
    xp: formData.value.xp,
    variants: formData.value.variants.filter(v => v.level.trim() !== '')
  }

  if (editingTask.value) {
    taskStore.updateTask(editingTask.value.id, taskData)
    await showAlert('任务已更新')
  } else {
    taskStore.addTask(taskData)
    await showAlert('任务已添加')
  }

  closeDialog()
}

onLoad(() => {
  taskStore.load()
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

.category-section {
  margin-bottom: 32px;
}

.category-header {
  font-size: 30rpx;
  color: var(--color-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.cat-icon {
  font-size: 36rpx;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.task-card.builtin {
  opacity: 0.8;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.task-icon {
  font-size: 28rpx;
}

.task-name-bold {
  font-weight: 700;
}

.builtin-badge {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 22rpx;
  font-weight: 600;
}

.custom-badge {
  background: rgba(255, 107, 157, 0.15);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 22rpx;
  font-weight: 700;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.task-card-body {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 107, 157, 0.08);
}

.reward-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.reward {
  font-weight: 600;
  font-size: 28rpx;
}

.variants {
  margin-top: 8px;
  padding: 8px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
}

.variant-label {
  font-size: 26rpx;
  color: var(--color-text-dim);
  margin-bottom: 6px;
  font-weight: 600;
  display: block;
}

.variant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 26rpx;
}

.variant-level {
  color: var(--color-text);
}

.variant-rewards {
  font-weight: 600;
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

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.picker-display {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.variants-editor {
  background: var(--color-bg-elevated);
  padding: 12px;
  border-radius: 8px;
}

.variant-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.variant-row .input {
  margin: 0;
}

.btn-secondary {
  background: var(--color-bg-elevated) !important;
  color: var(--color-text) !important;
}

.disabled {
  opacity: 0.5;
}
</style>
