import { ref } from 'vue'
import type { DailyTemplate, PlannedTaskItem } from '@/types/tasks'

const STORAGE_KEY = 'daily_templates'

const templates = ref<DailyTemplate[]>([])
let loaded = false

export function useTemplates() {
  function load() {
    if (loaded) return
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) templates.value = JSON.parse(data)
      loaded = true
    } catch { templates.value = []; loaded = true }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  }

  function addTemplate(name: string, tasks: PlannedTaskItem[], description = ''): DailyTemplate {
    const tpl: DailyTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      description,
      tasks: JSON.parse(JSON.stringify(tasks)),
      createdAt: new Date().toISOString(),
    }
    templates.value.push(tpl)
    save()
    return tpl
  }

  function updateTemplate(id: string, updates: Partial<Pick<DailyTemplate, 'name' | 'description' | 'tasks'>>) {
    const tpl = templates.value.find(t => t.id === id)
    if (tpl) {
      if (updates.name !== undefined) tpl.name = updates.name
      if (updates.description !== undefined) tpl.description = updates.description
      if (updates.tasks !== undefined) tpl.tasks = structuredClone(updates.tasks)
      save()
    }
  }

  function deleteTemplate(id: string) {
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      templates.value.splice(idx, 1)
      save()
    }
  }

  function getTemplate(id: string): DailyTemplate | undefined {
    return templates.value.find(t => t.id === id)
  }

  return { templates, load, addTemplate, updateTemplate, deleteTemplate, getTemplate }
}
