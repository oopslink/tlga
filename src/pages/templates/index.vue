<template>
  <view class="container">
    <view class="page-header">
      <text class="page-title">📋 周计划模板</text>
      <text class="dim">管理每周自动导入的固定任务框架</text>
    </view>

    <view v-if="store.loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 模板列表 -->
      <view v-if="editingId === null">
        <view class="section-header">
          <text class="section-title">模板列表</text>
          <view class="btn-new" @click="handleNew"><text>+ 新建模板</text></view>
        </view>

        <view class="template-list">
          <view
            v-for="tpl in store.templates"
            :key="tpl.id"
            class="template-card"
            :class="{ 'is-default': tpl.isDefault }"
          >
            <view class="tpl-card-left">
              <text class="tpl-name">{{ tpl.name }}</text>
              <text v-if="tpl.isDefault" class="default-badge">默认</text>
              <text class="tpl-date dim">创建于 {{ formatDate(tpl.createdAt) }}</text>
            </view>
            <view class="tpl-card-actions">
              <view class="btn-sm btn-edit" @click="handleEdit(tpl.id)"><text>编辑</text></view>
              <view
                v-if="!tpl.isDefault"
                class="btn-sm btn-default"
                @click="handleSetDefault(tpl.id)"
              ><text>设为默认</text></view>
              <view
                v-if="!tpl.isDefault"
                class="btn-sm btn-danger"
                @click="handleDelete(tpl.id, tpl.name)"
              ><text>删除</text></view>
            </view>
          </view>
        </view>

        <view class="info-box">
          <text>💡 每周首次打开"本周计划"时，系统会自动从默认模板生成带框架的周计划草稿。</text>
          <text>🔒 由模板生成的任务项会标记为锁定，不可删除，但可填写具体内容备注。</text>
        </view>
      </view>

      <!-- 编辑模板 -->
      <view v-else>
        <view class="edit-header">
          <view class="btn-back" @click="editingId = null"><text>← 返回列表</text></view>
          <view class="edit-title-row">
            <input
              class="tpl-name-input"
              :value="editingName"
              @input="editingName = $event.detail.value"
              placeholder="模板名称"
            />
          </view>
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
              <view
                v-for="(item, i) in currentDayConfig.mathItems"
                :key="item.id"
                class="anchor-item-row"
              >
                <input
                  class="item-label-input"
                  :value="item.label"
                  @input="item.label = $event.detail.value"
                  placeholder="任务描述"
                />
                <view class="btn-remove-item" @click="removeMathItem(i)"><text>✕</text></view>
              </view>
              <view class="btn-add-item" @click="addMathItem"><text>+ 添加数学项目</text></view>
            </view>
          </view>

          <view class="anchor-section">
            <text class="anchor-title">🌍 锚点二：语言</text>
            <view class="anchor-items">
              <view
                v-for="(item, i) in currentDayConfig.languageItems"
                :key="item.id"
                class="anchor-item-row"
              >
                <input
                  class="item-label-input"
                  :value="item.label"
                  @input="item.label = $event.detail.value"
                  placeholder="任务描述"
                />
                <view class="btn-remove-item" @click="removeLanguageItem(i)"><text>✕</text></view>
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
          <view class="btn-action btn-save" @click="handleSave"><text>💾 保存模板</text></view>
          <view class="btn-action btn-cancel" @click="editingId = null"><text>取消</text></view>
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

onLoad(() => store.load())
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
}

.btn-new {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 9px 20px;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.template-card {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  gap: 12px;
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
  flex-wrap: wrap;
}

.tpl-name {
  font-weight: 700;
  font-size: 30rpx;
  color: var(--color-text);
}

.default-badge {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.25));
  color: var(--color-success);
  border: 1px solid rgba(6, 214, 160, 0.3);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.tpl-date {
  font-size: 24rpx;
}

.tpl-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 24rpx;
  font-weight: 700;
  border: none;
}

.btn-edit {
  background: rgba(94, 174, 255, 0.1);
  color: var(--color-xp);
  border: 1.5px solid rgba(94, 174, 255, 0.25);
}

.btn-default {
  background: rgba(6, 214, 160, 0.1);
  color: var(--color-success);
  border: 1.5px solid rgba(6, 214, 160, 0.25);
}

.btn-danger {
  background: rgba(239, 71, 111, 0.08);
  color: var(--color-danger);
  border: 1.5px solid rgba(239, 71, 111, 0.2);
}

.info-box {
  background: linear-gradient(135deg, rgba(94, 174, 255, 0.06), rgba(94, 174, 255, 0.1));
  border: 1.5px solid rgba(94, 174, 255, 0.2);
  border-radius: 14px;
  padding: 16px 20px;
}

.info-box text {
  display: block;
  margin: 4px 0;
  font-size: 26rpx;
  color: var(--color-text);
  line-height: 1.6;
}

.edit-header {
  margin-bottom: 20px;
}

.btn-back {
  color: var(--color-text-dim);
  font-size: 28rpx;
  margin-bottom: 12px;
}

.tpl-name-input {
  width: 100%;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 32rpx;
  font-weight: 700;
  box-sizing: border-box;
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
  font-size: 26rpx;
  font-weight: 700;
  border: 2px solid rgba(255, 107, 157, 0.12);
  background: var(--color-bg-card);
  color: var(--color-text-dim);
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
  display: block;
  font-weight: 700;
  font-size: 30rpx;
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
  font-size: 26rpx;
}

.btn-remove-item {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(239, 71, 111, 0.2);
  border-radius: 8px;
  color: var(--color-danger);
  font-size: 24rpx;
  flex-shrink: 0;
}

.btn-add-item {
  align-self: flex-start;
  border: 1.5px dashed rgba(255, 107, 157, 0.25);
  color: var(--color-primary);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 24rpx;
  font-weight: 600;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 28rpx;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.btn-action {
  padding: 11px 24px;
  border-radius: 14px;
  font-size: 28rpx;
  font-weight: 700;
  border: none;
  box-shadow: var(--shadow-sm);
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

.dim { color: var(--color-text-dim); }
.loading { text-align: center; padding: 40px; color: var(--color-text-dim); }
</style>
