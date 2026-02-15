<template>
  <div>
    <p class="page-desc">查看往期学习记录</p>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <!-- 本周卡片 -->
      <div v-if="currentWeekSummary" class="week-card current-week" @click="goToWeek(currentWeekId)">
        <div class="week-card-header">
          <div class="week-title">
            <span class="week-label">本周</span>
            <h3>{{ formatWeekCN(currentWeekId) }}</h3>
          </div>
          <div class="week-status">
            <span class="status-badge in-progress">进行中</span>
          </div>
        </div>
        <div class="week-card-content">
          <div class="week-stats">
            <div class="stat-item">
              <span class="stat-icon">✅</span>
              <div class="stat-content">
                <span class="stat-label">完成天数</span>
                <span class="stat-value">{{ currentWeekSummary.completedDays }}/7</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">💰</span>
              <div class="stat-content">
                <span class="stat-label">总金币</span>
                <span class="stat-value gold">{{ currentWeekSummary.totalGold }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">✨</span>
              <div class="stat-content">
                <span class="stat-label">总经验</span>
                <span class="stat-value xp">{{ currentWeekSummary.totalXp }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📋</span>
              <div class="stat-content">
                <span class="stat-label">完成任务</span>
                <span class="stat-value">{{ currentWeekSummary.totalTasks }}</span>
              </div>
            </div>
          </div>
          <div class="week-date-range">{{ getWeekRangeCN(currentWeekId) }}</div>
        </div>
        <div class="week-card-footer">
          <span class="view-link">查看详情 →</span>
        </div>
      </div>

      <!-- 历史周卡片列表 -->
      <div class="history-section">
        <h2>往期记录</h2>
        <div v-if="historyWeeks.length === 0" class="empty-state">
          <p class="dim">暂无历史记录</p>
        </div>
        <div v-else class="weeks-grid">
          <div
            v-for="week in historyWeeks"
            :key="week.weekId"
            class="week-card"
            @click="goToWeek(week.weekId)"
          >
            <div class="week-card-header">
              <div class="week-title">
                <h3>{{ formatWeekCN(week.weekId) }}</h3>
              </div>
              <div class="week-status">
                <span class="status-badge completed">已完成</span>
              </div>
            </div>
            <div class="week-card-content">
              <div class="week-stats-compact">
                <div class="stat-compact">
                  <span class="stat-icon-sm">✅</span>
                  <span class="stat-text">{{ week.summary.completedDays }}/7天</span>
                </div>
                <div class="stat-compact">
                  <span class="stat-icon-sm">💰</span>
                  <span class="stat-text gold">{{ week.summary.totalGold }}</span>
                </div>
                <div class="stat-compact">
                  <span class="stat-icon-sm">✨</span>
                  <span class="stat-text xp">{{ week.summary.totalXp }}</span>
                </div>
                <div class="stat-compact">
                  <span class="stat-icon-sm">📋</span>
                  <span class="stat-text">{{ week.summary.totalTasks }}项</span>
                </div>
              </div>
              <div class="week-date-range">{{ getWeekRangeCN(week.weekId) }}</div>
            </div>
            <div class="week-card-footer">
              <span class="view-link">查看详情 →</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress.store'
import {
  currentWeek,
  formatWeekCN,
  getWeekRangeCN,
  getWeekDates,
  getPreviousWeek,
} from '@/utils/date'

const router = useRouter()
const progressStore = useProgressStore()

const loading = ref(false)
const currentWeekId = currentWeek()
const currentWeekSummary = ref<any>(null)
const historyWeeks = ref<Array<{ weekId: string; summary: any }>>([])

async function loadData() {
  loading.value = true
  try {
    // 加载本周数据
    const currentDates = getWeekDates(currentWeekId)
    await progressStore.loadWeekSheets(currentWeekId, currentDates)

    const currentSheets = progressStore.weekSheets.filter(s => s.settled)
    if (currentSheets.length > 0) {
      currentWeekSummary.value = {
        completedDays: currentSheets.length,
        totalGold: currentSheets.reduce((sum, s) => sum + s.totalGold, 0),
        totalXp: currentSheets.reduce((sum, s) => sum + s.totalXp, 0),
        totalTasks: currentSheets.reduce((sum, s) => sum + s.tasks.filter(t => t.completed).length, 0),
      }
    }

    // 加载历史周（最近10周）
    const history: Array<{ weekId: string; summary: any }> = []
    let weekId = getPreviousWeek(currentWeekId)

    for (let i = 0; i < 10; i++) {
      const dates = getWeekDates(weekId)
      await progressStore.loadWeekSheets(weekId, dates)

      const sheets = progressStore.weekSheets.filter(s => s.settled)
      if (sheets.length > 0) {
        history.push({
          weekId,
          summary: {
            completedDays: sheets.length,
            totalGold: sheets.reduce((sum, s) => sum + s.totalGold, 0),
            totalXp: sheets.reduce((sum, s) => sum + s.totalXp, 0),
            totalTasks: sheets.reduce((sum, s) => sum + s.tasks.filter(t => t.completed).length, 0),
          },
        })
      }

      weekId = getPreviousWeek(weekId)
    }

    historyWeeks.value = history
  } finally {
    loading.value = false
  }
}

function goToWeek(weekId: string) {
  router.push(`/history/${weekId}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-desc {
  color: var(--color-text-dim);
  margin-bottom: 32px;
  font-size: 1rem;
}

/* 本周卡片 - 大卡片 */
.week-card.current-week {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  margin-bottom: 32px;
  box-shadow: var(--shadow-lg);
}

.week-card.current-week .week-label {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  margin-right: 12px;
}

.week-card.current-week .stat-value,
.week-card.current-week .stat-label,
.week-card.current-week .week-date-range {
  color: var(--color-text-inverse);
}

.week-card.current-week .status-badge {
  background: rgba(255, 255, 255, 0.3);
  color: var(--color-text-inverse);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 周卡片通用样式 */
.week-card {
  background: var(--color-bg-card);
  border: 2px solid rgba(255, 107, 157, 0.08);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.week-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.week-card.current-week:hover {
  transform: translateY(-6px) scale(1.02);
}

.week-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.week-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-title h3 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Fredoka', sans-serif;
  white-space: nowrap;
}

.status-badge.in-progress {
  background: rgba(255, 168, 0, 0.2);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.status-badge.completed {
  background: rgba(6, 214, 160, 0.2);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.week-card-content {
  margin-bottom: 16px;
}

/* 本周大卡片统计 */
.week-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.stat-value {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
}

/* 历史周紧凑统计 */
.week-stats-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  font-size: 0.85rem;
}

.stat-icon-sm {
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-text {
  font-weight: 600;
  white-space: nowrap;
}

.week-date-range {
  font-size: 0.9rem;
  opacity: 0.7;
  text-align: center;
}

.week-card-footer {
  border-top: 2px solid rgba(255, 107, 157, 0.1);
  padding-top: 12px;
  text-align: center;
}

.week-card.current-week .week-card-footer {
  border-top-color: rgba(255, 255, 255, 0.3);
}

.view-link {
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-primary);
  transition: all 0.3s ease;
}

.week-card.current-week .view-link {
  color: var(--color-text-inverse);
}

.week-card:hover .view-link {
  transform: translateX(4px);
  display: inline-block;
}

/* 历史区块 */
.history-section {
  margin-top: 32px;
}

.history-section h2 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 20px;
}

.weeks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.weeks-grid .week-card {
  animation-delay: 0s;
}

.weeks-grid .week-card:nth-child(1) { animation-delay: 0.05s; }
.weeks-grid .week-card:nth-child(2) { animation-delay: 0.1s; }
.weeks-grid .week-card:nth-child(3) { animation-delay: 0.15s; }
.weeks-grid .week-card:nth-child(4) { animation-delay: 0.2s; }
.weeks-grid .week-card:nth-child(5) { animation-delay: 0.25s; }
.weeks-grid .week-card:nth-child(6) { animation-delay: 0.3s; }

.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: var(--color-bg-card);
  border-radius: 16px;
  border: 2px dashed rgba(255, 107, 157, 0.2);
}

.dim {
  color: var(--color-text-dim);
  font-style: italic;
}

/* 响应式 */
@media (max-width: 768px) {
  .week-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .weeks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
