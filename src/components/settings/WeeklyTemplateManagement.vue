<template>
  <view>
    <view v-if="store.loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 模板列表视图 -->
      <view v-if="editingId === null">
        <view class="header-row">
          <view>
            <text class="header-bold">周计划框架模板</text>
            <text class="page-desc">每周自动导入，锚点项不可删除，可填写具体内容</text>
          </view>
          <view class="btn-icon btn-icon-success" @click="handleNew">
            <text>➕</text>
          </view>
        </view>

        <view class="weekly-tpl-list">
          <view
            v-for="tpl in store.templates"
            :key="tpl.id"
            class="weekly-tpl-card"
            :class="{ 'is-default': tpl.isDefault }"
          >
            <view class="tpl-card-header">
              <view class="tpl-card-left">
                <text class="tpl-name">{{ tpl.name }}</text>
                <text v-if="tpl.isDefault" class="default-badge">默认</text>
              </view>
              <view class="tpl-card-actions">
                <view class="btn-icon btn-icon-sm" @click="handleEdit(tpl.id)"><text>✏️</text></view>
                <view
                  v-if="!tpl.isDefault"
                  class="btn-icon btn-icon-sm"
                  @click="handleSetDefault(tpl.id)"
                ><text>⭐</text></view>
                <view
                  v-if="!tpl.isDefault"
                  class="btn-icon btn-icon-danger btn-icon-sm"
                  @click="handleDelete(tpl.id, tpl.name)"
                ><text>🗑️</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 编辑视图 -->
      <view v-else>
        <view class="edit-header">
          <view class="btn-back" @click="editingId = null"><text>← 返回</text></view>
          <input
            class="tpl-name-input"
            :value="editingName"
            @input="editingName = $event.detail.value"
            placeholder="模板名称"
          />
        </view>

        <view class="day-tabs">
          <view
            v-for="(day, idx) in WEEKDAYS"
            :key="day.key"
            class="day-tab"
            :class="{ active: editingDay === idx }"
            @click="editingDay = idx"
          ><text>{{ day.label }}</text></view>
        </view>

        <view class="day-editor" v-if="currentDayConfig">
          <view class="anchor-section">
            <text class="anchor-title">🔢 锚点一：数学</text>
            <view class="anchor-items">
              <view v-for="(item, i) in currentDayConfig.mathItems" :key="item.id" class="anchor-item-row">
                <input class="item-label-input input" :value="item.label" @input="item.label = $event.detail.value" placeholder="任务描述" />
                <view class="btn-icon btn-icon-danger btn-icon-sm" @click="removeMathItem(i)"><text>🗑️</text></view>
              </view>
              <view class="btn-add-item" @click="addMathItem"><text>+ 添加数学项目</text></view>
            </view>
          </view>

          <view class="anchor-section">
            <text class="anchor-title">🌍 锚点二：语言</text>
            <view class="anchor-items">
              <view v-for="(item, i) in currentDayConfig.languageItems" :key="item.id" class="anchor-item-row">
                <input class="item-label-input input" :value="item.label" @input="item.label = $event.detail.value" placeholder="任务描述" />
                <view class="btn-icon btn-icon-danger btn-icon-sm" @click="removeLanguageItem(i)"><text>🗑️</text></view>
              </view>
              <view class="btn-add-item" @click="addLanguageItem"><text>+ 添加语言项目</text></view>
            </view>
          </view>

          <view class="anchor-section">
            <text class="anchor-title">💡 锚点三：反思与创新</text>
            <view class="toggle-row">
              <switch :checked="currentDayConfig.reflectionEnabled" @change="currentDayConfig.reflectionEnabled = $event.detail.value" />
              <text>启用（三选一填写）</text>
            </view>
          </view>
        </view>

        <view class="edit-actions">
          <view class="button" @click="handleSave"><text>💾 保存模板</text></view>
          <view class="button btn-secondary" @click="editingId = null"><text>取消</text></view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
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

onLoad(() => store.load())
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-bold {
  font-size: 30rpx;
  color: var(--color-text);
  display: block;
  margin-bottom: 2px;
  font-weight: 700;
}

.page-desc {
  display: block;
  color: var(--color-text-dim);
  font-size: 26rpx;
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
  font-size: 28rpx;
}

.default-badge {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.25));
  color: var(--color-success);
  border: 1px solid rgba(6, 214, 160, 0.3);
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 22rpx;
  font-weight: 700;
}

.tpl-card-actions {
  display: flex;
  gap: 4px;
}

/* edit view */
.edit-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-back {
  color: var(--color-text-dim);
  font-size: 28rpx;
  white-space: nowrap;
}

.tpl-name-input {
  flex: 1;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.15);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 30rpx;
  font-weight: 700;
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
  font-size: 26rpx;
  font-weight: 700;
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  background: var(--color-bg-elevated);
  color: var(--color-text-dim);
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
  display: block;
  font-weight: 700;
  font-size: 28rpx;
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
  font-size: 26rpx;
}

.btn-add-item {
  align-self: flex-start;
  border: 1.5px dashed rgba(255, 107, 157, 0.2);
  color: var(--color-primary);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 24rpx;
  font-weight: 600;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 28rpx;
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
  font-size: 28rpx;
}
</style>
