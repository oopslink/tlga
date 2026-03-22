import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WeeklyTemplate, DayTemplateConfig, WeekdayKey } from '@/types/tasks'
import { storage } from '@/services/storage-factory'
import { DEFAULT_WEEKLY_TEMPLATE } from '@/data/default-weekly-template'

const STORAGE_PATH = 'weekly-templates.json'

export const useWeeklyTemplateStore = defineStore('weekly-template', () => {
  const templates = ref<WeeklyTemplate[]>([])
  const loading = ref(false)

  const defaultTemplate = computed(
    () => templates.value.find(t => t.isDefault) ?? templates.value[0] ?? DEFAULT_WEEKLY_TEMPLATE
  )

  async function load() {
    loading.value = true
    try {
      const data = await storage.read<WeeklyTemplate[]>(STORAGE_PATH)
      if (data && data.length > 0) {
        templates.value = data
      } else {
        // 首次使用：写入内置默认模板
        templates.value = [DEFAULT_WEEKLY_TEMPLATE]
        await save()
      }
    } finally {
      loading.value = false
    }
  }

  async function save() {
    await storage.write(STORAGE_PATH, templates.value)
  }

  function generateId() {
    return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  /** 从现有模板复制创建新模板 */
  function createFromTemplate(name: string, sourceTemplate?: WeeklyTemplate): WeeklyTemplate {
    const source = sourceTemplate ?? defaultTemplate.value
    const newTemplate: WeeklyTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(),
      name,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    return newTemplate
  }

  async function addTemplate(template: WeeklyTemplate) {
    templates.value.push(template)
    await save()
  }

  async function updateTemplate(id: string, changes: Partial<Omit<WeeklyTemplate, 'id' | 'createdAt'>>) {
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx < 0) return
    Object.assign(templates.value[idx], changes)
    await save()
  }

  async function updateDayConfig(id: string, day: WeekdayKey, config: DayTemplateConfig) {
    const tpl = templates.value.find(t => t.id === id)
    if (!tpl) return
    tpl.days[day] = config
    await save()
  }

  async function deleteTemplate(id: string) {
    const tpl = templates.value.find(t => t.id === id)
    if (!tpl || tpl.isDefault) return   // 不能删除默认模板
    templates.value = templates.value.filter(t => t.id !== id)
    await save()
  }

  async function setDefault(id: string) {
    for (const t of templates.value) {
      t.isDefault = t.id === id
    }
    await save()
  }

  return {
    templates,
    loading,
    defaultTemplate,
    load,
    save,
    createFromTemplate,
    addTemplate,
    updateTemplate,
    updateDayConfig,
    deleteTemplate,
    setDefault,
  }
})
