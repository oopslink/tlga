<template>
  <view class="container">
    <view class="page-header">
      <text class="page-title">📚 思维档案</text>
      <text class="dim">记录每一次思维的闪光时刻</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        :value="searchKeyword"
        @input="searchKeyword = $event.detail.value"
        placeholder="🔍 搜索关键词..."
      />
    </view>

    <!-- 类型筛选 -->
    <view class="filter-bar">
      <view
        class="filter-btn"
        :class="{ active: filterType === null }"
        @click="filterType = null"
      ><text>全部</text></view>
      <view
        v-for="rt in reflectionTypes"
        :key="rt.type"
        class="filter-btn"
        :class="{ active: filterType === rt.type }"
        @click="filterType = rt.type"
      ><text>{{ rt.icon }} {{ rt.label }}</text></view>
    </view>

    <!-- 日期范围 -->
    <view class="date-range-bar">
      <text class="range-label">日期范围：</text>
      <picker mode="date" :value="dateFrom" @change="dateFrom = $event.detail.value">
        <view class="date-input">
          <text>{{ dateFrom || '开始日期' }}</text>
        </view>
      </picker>
      <text class="range-sep">至</text>
      <picker mode="date" :value="dateTo" @change="dateTo = $event.detail.value">
        <view class="date-input">
          <text>{{ dateTo || '结束日期' }}</text>
        </view>
      </picker>
      <view v-if="dateFrom || dateTo" class="btn-clear-range" @click="clearDateRange">
        <text>清除</text>
      </view>
    </view>

    <!-- 统计摘要 -->
    <view class="stats-row" v-if="archiveStore.entries.length > 0">
      <text class="stat-chip">共 {{ filteredEntries.length }} 条</text>
      <text class="stat-chip stat-discovery">💡 发现时刻 {{ countByType('discovery') }}</text>
      <text class="stat-chip stat-question">❓ 开放问题 {{ countByType('open-question') }}</text>
      <text class="stat-chip stat-method">📝 方法日志 {{ countByType('method-log') }}</text>
    </view>

    <view v-if="archiveStore.loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="filteredEntries.length === 0" class="empty-card">
      <text class="dim">{{ archiveStore.entries.length === 0 ? '暂无思维档案记录' : '没有匹配的结果' }}</text>
    </view>

    <template v-else>
      <!-- 按周分组 -->
      <view v-for="group in groupedEntries" :key="group.weekId" class="week-group">
        <view class="week-label-row">
          <text class="week-label-text">{{ group.weekId }}</text>
          <text class="week-count">{{ group.entries.length }} 条</text>
        </view>
        <view v-for="entry in group.entries" :key="entry.id" class="archive-card">
          <view class="archive-header">
            <text class="entry-icon">{{ getIcon(entry.type) }}</text>
            <view class="entry-meta">
              <text class="entry-type-label">{{ getLabel(entry.type) }}</text>
              <text class="entry-date dim">{{ formatDateCN(entry.date) }}</text>
            </view>
            <text class="gold entry-gold">+{{ entry.goldEarned }} 金</text>
          </view>
          <view v-if="entry.methodLog" class="method-log-view">
            <text>问题：{{ entry.methodLog.problem }}</text>
            <text>方法：{{ entry.methodLog.method }}</text>
            <text>原理：{{ entry.methodLog.principle }}</text>
          </view>
          <text v-else class="entry-content">{{ entry.content }}</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more-row">
        <view class="btn-load-more" @click="loadMoreWeeks" :class="{ disabled: archiveStore.loading }">
          <text>{{ archiveStore.loading ? '加载中...' : `加载更早的记录（当前已加载 ${loadedWeeksCount} 周）` }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
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

onLoad(async () => {
  const weekIds: string[] = []
  for (let i = 0; i < loadedWeeksCount.value; i++) {
    weekIds.push(getWeekIdFromOffset(i))
  }
  await archiveStore.loadAll([...new Set(weekIds)])
})
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 4px;
}

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
  font-size: 28rpx;
  box-sizing: border-box;
}

.date-range-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.range-label {
  font-size: 26rpx;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.range-sep {
  font-size: 26rpx;
  color: var(--color-text-dim);
}

.date-input {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 26rpx;
}

.btn-clear-range {
  border: 1.5px solid rgba(239, 71, 111, 0.2);
  color: var(--color-danger);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 24rpx;
  font-weight: 600;
}

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
  font-size: 24rpx;
  font-weight: 600;
  color: var(--color-text-dim);
}

.stat-discovery { border-color: rgba(255, 182, 39, 0.2); color: var(--color-gold-dark); }
.stat-question  { border-color: rgba(94, 174, 255, 0.2); color: var(--color-xp); }
.stat-method    { border-color: rgba(6, 214, 160, 0.2);  color: var(--color-success); }

.week-group {
  margin-bottom: 24px;
}

.week-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 107, 157, 0.1);
}

.week-label-text {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-text-dim);
}

.week-count {
  font-size: 24rpx;
  color: var(--color-text-dim);
  font-weight: 600;
}

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
  font-size: 26rpx;
  font-weight: 600;
  display: inline-block;
}

.btn-load-more.disabled {
  opacity: 0.5;
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
  font-size: 28rpx;
  font-weight: 600;
}

.filter-btn.active {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.archive-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(94, 174, 255, 0.12);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
}

.archive-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.entry-icon {
  font-size: 36rpx;
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
  font-size: 30rpx;
}

.entry-date {
  font-size: 24rpx;
}

.entry-gold {
  font-size: 30rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.method-log-view text {
  display: block;
  margin: 4px 0;
  font-size: 28rpx;
}

.entry-content {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--color-text);
}

.gold {
  color: var(--color-gold);
  font-weight: 700;
}

.dim { color: var(--color-text-dim); }

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-dim);
}

.disabled {
  opacity: 0.5;
}
</style>
