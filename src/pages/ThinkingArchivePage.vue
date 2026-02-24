<template>
  <div class="container">
    <div class="page-header">
      <h1>📚 思维档案</h1>
      <p class="dim">记录每一次思维的闪光时刻</p>
    </div>

    <!-- 类型筛选 -->
    <div class="filter-bar">
      <button
        class="filter-btn"
        :class="{ active: filterType === null }"
        @click="filterType = null"
      >全部</button>
      <button
        v-for="rt in reflectionTypes"
        :key="rt.type"
        class="filter-btn"
        :class="{ active: filterType === rt.type }"
        @click="filterType = rt.type"
      >{{ rt.icon }} {{ rt.label }}</button>
    </div>

    <div v-if="archiveStore.loading" class="loading">加载中...</div>

    <div v-else-if="filteredEntries.length === 0" class="card">
      <p class="dim">暂无思维档案记录</p>
    </div>

    <template v-else>
      <!-- 按周分组 -->
      <div v-for="group in groupedEntries" :key="group.weekId" class="week-group">
        <h3 class="week-label">{{ group.weekId }}</h3>
        <div v-for="entry in group.entries" :key="entry.id" class="archive-card">
          <div class="archive-header">
            <span class="entry-icon">{{ getIcon(entry.type) }}</span>
            <div class="entry-meta">
              <span class="entry-type-label">{{ getLabel(entry.type) }}</span>
              <span class="entry-date dim">{{ formatDateCN(entry.date) }}</span>
            </div>
            <span class="gold entry-gold">+{{ entry.goldEarned }} 金</span>
          </div>
          <div v-if="entry.methodLog" class="method-log-view">
            <p><strong>问题：</strong>{{ entry.methodLog.problem }}</p>
            <p><strong>方法：</strong>{{ entry.methodLog.method }}</p>
            <p><strong>原理：</strong>{{ entry.methodLog.principle }}</p>
          </div>
          <p v-else class="entry-content">{{ entry.content }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useThinkingArchiveStore } from '@/stores/thinking-archive.store'
import type { ReflectionType } from '@/types/tasks'
import type { ThinkingArchiveEntry } from '@/types'
import { REFLECTION_TYPE_LABELS, REFLECTION_TYPE_ICONS } from '@/engine/reflection-anchor'
import { formatDateCN, getWeekDates } from '@/utils/date'

const archiveStore = useThinkingArchiveStore()

const filterType = ref<ReflectionType | null>(null)

const reflectionTypes = [
  { type: 'discovery' as ReflectionType, icon: '💡', label: '发现时刻' },
  { type: 'open-question' as ReflectionType, icon: '❓', label: '开放问题' },
  { type: 'method-log' as ReflectionType, icon: '📝', label: '方法日志' },
]

function getIcon(type: ReflectionType) { return REFLECTION_TYPE_ICONS[type] }
function getLabel(type: ReflectionType) { return REFLECTION_TYPE_LABELS[type] }

const filteredEntries = computed(() => {
  if (!filterType.value) return archiveStore.entries
  return archiveStore.entries.filter(e => e.type === filterType.value)
})

const groupedEntries = computed(() => {
  const map = new Map<string, ThinkingArchiveEntry[]>()
  const sorted = [...filteredEntries.value].sort((a, b) => b.date.localeCompare(a.date))
  for (const entry of sorted) {
    if (!map.has(entry.weekId)) map.set(entry.weekId, [])
    map.get(entry.weekId)!.push(entry)
  }
  return Array.from(map.entries()).map(([weekId, entries]) => ({ weekId, entries }))
})

onMounted(async () => {
  // Load last 8 weeks
  const now = new Date()
  const weekIds: string[] = []
  for (let i = 0; i < 8; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    weekIds.push(`${year}-W${String(week).padStart(2, '0')}`)
  }
  const uniqueWeekIds = [...new Set(weekIds)]
  await archiveStore.loadAll(uniqueWeekIds)
})
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.8rem;
  margin: 0 0 4px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.15);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Fredoka', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
}

.filter-btn:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.week-group {
  margin-bottom: 24px;
}

.week-label {
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  color: var(--color-text-dim);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
}

.archive-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(94, 174, 255, 0.12);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  animation: slideUp 0.4s ease-out;
}

.archive-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(94, 174, 255, 0.3);
}

.archive-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.entry-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.entry-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-type-label {
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
}

.entry-date {
  font-size: 0.82rem;
}

.entry-gold {
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.method-log-view p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.entry-content {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text);
}

.gold {
  color: var(--color-gold);
  font-weight: 700;
}

.dim { color: var(--color-text-dim); }
</style>
