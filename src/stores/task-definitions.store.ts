import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TaskDefinition, TaskCategory } from '@/types/tasks'
import { TASK_DEFINITIONS } from '@/types/tasks'

const STORAGE_KEY = 'custom_tasks'

export const useTaskDefinitionsStore = defineStore('taskDefinitions', () => {
  const customTasks = ref<TaskDefinition[]>([])
  const loaded = ref(false)

  // 获取所有任务（内置 + 自定义）
  function getAllTasks(): TaskDefinition[] {
    return [...TASK_DEFINITIONS, ...customTasks.value]
  }

  // 获取自定义任务
  function getCustomTasks(): TaskDefinition[] {
    return customTasks.value
  }

  // 添加任务
  function addTask(task: TaskDefinition) {
    customTasks.value.push(task)
    save()
  }

  // 更新任务
  function updateTask(taskId: string, updates: Partial<TaskDefinition>) {
    const index = customTasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      customTasks.value[index] = { ...customTasks.value[index], ...updates }
      save()
    }
  }

  // 删除任务
  function deleteTask(taskId: string) {
    const index = customTasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      customTasks.value.splice(index, 1)
      save()
    }
  }

  // 检查任务ID是否已存在
  function taskIdExists(taskId: string): boolean {
    return getAllTasks().some(t => t.id === taskId)
  }

  // 生成唯一ID
  function generateTaskId(baseName: string): string {
    let id = baseName.toLowerCase().replace(/\s+/g, '-')
    let counter = 1
    while (taskIdExists(id)) {
      id = `${baseName.toLowerCase().replace(/\s+/g, '-')}-${counter}`
      counter++
    }
    return id
  }

  // 保存到 localStorage
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTasks.value))
    } catch (err) {
      console.error('Failed to save custom tasks:', err)
    }
  }

  // 从 localStorage 加载
  function load() {
    if (loaded.value) return
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        customTasks.value = JSON.parse(data)
      }
      loaded.value = true
    } catch (err) {
      console.error('Failed to load custom tasks:', err)
      customTasks.value = []
      loaded.value = true
    }
  }

  return {
    customTasks,
    getAllTasks,
    getCustomTasks,
    addTask,
    updateTask,
    deleteTask,
    taskIdExists,
    generateTaskId,
    load,
  }
})
