<template>
  <div class="container">
    <div class="page-header">
      <h1>📋 周计划模板</h1>
      <p class="dim">管理每周自动导入的固定任务框架</p>
    </div>

    <div v-if="store.loading" class="loading">加载中...</div>

    <template v-else>
      <!-- 模板列表 -->
      <div v-if="editingId === null">
        <div class="section-header">
          <span class="section-title">模板列表</span>
          <button class="btn-new" @click="handleNew">+ 新建模板</button>
        </div>

        <div class="template-list">
          <div
            v-for="tpl in store.templates"
            :key="tpl.id"
            class="template-card"
            :class="{ 'is-default': tpl.isDefault }"
          >
            <div class="tpl-card-left">
              <span class="tpl-name">{{ tpl.name }}</span>
              <span v-if="tpl.isDefault" class="default-badge">默认</span>
              <span class="tpl-date dim">创建于 {{ formatDate(tpl.createdAt) }}</span>
            </div>
            <div class="tpl-card-actions">
              <button class="btn-sm btn-edit" @click="handleEdit(tpl.id)">编辑</button>
              <button
                v-if="!tpl.isDefault"
                class="btn-sm btn-default"
                @click="handleSetDefault(tpl.id)"
              >设为默认</button>
              <button
                v-if="!tpl.isDefault"
                class="btn-sm btn-danger"
                @click="handleDelete(tpl.id, tpl.name)"
              >删除</button>
            </div>
          </div>
        </div>

        <div class="info-box">
          <p>💡 每周首次打开"本周计划"时，系统会自动从<strong>默认模板</strong>生成带框架的周计划草稿。</p>
          <p>🔒 由模板生成的任务项会标记为锁定，不可删除，但可填写具体内容备注。</p>
        </div>
      </div>

      <!-- 编辑模板 -->
      <div v-else>
        <div class="edit-header">
          <button class="btn-back" @click="editingId = null">← 返回列表</button>
          <div class="edit-title-row">
            <input
              class="tpl-name-input"
              v-model="editingName"
              placeholder="模板名称"
            />
          </div>
        </div>

        <div class="day-tabs">
          <button
            v-for="(day, idx) in WEEKDAYS"
            :key="day.key"
            class="day-tab"
            :class="{ active: editingDay === idx }"
            @click="editingDay = idx"
          >{{ day.label }}</button>
        </div>

        <div class="day-editor" v-if="currentDayConfig">
          <div class="anchor-section">
            <div class="anchor-title">🔢 锚点一：数学</div>
            <div class="anchor-items">
              <div
                v-for="(item, i) in currentDayConfig.mathItems"
                :key="item.id"
                class="anchor-item-row"
              >
                <input
                  class="item-label-input"
                  v-model="item.label"
                  placeholder="任务描述"
                />
                <button class="btn-remove-item" @click="removeMathItem(i)">✕</button>
              </div>
              <button class="btn-add-item" @click="addMathItem">+ 添加数学项目</button>
            </div>
          </div>

          <div class="anchor-section">
            <div class="anchor-title">🌍 锚点二：语言</div>
            <div class="anchor-items">
              <div
                v-for="(item, i) in currentDayConfig.languageItems"
                :key="item.id"
                class="anchor-item-row"
              >
                <input
                  class="item-label-input"
                  v-model="item.label"
                  placeholder="任务描述"
                />
                <button class="btn-remove-item" @click="removeLanguageItem(i)">✕</button>
              </div>
              <button class="btn-add-item" @click="addLanguageItem">+ 添加语言项目</button>
            </div>
          </div>

          <div class="anchor-section">
            <div class="anchor-title">💡 锚点三：反思与创新</div>
            <label class="toggle-row">
              <input type="checkbox" v-model="currentDayConfig.reflectionEnabled" />
              <span>启用（三选一填写）</span>
            </label>
          </div>
        </div>

        <div class="edit-actions">
          <button class="btn-action btn-save" @click="handleSave">💾 保存模板</button>
          <button class="btn-action btn-cancel" @click="editingId = null">取消</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useWeeklyTemplateStore } from '@/stores/weekly-template.store'
import type { WeeklyTemplate, DayTemplateConfig, WeekdayKey } from '@/types/tasks'
import { useModal } from '@/composables/useModal'

const store = useWeeklyTemplateStore()
const { showConfirm, showPrompt, showAlert } = useModal()

const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'sunday',    label: '周日' },
  { key: 'monday',    label: '周一' },
  { key: 'tuesday',   label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday',  label: '周四' },
  { key: 'friday',    label: '周五' },
  { key: 'saturday',  label: '周六' },
]

const editingId = ref<string | null>(null)
const editingName = ref('')
const editingDay = ref(0)
const editingTemplate = ref<WeeklyTemplate | null>(null)

const currentDayConfig = computed<DayTemplateConfig | null>(() => {
  if (!editingTemplate.value) return null
  return editingTemplate.value.days[WEEKDAYS[editingDay.value].key]
})

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

function generateItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function handleEdit(id: string) {
  const tpl = store.templates.find(t => t.id === id)
  if (!tpl) return
  editingTemplate.value = JSON.parse(JSON.stringify(tpl))
  editingName.value = tpl.name
  editingId.value = id
  editingDay.value = 0
}

async function handleNew() {
  const name = await showPrompt('请输入新模板名称', '新建模板')
  if (!name?.trim()) return
  const newTpl = store.createFromTemplate(name.trim())
  await store.addTemplate(newTpl)
  handleEdit(newTpl.id)
}

async function handleSave() {
  if (!editingTemplate.value || !editingId.value) return
  await store.updateTemplate(editingId.value, {
    name: editingName.value,
    days: editingTemplate.value.days,
  })
  await showAlert('模板已保存')
  editingId.value = null
}

async function handleSetDefault(id: string) {
  await store.setDefault(id)
  await showAlert('已设为默认模板')
}

async function handleDelete(id: string, name: string) {
  if (!await showConfirm(`确认删除模板"${name}"？`)) return
  await store.deleteTemplate(id)
}

function addMathItem() {
  currentDayConfig.value?.mathItems.push({
    id: generateItemId(),
    label: '',
  })
}

function removeMathItem(i: number) {
  currentDayConfig.value?.mathItems.splice(i, 1)
}

function addLanguageItem() {
  currentDayConfig.value?.languageItems.push({
    id: generateItemId(),
    label: '',
  })
}

function removeLanguageItem(i: number) {
  currentDayConfig.value?.languageItems.splice(i, 1)
}

onMounted(() => store.load())
</script>

<style scoped>
.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.8rem;
  margin: 0 0 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
}

.btn-new {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 9px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
}

.btn-new:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  transition: all 0.25s ease;
  gap: 12px;
}

.template-card:hover {
  border-color: rgba(255, 107, 157, 0.2);
  box-shadow: var(--shadow-sm);
}

.template-card.is-default {
  border-color: rgba(6, 214, 160, 0.3);
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.04), rgba(6, 214, 160, 0.08));
}

.tpl-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tpl-name {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
}

.default-badge {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.25));
  color: var(--color-success);
  border: 1px solid rgba(6, 214, 160, 0.3);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  flex-shrink: 0;
}

.tpl-date {
  font-size: 0.8rem;
}

.tpl-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(94, 174, 255, 0.1);
  color: var(--color-xp);
  border: 1.5px solid rgba(94, 174, 255, 0.25);
}

.btn-edit:hover {
  background: rgba(94, 174, 255, 0.2);
}

.btn-default {
  background: rgba(6, 214, 160, 0.1);
  color: var(--color-success);
  border: 1.5px solid rgba(6, 214, 160, 0.25);
}

.btn-default:hover {
  background: rgba(6, 214, 160, 0.2);
}

.btn-danger {
  background: rgba(239, 71, 111, 0.08);
  color: var(--color-danger);
  border: 1.5px solid rgba(239, 71, 111, 0.2);
}

.btn-danger:hover {
  background: rgba(239, 71, 111, 0.15);
}

.info-box {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.06), rgba(94, 174, 255, 0.1));
  border: 1.5px solid rgba(94, 174, 255, 0.2);
  border-radius: 14px;
  padding: 16px 20px;
}

.info-box p {
  margin: 4px 0;
  font-size: 0.88rem;
  color: var(--color-text);
  line-height: 1.6;
}

/* ── 编辑视图 ── */
.edit-header {
  margin-bottom: 20px;
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  transition: color 0.2s;
}

.btn-back:hover {
  color: var(--color-primary);
}

.tpl-name-input {
  width: 100%;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 1.1rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.tpl-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.day-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.day-tab {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  border: 2px solid rgba(255, 107, 157, 0.12);
  background: var(--color-bg-card);
  color: var(--color-text-dim);
  transition: all 0.2s;
}

.day-tab:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.day-tab.active {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
}

.day-editor {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
}

.anchor-section {
  margin-bottom: 20px;
}

.anchor-section:last-child {
  margin-bottom: 0;
}

.anchor-title {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.08);
}

.anchor-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anchor-item-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.item-label-input {
  flex: 1;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.1);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.88rem;
  font-family: 'Quicksand', sans-serif;
  transition: border-color 0.2s;
}

.item-label-input:focus {
  outline: none;
  border-color: var(--color-primary-light);
}

.btn-remove-item {
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
  flex-shrink: 0;
}

.btn-remove-item:hover {
  background: rgba(239, 71, 111, 0.1);
  border-color: var(--color-danger);
}

.btn-add-item {
  align-self: flex-start;
  background: none;
  border: 1.5px dashed rgba(255, 107, 157, 0.25);
  color: var(--color-primary);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 0.82rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: rgba(255, 107, 157, 0.06);
  border-color: var(--color-primary);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  cursor: pointer;
}

.toggle-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 12px;
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

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-save {
  background: var(--gradient-primary);
  color: white;
}

.btn-cancel {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  box-shadow: none;
}

.btn-cancel:hover {
  border-color: rgba(255, 107, 157, 0.3);
  box-shadow: none;
  transform: none;
}

.dim { color: var(--color-text-dim); }
.loading { text-align: center; padding: 40px; color: var(--color-text-dim); }
</style>
