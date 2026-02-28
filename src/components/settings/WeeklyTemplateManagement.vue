<template>
  <div>
    <div v-if="store.loading" class="loading">加载中...</div>

    <template v-else>
      <!-- 模板列表视图 -->
      <div v-if="editingId === null">
        <div class="header-row">
          <div>
            <strong>周计划框架模板</strong>
            <p class="page-desc">每周自动导入，锚点项不可删除，可填写具体内容</p>
          </div>
          <button class="btn-icon btn-icon-success" @click="handleNew" title="新建模板">➕</button>
        </div>

        <div class="weekly-tpl-list">
          <div
            v-for="tpl in store.templates"
            :key="tpl.id"
            class="weekly-tpl-card"
            :class="{ 'is-default': tpl.isDefault }"
          >
            <div class="tpl-card-header">
              <div class="tpl-card-left">
                <span class="tpl-name">{{ tpl.name }}</span>
                <span v-if="tpl.isDefault" class="default-badge">默认</span>
              </div>
              <div class="tpl-card-actions">
                <button class="btn-icon btn-icon-sm" @click="handleEdit(tpl.id)" title="编辑">✏️</button>
                <button
                  v-if="!tpl.isDefault"
                  class="btn-icon btn-icon-sm"
                  @click="handleSetDefault(tpl.id)"
                  title="设为默认"
                >⭐</button>
                <button
                  v-if="!tpl.isDefault"
                  class="btn-icon btn-icon-danger btn-icon-sm"
                  @click="handleDelete(tpl.id, tpl.name)"
                  title="删除"
                >🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑视图 -->
      <div v-else>
        <div class="edit-header">
          <button class="btn-back" @click="editingId = null">← 返回</button>
          <input
            class="tpl-name-input"
            v-model="editingName"
            placeholder="模板名称"
          />
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
              <div v-for="(item, i) in currentDayConfig.mathItems" :key="item.id" class="anchor-item-row">
                <input class="item-label-input input" v-model="item.label" placeholder="任务描述" />
                <button class="btn-icon btn-icon-danger btn-icon-sm" @click="removeMathItem(i)">🗑️</button>
              </div>
              <button class="btn-add-item" @click="addMathItem">+ 添加数学项目</button>
            </div>
          </div>

          <div class="anchor-section">
            <div class="anchor-title">🌍 锚点二：语言</div>
            <div class="anchor-items">
              <div v-for="(item, i) in currentDayConfig.languageItems" :key="item.id" class="anchor-item-row">
                <input class="item-label-input input" v-model="item.label" placeholder="任务描述" />
                <button class="btn-icon btn-icon-danger btn-icon-sm" @click="removeLanguageItem(i)">🗑️</button>
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
          <button class="button" @click="handleSave">💾 保存模板</button>
          <button class="button btn-secondary" @click="editingId = null">取消</button>
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
  currentDayConfig.value?.mathItems.push({ id: generateItemId(), label: '' })
}
function removeMathItem(i: number) {
  currentDayConfig.value?.mathItems.splice(i, 1)
}
function addLanguageItem() {
  currentDayConfig.value?.languageItems.push({ id: generateItemId(), label: '' })
}
function removeLanguageItem(i: number) {
  currentDayConfig.value?.languageItems.splice(i, 1)
}

onMounted(() => store.load())
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-row strong {
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  color: var(--color-text);
  display: block;
  margin-bottom: 2px;
}

.page-desc {
  color: var(--color-text-dim);
  font-size: 0.85rem;
  margin: 0;
}

.weekly-tpl-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.weekly-tpl-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border: 1.5px solid rgba(255, 107, 157, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.weekly-tpl-card:hover {
  border-color: rgba(255, 107, 157, 0.18);
}

.weekly-tpl-card.is-default {
  border-color: rgba(6, 214, 160, 0.3);
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.04), rgba(6, 214, 160, 0.08));
}

.tpl-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.tpl-card-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tpl-name {
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
  font-size: 0.95rem;
}

.default-badge {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.25));
  color: var(--color-success);
  border: 1px solid rgba(6, 214, 160, 0.3);
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
}

.tpl-card-actions {
  display: flex;
  gap: 4px;
}

/* ── 编辑视图 ── */
.edit-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: color 0.2s;
}

.btn-back:hover { color: var(--color-primary); }

.tpl-name-input {
  flex: 1;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.15);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 1rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  transition: border-color 0.2s;
}

.tpl-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.day-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.day-tab {
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  background: var(--color-bg-elevated);
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
}

.day-editor {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.anchor-section {
  margin-bottom: 16px;
}

.anchor-section:last-child { margin-bottom: 0; }

.anchor-title {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 107, 157, 0.08);
}

.anchor-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.anchor-item-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.item-label-input {
  flex: 1;
  margin: 0;
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-add-item {
  align-self: flex-start;
  background: none;
  border: 1.5px dashed rgba(255, 107, 157, 0.2);
  color: var(--color-primary);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.8rem;
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
  gap: 8px;
  font-size: 0.88rem;
  cursor: pointer;
}

.toggle-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  background: var(--color-bg-elevated) !important;
  color: var(--color-text) !important;
  box-shadow: none !important;
}

.loading {
  color: var(--color-text-dim);
  padding: 16px 0;
  font-size: 0.9rem;
}
</style>
