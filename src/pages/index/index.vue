<template>
  <view class="container">
    <!-- 玩家状态 -->
    <view class="card" v-if="playerStore.player">
      <text class="card-title">{{ playerStore.player.name }}</text>
      <view class="stats-row">
        <view class="stat-box stat-gold"><text>金币</text><text class="stat-value gold">{{ playerStore.player.gold }}</text></view>
        <view class="stat-box stat-xp"><text>经验值</text><text class="stat-value xp">{{ playerStore.player.xp }}</text></view>
      </view>
    </view>

    <!-- 本周计划概览 -->
    <view class="card">
      <text class="card-title">本周计划</text>
      <view v-if="planStore.loading" class="loading"><text>加载中...</text></view>
      <view v-else-if="!planStore.plan || planStore.plan.dailyPlans.every(d => d.tasks.length === 0)">
        <text class="dim">还没有创建本周计划</text>
        <button class="button" style="margin-top:12px" @click="uni.switchTab({ url: '/pages/plan/index' })">创建周计划</button>
      </view>
      <view v-else>
        <text class="status-badge" :class="planStore.plan.status">{{ planStatusText }}</text>
        <view class="week-grid">
          <view v-for="dp in planStore.plan.dailyPlans" :key="dp.date" class="week-day-cell" :class="dayClass(dp.date)">
            <text class="day-weekday">{{ weekdayLabel(dp.date) }}</text>
            <text class="day-date">{{ monthDay(dp.date) }}</text>
            <view class="day-dot-row">
              <view class="day-dot" :class="{ 'day-dot-filled': dp.tasks.length > 0 }"></view>
            </view>
          </view>
        </view>
        <view v-if="!planStore.isActive" style="margin-top:12px">
          <button class="button" @click="uni.switchTab({ url: '/pages/plan/index' })">编辑周计划</button>
        </view>
      </view>
    </view>

    <!-- 待办事项 -->
    <view class="card">
      <text class="card-title">待办提醒</text>
      <view v-if="pendingSheets.length" class="todo-list">
        <view v-for="s in pendingSheets" :key="s.date" class="todo-item" @click="uni.switchTab({ url: '/pages/progress/index' })">
          <text>📝 {{ formatDate(s.date) }} 进度单待填写</text>
        </view>
      </view>
      <view v-if="submittedSheets.length" class="todo-list">
        <view v-for="s in submittedSheets" :key="s.date" class="todo-item approve" @click="uni.switchTab({ url: '/pages/approve/index' })">
          <text>🔍 {{ formatDate(s.date) }} 进度单待审批</text>
        </view>
      </view>
      <text v-if="!pendingSheets.length && !submittedSheets.length" class="dim">暂无待办事项</text>
    </view>

    <!-- 本周积分汇总 -->
    <view class="card" v-if="approvedSheets.length">
      <text class="card-title">本周已结算</text>
      <view class="stats-row">
        <view class="stat-box"><text>已结算天数</text><text class="stat-value">{{ approvedSheets.length }}</text></view>
        <view class="stat-box stat-gold"><text>周金币</text><text class="stat-value gold">{{ weekGold }}</text></view>
        <view class="stat-box stat-xp"><text>周经验</text><text class="stat-value xp">{{ weekXp }}</text></view>
      </view>
    </view>

    <!-- 思维档案 -->
    <view class="card">
      <view class="archive-header-row">
        <text class="card-title">📚 思维档案</text>
        <text class="view-all" @click="uni.navigateTo({ url: '/pages/thinking-archive/index' })">查看全部</text>
      </view>
      <view v-if="archiveStore.loading" class="loading"><text>加载中...</text></view>
      <view v-else-if="recentEntries.length === 0">
        <text class="dim">暂无反思记录，开始每日反思吧！</text>
      </view>
      <view v-else>
        <view v-for="entry in recentEntries" :key="entry.id" class="archive-entry">
          <text class="archive-icon">{{ getArchiveIcon(entry.type) }}</text>
          <view class="archive-content">
            <text class="archive-type">{{ getArchiveLabel(entry.type) }}</text>
            <text class="archive-date dim">{{ formatDate(entry.date) }}</text>
            <text class="archive-text">{{ entry.methodLog ? `问题：${entry.methodLog.problem}` : entry.content }}</text>
          </view>
          <text class="gold archive-gold">+{{ entry.goldEarned }} 金</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { usePlayerStore } from '@/stores/player.store'
import { usePlanStore } from '@/stores/plan.store'
import { useProgressStore } from '@/stores/progress.store'
import { useThinkingArchiveStore } from '@/stores/thinking-archive.store'
import type { DailyProgressSheet } from '@/types/tasks'
import type { ReflectionType } from '@/types/tasks'
import { REFLECTION_TYPE_LABELS, REFLECTION_TYPE_ICONS } from '@/engine/reflection-anchor'
import { formatDateCN, getWeekDates, currentWeek, today } from '@/utils/date'

const playerStore = usePlayerStore()
const planStore = usePlanStore()
const progressStore = useProgressStore()
const archiveStore = useThinkingArchiveStore()

const sheetMap = ref<Record<string, DailyProgressSheet>>({})

function getArchiveIcon(type: ReflectionType) { return REFLECTION_TYPE_ICONS[type] }
function getArchiveLabel(type: ReflectionType) { return REFLECTION_TYPE_LABELS[type] }

const recentEntries = computed(() =>
  [...archiveStore.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)
)

const planStatusText = computed(() => {
  const m: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return m[planStore.plan?.status ?? ''] ?? ''
})

const pendingSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'pending'))
const submittedSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'submitted'))
const approvedSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'approved'))

const weekGold = computed(() => approvedSheets.value.reduce((s, sh) => s + sh.totalGold, 0))
const weekXp = computed(() => approvedSheets.value.reduce((s, sh) => s + sh.totalXp, 0))

function weekdayLabel(date: string) {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[new Date(date + 'T00:00:00').getDay()]
}

function monthDay(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDate(d: string) { return formatDateCN(d) }

function dayClass(date: string) {
  return date === today() ? 'today' : ''
}

function sheetStatusText(status: string) {
  const m: Record<string, string> = { pending: '待填写', submitted: '已提交', approved: '已审批', rejected: '已驳回' }
  return m[status] ?? ''
}

onLoad(async () => {
  const wk = currentWeek()
  await planStore.loadWeek(wk)
  const dates = getWeekDates(wk)
  await progressStore.loadWeekSheets(wk, dates)
  const map: Record<string, DailyProgressSheet> = {}
  for (const s of progressStore.weekSheets) map[s.date] = s
  sheetMap.value = map
  await archiveStore.loadWeek(wk)
})
</script>

<style scoped>
.card-title { display: block; font-size: 18px; font-weight: 700; margin-bottom: 12px; color: var(--color-text); }
.stats-row { display:flex; gap:12px; flex-wrap:wrap; }
.stats-row .stat-box { flex:1; min-width:120px; }
.week-grid { display:flex; gap:8rpx; margin-top:16px; }
.week-day-cell { flex:1; background:var(--color-bg-card); border:2rpx solid rgba(255,107,157,0.08); border-radius:18rpx; padding:14rpx 4rpx; text-align:center; }
.week-day-cell.today { border-color:var(--color-gold); border-width:3rpx; }
.day-weekday { display:block; font-size:24rpx; font-weight:600; color:var(--color-text-dim); margin-bottom:4rpx; }
.day-date { display:block; font-size:26rpx; font-weight:700; color:var(--color-text); }
.day-dot-row { display:flex; justify-content:center; margin-top:8rpx; }
.day-dot { width:14rpx; height:14rpx; border-radius:50%; background:rgba(136,136,136,0.2); }
.day-dot-filled { background:var(--color-success); box-shadow:0 0 4rpx rgba(6,214,160,0.4); }
.todo-list { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
.todo-item { display:block; padding:12px 16px; background:var(--color-bg); border-radius:8px; color:var(--color-text); }
.todo-item.approve { border-left:3px solid var(--color-warning); }
.dim { color:var(--color-text-dim); }
.gold { color:var(--color-gold); font-weight:700; }
.archive-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.view-all { font-size:14px; color:var(--color-xp); font-weight:600; }
.archive-entry { display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--color-bg); border-radius:10px; margin-bottom:8px; }
.archive-icon { font-size:21px; flex-shrink:0; }
.archive-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.archive-type { font-weight:700; font-size:14px; }
.archive-date { font-size:13px; }
.archive-text { font-size:14px; color:var(--color-text-dim); overflow:hidden; }
.archive-gold { font-size:14px; flex-shrink:0; }
</style>
