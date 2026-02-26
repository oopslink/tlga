<template>
  <div class="container">
    <div class="page-header">
      <h1>📚 思维档案</h1>
      <p class="dim">记录每一次思维的闪光时刻</p>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        class="search-input"
        v-model="searchKeyword"
        placeholder="🔍 搜索关键词..."
        clearable
      />
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

    <!-- 日期范围 -->
    <div class="date-range-bar">
      <span class="range-label">日期范围：</span>
      <input type="date" class="date-input" v-model="dateFrom" />
      <span class="range-sep">至</span>
      <input type="date" class="date-input" v-model="dateTo" />
      <button v-if="dateFrom || dateTo" class="btn-clear-range" @click="clearDateRange">清除</button>
    </div>

    <!-- 统计摘要 -->
    <div class="stats-row" v-if="archiveStore.entries.length > 0">
      <span class="stat-chip">共 {{ filteredEntries.length }} 条</span>
      <span class="stat-chip stat-discovery">💡 发现时刻 {{ countByType('discovery') }}</span>
      <span class="stat-chip stat-question">❓ 开放问题 {{ countByType('open-question') }}</span>
      <span class="stat-chip stat-method">📝 方法日志 {{ countByType('method-log') }}</span>
    </div>

    <div v-if="archiveStore.loading" class="loading">加载中...</div>

    <div v-else-if="filteredEntries.length === 0" class="empty-card">
      <p class="dim">{{ archiveStore.entries.length === 0 ? '暂无思维档案记录' : '没有匹配的结果' }}</p>
    </div>

    <template v-else>
      <!-- 按周分组 -->
      <div v-for="group in groupedEntries" :key="group.weekId" class="week-group">
        <h3 class="week-label">
          {{ group.weekId }}
          <span class="week-count">{{ group.entries.length }} 条</span>
        </h3>
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
            <p><strong>问题：</strong><span v-html="highlight(entry.methodLog.problem)"></span></p>
            <p><strong>方法：</strong><span v-html="highlight(entry.methodLog.method)"></span></p>
            <p><strong>原理：</strong><span v-html="highlight(entry.methodLog.principle)"></span></p>
          </div>
          <p v-else class="entry-content" v-html="highlight(entry.content)"></p>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more-row">
        <button class="btn-load-more" @click="loadMoreWeeks" :disabled="archiveStore.loading">
          {{ archiveStore.loading ? '加载中...' : `加载更早的记录（当前已加载 ${loadedWeeksCount} 周）` }}
        </button>
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
import { formatDateCN } from '@/utils/date'

const archiveStore = useThinkingArchiveStore()

const filterType = ref<ReflectionType | null>(null)
const searchKeyword = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const loadedWeeksCount = ref(8)

const reflectionTypes = [
  { type: 'discovery' as ReflectionType, icon: '💡', label: '发现时刻' },
  { type: 'open-question' as ReflectionType, icon: '❓', label: '开放问题' },
  { type: 'method-log' as ReflectionType, icon: '📝', label: '方法日志' },
]

function getIcon(type: ReflectionType) { return REFLECTION_TYPE_ICONS[type] }
function getLabel(type: ReflectionType) { return REFLECTION_TYPE_LABELS[type] }

function clearDateRange() {
  dateFrom.value = ''
  dateTo.value = ''
}

function getWeekIdFromOffset(offset: number): string {
  const now = new Date()
  const d = new Date(now)
  d.setDate(d.getDate() - offset * 7)
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function matchesSearch(entry: ThinkingArchiveEntry): boolean {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return true
  const text = [
    entry.content,
    entry.methodLog?.problem,
    entry.methodLog?.method,
    entry.methodLog?.principle,
  ].filter(Boolean).join(' ').toLowerCase()
  return text.includes(kw)
}

function highlight(text: string): string {
  const kw = searchKeyword.value.trim()
  if (!kw || !text) return text
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'gi'), m => `<mark class="hl">${m}</mark>`)
}

const filteredEntries = computed(() => {
  return archiveStore.entries.filter(entry => {
    if (filterType.value && entry.type !== filterType.value) return false
    if (dateFrom.value && entry.date < dateFrom.value) return false
    if (dateTo.value && entry.date > dateTo.value) return false
    if (!matchesSearch(entry)) return false
    return true
  })
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

function countByType(type: ReflectionType) {
  return filteredEntries.value.filter(e => e.type === type).length
}

async function loadMoreWeeks() {
  const newCount = loadedWeeksCount.value + 8
  const weekIds: string[] = []
  for (let i = loadedWeeksCount.value; i < newCount; i++) {
    weekIds.push(getWeekIdFromOffset(i))
  }
  await archiveStore.loadAll([...new Set(weekIds)])
  loadedWeeksCount.value = newCount
}

onMounted(async () => {
  const weekIds: string[] = []
  for (let i = 0; i < loadedWeeksCount.value; i++) {
    weekIds.push(getWeekIdFromOffset(i))
  }
  await archiveStore.loadAll([...new Set(weekIds)])
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

/* ── 搜索 ── */
.search-bar {
  margin-bottom: 14px;
}

.search-input {
  width: 100%;
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid rgba(255, 107, 157, 0.12);
  border-radius: 14px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-light);
}

/* ── 日期范围 ── */
.date-range-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.range-label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.range-sep {
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.date-input {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.85rem;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary-light);
}

.btn-clear-range {
  background: none;
  border: 1.5px solid rgba(239, 71, 111, 0.2);
  color: var(--color-danger);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-range:hover {
  background: rgba(239, 71, 111, 0.08);
}

/* ── 统计摘要 ── */
.stats-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.stat-chip {
  background: var(--color-bg-card);
  border: 1.5px solid rgba(255, 107, 157, 0.1);
  border-radius: 10px;
  padding: 4px 12px;
  font-size: 0.8rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  color: var(--color-text-dim);
}

.stat-discovery { border-color: rgba(255, 182, 39, 0.2); color: var(--color-gold-dark); }
.stat-question  { border-color: rgba(94, 174, 255, 0.2); color: var(--color-xp); }
.stat-method    { border-color: rgba(6, 214, 160, 0.2);  color: var(--color-success); }

/* ── 周分组标签 ── */
.week-count {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-left: 8px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
}

/* ── 加载更多 ── */
.load-more-row {
  text-align: center;
  padding: 16px 0 8px;
}

.btn-load-more {
  background: var(--color-bg-card);
  color: var(--color-text-dim);
  border: 2px dashed rgba(255, 107, 157, 0.15);
  border-radius: 14px;
  padding: 10px 24px;
  font-size: 0.88rem;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.btn-load-more:hover:not(:disabled) {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 关键词高亮 ── */
:deep(.hl) {
  background: rgba(255, 182, 39, 0.3);
  color: var(--color-gold-dark);
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 700;
}

.empty-card {
  background: var(--color-bg-card);
  border: 2px dashed rgba(255, 107, 157, 0.1);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
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
