<template>
  <div class="container">
    <h1>仪表盘</h1>

    <!-- 玩家状态 -->
    <div class="card" v-if="playerStore.player">
      <h2>{{ playerStore.player.name }}</h2>
      <div class="stats-row">
        <div class="stat-box"><span>金币</span><span class="stat-value gold">{{ playerStore.player.gold }}</span></div>
        <div class="stat-box"><span>经验值</span><span class="stat-value xp">{{ playerStore.player.xp }}</span></div>
      </div>
    </div>

    <!-- 本周计划概览 -->
    <div class="card">
      <h2>本周计划</h2>
      <div v-if="planStore.loading" class="loading">加载中...</div>
      <div v-else-if="!planStore.plan || planStore.plan.dailyPlans.every(d => d.tasks.length === 0)">
        <p class="dim">还没有创建本周计划</p>
        <router-link to="/plan"><button class="button" style="margin-top:12px">创建周计划</button></router-link>
      </div>
      <div v-else>
        <span class="status-badge" :class="planStore.plan.status">{{ planStatusText }}</span>
        <div class="week-grid">
          <div v-for="dp in planStore.plan.dailyPlans" :key="dp.date" class="week-day-cell" :class="dayClass(dp.date)">
            <div class="day-label">{{ shortDate(dp.date) }}</div>
            <div class="day-count" v-if="dp.tasks.length">{{ dp.tasks.length }} 项任务</div>
            <div class="day-count dim" v-else>无</div>
            <div v-if="sheetMap[dp.date]" class="day-status">
              <span class="status-dot" :class="sheetMap[dp.date].status"></span>
              {{ sheetStatusText(sheetMap[dp.date].status) }}
              <span v-if="sheetMap[dp.date].settled" class="gold"> +{{ sheetMap[dp.date].totalGold }}</span>
            </div>
          </div>
        </div>
        <div v-if="!planStore.isActive" style="margin-top:12px">
          <router-link to="/plan"><button class="button">编辑周计划</button></router-link>
        </div>
      </div>
    </div>

    <!-- 待办事项 -->
    <div class="card">
      <h2>待办提醒</h2>
      <div v-if="pendingSheets.length" class="todo-list">
        <router-link v-for="s in pendingSheets" :key="s.date" :to="`/progress/${s.date}`" class="todo-item">
          <span>📝 {{ formatDate(s.date) }} 进度单待填写</span>
        </router-link>
      </div>
      <div v-if="submittedSheets.length" class="todo-list">
        <router-link v-for="s in submittedSheets" :key="s.date" :to="`/approve/${s.date}`" class="todo-item approve">
          <span>🔍 {{ formatDate(s.date) }} 进度单待审批</span>
        </router-link>
      </div>
      <p v-if="!pendingSheets.length && !submittedSheets.length" class="dim">暂无待办事项</p>
    </div>

    <!-- 本周积分汇总 -->
    <div class="card" v-if="approvedSheets.length">
      <h2>本周已结算</h2>
      <div class="stats-row">
        <div class="stat-box"><span>已结算天数</span><span class="stat-value">{{ approvedSheets.length }}</span></div>
        <div class="stat-box"><span>周金币</span><span class="stat-value gold">{{ weekGold }}</span></div>
        <div class="stat-box"><span>周经验</span><span class="stat-value xp">{{ weekXp }}</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/player.store'
import { usePlanStore } from '@/stores/plan.store'
import { useProgressStore } from '@/stores/progress.store'
import type { DailyProgressSheet } from '@/types/tasks'
import { formatDateCN, getWeekDates, currentWeek, today } from '@/utils/date'

const playerStore = usePlayerStore()
const planStore = usePlanStore()
const progressStore = useProgressStore()

const sheetMap = ref<Record<string, DailyProgressSheet>>({})

const planStatusText = computed(() => {
  const m: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return m[planStore.plan?.status ?? ''] ?? ''
})

const pendingSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'pending'))
const submittedSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'submitted'))
const approvedSheets = computed(() => progressStore.weekSheets.filter(s => s.status === 'approved'))

const weekGold = computed(() => approvedSheets.value.reduce((s, sh) => s + sh.totalGold, 0))
const weekXp = computed(() => approvedSheets.value.reduce((s, sh) => s + sh.totalXp, 0))

function shortDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()} ${days[d.getDay()]}`
}

function formatDate(d: string) { return formatDateCN(d) }

function dayClass(date: string) {
  return date === today() ? 'today' : ''
}

function sheetStatusText(status: string) {
  const m: Record<string, string> = { pending: '待填写', submitted: '已提交', approved: '已审批', rejected: '已驳回' }
  return m[status] ?? ''
}

onMounted(async () => {
  const wk = currentWeek()
  await planStore.loadWeek(wk)
  const dates = getWeekDates(wk)
  await progressStore.loadWeekSheets(wk, dates)
  const map: Record<string, DailyProgressSheet> = {}
  for (const s of progressStore.weekSheets) map[s.date] = s
  sheetMap.value = map
})
</script>

<style scoped>
.stats-row { display:flex; gap:12px; flex-wrap:wrap; }
.stats-row .stat-box { flex:1; min-width:120px; }
.week-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-top:16px; }
.week-day-cell { background:var(--color-bg); border-radius:8px; padding:12px 8px; text-align:center; }
.week-day-cell.today { border:2px solid var(--color-primary); }
.day-label { font-weight:700; margin-bottom:4px; }
.day-count { font-size:13px; }
.day-status { font-size:12px; margin-top:4px; }
.status-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:4px; }
.status-dot.pending { background:var(--color-text-dim); }
.status-dot.submitted { background:var(--color-warning); }
.status-dot.approved { background:var(--color-success); }
.status-dot.rejected { background:var(--color-primary); }
.todo-list { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
.todo-item { display:block; padding:12px 16px; background:var(--color-bg); border-radius:8px; color:var(--color-text); text-decoration:none; transition:background .2s; }
.todo-item:hover { background:var(--color-bg-lighter); }
.todo-item.approve { border-left:3px solid var(--color-warning); }
.dim { color:var(--color-text-dim); }
</style>
