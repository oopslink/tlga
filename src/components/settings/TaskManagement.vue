<template>
  <div>
    <div class="header-row">
      <h2>任务管理</h2>
      <button class="btn-icon btn-icon-success" @click="showAddDialog" title="添加任务">➕</button>
    </div>

    <p class="page-desc">管理自定义任务定义</p>

    <!-- 任务列表 -->
    <div class="tasks-section">
      <!-- 按类别分组显示 -->
      <div v-for="cat in categories" :key="cat" class="category-section">
        <h3 class="category-header">
          <span class="cat-icon">{{ CATEGORY_ICONS[cat] }}</span>
          {{ CATEGORY_NAMES[cat] }}
        </h3>

        <div class="task-cards">
          <!-- 内置任务 -->
          <div
            v-for="task in getTasksByCategory(cat, 'builtin')"
            :key="task.id"
            class="task-card builtin"
          >
            <div class="task-card-header">
              <div class="task-info">
                <span class="task-icon">{{ CATEGORY_ICONS[task.category] }}</span>
                <strong>{{ task.name }}</strong>
                <span class="builtin-badge">内置</span>
              </div>
            </div>
            <div class="task-card-body">
              <div class="reward-row">
                <span class="reward gold">💰 {{ task.gold }}</span>
                <span class="reward xp">✨ {{ task.xp }}</span>
              </div>
              <div v-if="task.variants && task.variants.length" class="variants">
                <div class="variant-label">完成程度：</div>
                <div v-for="v in task.variants" :key="v.level" class="variant-item">
                  <span class="variant-level">{{ v.level }}</span>
                  <span class="variant-rewards">
                    💰{{ v.gold }} ✨{{ v.xp }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 自定义任务 -->
          <div
            v-for="task in getTasksByCategory(cat, 'custom')"
            :key="task.id"
            class="task-card custom"
          >
            <div class="task-card-header">
              <div class="task-info">
                <span class="task-icon">{{ CATEGORY_ICONS[task.category] }}</span>
                <strong>{{ task.name }}</strong>
                <span class="custom-badge">自定义</span>
              </div>
              <div class="task-actions">
                <button class="btn-icon btn-icon-sm" @click="editTask(task)" title="编辑">✏️</button>
                <button class="btn-icon btn-icon-danger btn-icon-sm" @click="confirmDelete(task)" title="删除">🗑️</button>
              </div>
            </div>
            <div class="task-card-body">
              <div class="reward-row">
                <span class="reward gold">💰 {{ task.gold }}</span>
                <span class="reward xp">✨ {{ task.xp }}</span>
              </div>
              <div v-if="task.variants && task.variants.length" class="variants">
                <div class="variant-label">完成程度：</div>
                <div v-for="v in task.variants" :key="v.level" class="variant-item">
                  <span class="variant-level">{{ v.level }}</span>
                  <span class="variant-rewards">
                    💰{{ v.gold }} ✨{{ v.xp }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingTask ? '编辑任务' : '添加任务' }}</h3>
          <button class="btn-icon btn-icon-sm" @click="closeDialog">✕</button>
        </div>
        <div class="dialog-body">
          <!-- 任务名称 -->
          <div class="form-group">
            <label class="label">任务名称 *</label>
            <input v-model="formData.name" class="input" placeholder="例如：数学练习" />
          </div>

          <!-- 所属类别 -->
          <div class="form-group">
            <label class="label">所属类别 *</label>
            <select v-model="formData.category" class="select">
              <option value="">请选择...</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ CATEGORY_ICONS[cat] }} {{ CATEGORY_NAMES[cat] }}
              </option>
            </select>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label class="label">描述</label>
            <input v-model="formData.description" class="input" placeholder="任务描述" />
          </div>

          <!-- 基础奖励 -->
          <div class="form-row">
            <div class="form-group">
              <label class="label">基础金币 *</label>
              <input v-model.number="formData.gold" type="number" min="0" class="input" />
            </div>
            <div class="form-group">
              <label class="label">基础经验 *</label>
              <input v-model.number="formData.xp" type="number" min="0" class="input" />
            </div>
          </div>

          <!-- 完成程度列表 -->
          <div class="form-group">
            <label class="label">完成程度（可选）</label>
            <div class="variants-editor">
              <div v-for="(v, idx) in formData.variants" :key="idx" class="variant-row">
                <input v-model="v.level" class="input" placeholder="例如：完成80%" style="flex: 2" />
                <input v-model.number="v.gold" type="number" min="0" class="input" placeholder="金币" style="flex: 1" />
                <input v-model.number="v.xp" type="number" min="0" class="input" placeholder="经验" style="flex: 1" />
                <button class="btn-icon btn-icon-danger btn-icon-sm" @click="removeVariant(idx)">🗑️</button>
              </div>
              <button class="button" style="width: 100%; margin-top: 8px" @click="addVariant">
                ➕ 添加完成程度
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="button" style="background: var(--color-bg-elevated); color: var(--color-text)" @click="closeDialog">
            取消
          </button>
          <button class="button" @click="saveTask" :disabled="!isFormValid">
            {{ editingTask ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'
import { TASK_DEFINITIONS, CATEGORY_NAMES, CATEGORY_ICONS, type TaskCategory, type TaskDefinition, type TaskVariant } from '@/types/tasks'
import { useModal } from '@/composables/useModal'

const taskStore = useTaskDefinitionsStore()
const { showAlert, showConfirm } = useModal()

const categories: TaskCategory[] = ['academic', 'sports', 'language', 'art', 'behavior']

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

onMounted(() => {
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

.category-section {
  margin-bottom: 32px;
}

.category-header {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.2rem;
  color: var(--color-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-icon {
  font-size: 1.5rem;
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.task-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
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
  font-size: 1.2rem;
}

.builtin-badge {
  background: rgba(136, 136, 136, 0.15);
  color: var(--color-text-dim);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.custom-badge {
  background: rgba(255, 107, 157, 0.15);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
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
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
}

.variants {
  margin-top: 8px;
  padding: 8px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
}

.variant-label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  margin-bottom: 6px;
  font-weight: 600;
}

.variant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.85rem;
}

.variant-level {
  color: var(--color-text);
}

.variant-rewards {
  font-family: 'Fredoka', sans-serif;
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

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row .form-group {
  margin-bottom: 0;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .task-cards {
    grid-template-columns: 1fr;
  }

  .dialog {
    width: 95%;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
