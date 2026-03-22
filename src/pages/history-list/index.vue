<template>
  <view class="container">
    <text class="page-desc">查看往期学习记录</text>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <!-- 本周卡片 -->
      <view v-if="currentWeekSummary" class="week-card current-week" @click="goToWeek(currentWeekId)">
        <view class="week-card-header">
          <view class="week-title">
            <text class="week-label">本周</text>
            <text class="week-title-text">{{ formatWeekCN(currentWeekId) }}</text>
          </view>
          <view class="week-status">
            <text class="status-badge in-progress">进行中</text>
          </view>
        </view>
        <view class="week-card-content">
          <view class="week-stats">
            <view class="stat-item">
              <text class="stat-icon">✅</text>
              <view class="stat-content">
                <text class="stat-label">完成天数</text>
                <text class="stat-value">{{ currentWeekSummary.completedDays }}/7</text>
              </view>
            </view>
            <view class="stat-item">
              <text class="stat-icon">💰</text>
              <view class="stat-content">
                <text class="stat-label">总金币</text>
                <text class="stat-value gold">{{ currentWeekSummary.totalGold }}</text>
              </view>
            </view>
            <view class="stat-item">
              <text class="stat-icon">✨</text>
              <view class="stat-content">
                <text class="stat-label">总经验</text>
                <text class="stat-value xp">{{ currentWeekSummary.totalXp }}</text>
              </view>
            </view>
            <view class="stat-item">
              <text class="stat-icon">📋</text>
              <view class="stat-content">
                <text class="stat-label">完成任务</text>
                <text class="stat-value">{{ currentWeekSummary.totalTasks }}</text>
              </view>
            </view>
          </view>
          <text class="week-date-range">{{ getWeekRangeCN(currentWeekId) }}</text>
        </view>
        <view class="week-card-footer">
          <text class="view-link">查看详情 →</text>
        </view>
      </view>

      <!-- 历史周卡片列表 -->
      <view class="history-section">
        <text class="history-title">往期记录</text>
        <view v-if="historyWeeks.length === 0" class="empty-state">
          <text class="dim">暂无历史记录</text>
        </view>
        <view v-else class="weeks-grid">
          <view
            v-for="week in historyWeeks"
            :key="week.weekId"
            class="week-card"
            @click="goToWeek(week.weekId)"
          >
            <view class="week-card-header">
              <view class="week-title">
                <text class="week-title-text">{{ formatWeekCN(week.weekId) }}</text>
              </view>
              <view class="week-status">
                <text class="status-badge completed">已完成</text>
              </view>
            </view>
            <view class="week-card-content">
              <view class="week-stats-compact">
                <view class="stat-compact">
                  <text class="stat-icon-sm">✅</text>
                  <text class="stat-text">{{ week.summary.completedDays }}/7天</text>
                </view>
                <view class="stat-compact">
                  <text class="stat-icon-sm">💰</text>
                  <text class="stat-text gold">{{ week.summary.totalGold }}</text>
                </view>
                <view class="stat-compact">
                  <text class="stat-icon-sm">✨</text>
                  <text class="stat-text xp">{{ week.summary.totalXp }}</text>
                </view>
                <view class="stat-compact">
                  <text class="stat-icon-sm">📋</text>
                  <text class="stat-text">{{ week.summary.totalTasks }}项</text>
                </view>
              </view>
              <text class="week-date-range">{{ getWeekRangeCN(week.weekId) }}</text>
            </view>
            <view class="week-card-footer">
              <text class="view-link">查看详情 →</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProgressStore } from '@/stores/progress.store'
import {
  currentWeek,
  formatWeekCN,
  getWeekRangeCN,
  getWeekDates,
  getPreviousWeek,
} from '@/utils/date'

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
  uni.navigateTo({ url: '/pages/history/index?weekId=' + weekId })
}

onLoad(() => {
  loadData()
})
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.page-desc {
  display: block;
  color: var(--color-text-dim);
  margin-bottom: 32px;
  font-size: 30rpx;
}

/* 本周卡片 */
.week-card.current-week {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  margin-bottom: 32px;
  box-shadow: var(--shadow-lg);
  border-radius: 16px;
  padding: 20px;
}

.week-card.current-week .week-label {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 26rpx;
  font-weight: 700;
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
  margin-bottom: 12px;
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

.week-title-text {
  font-size: 34rpx;
  font-weight: 700;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 24rpx;
  font-weight: 700;
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

.week-stats {
  display: flex;
  flex-wrap: wrap;
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
  width: 45%;
}

.stat-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.stat-value {
  font-size: 34rpx;
  font-weight: 700;
}

.week-stats-compact {
  display: flex;
  flex-wrap: wrap;
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
  font-size: 26rpx;
  width: 45%;
}

.stat-icon-sm {
  font-size: 28rpx;
  flex-shrink: 0;
}

.stat-text {
  font-weight: 600;
  white-space: nowrap;
}

.week-date-range {
  display: block;
  font-size: 26rpx;
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
  font-weight: 600;
  font-size: 28rpx;
  color: var(--color-primary);
}

.week-card.current-week .view-link {
  color: var(--color-text-inverse);
}

.history-section {
  margin-top: 32px;
}

.history-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 20px;
}

.weeks-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.gold {
  color: var(--color-gold);
}

.xp {
  color: var(--color-xp);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-dim);
}
</style>
