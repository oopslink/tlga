<template>
  <div class="container">
    <h1>📝 每日任务记录</h1>
    <p style="color: var(--color-text-dim); margin-bottom: 24px;">日期: {{ dailyStore.currentDate }}</p>

    <div v-if="dailyStore.loading" class="loading">加载中...</div>
    <div v-else-if="dailyStore.error" class="error">{{ dailyStore.error }}</div>

    <div v-else-if="dailyStore.currentLog">
      <!-- Homework -->
      <div class="task-section">
        <h3>📚 作业</h3>
        <div class="form-row">
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.homework.completed" />
            完成作业
          </label>
        </div>
        <div class="form-group" v-if="dailyStore.currentLog.homework.completed">
          <label class="label">质量</label>
          <select class="select" v-model="dailyStore.currentLog.homework.quality">
            <option value="perfect">完美</option>
            <option value="good">良好</option>
            <option value="ok">一般</option>
            <option value="incomplete">未完成</option>
          </select>
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.homework.selfChecked" />
            自查
          </label>
        </div>
      </div>

      <!-- Math -->
      <div class="task-section">
        <h3>🧮 数学练习</h3>
        <div class="form-row">
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.math.completed" />
            完成数学
          </label>
        </div>
        <div v-if="dailyStore.currentLog.math.completed">
          <div class="form-group">
            <label class="label">难度</label>
            <select class="select" v-model="dailyStore.currentLog.math.difficulty">
              <option value="basic">基础</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
              <option value="competition">竞赛</option>
              <option value="olympiad">奥数</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">题目数量</label>
            <input type="number" class="input" v-model.number="dailyStore.currentLog.math.problems" min="0" />
          </div>
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.math.allCorrect" />
            全对
          </label>
        </div>
      </div>

      <!-- Juggling -->
      <div class="task-section">
        <h3>⚽ 颠球训练</h3>
        <div class="form-row">
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.juggling.completed" />
            完成颠球
          </label>
        </div>
        <div v-if="dailyStore.currentLog.juggling.completed">
          <div class="form-group">
            <label class="label">时长(分钟)</label>
            <input type="number" class="input" v-model.number="dailyStore.currentLog.juggling.minutes" min="0" />
          </div>
          <label class="label">
            <input type="checkbox" class="checkbox" v-model="dailyStore.currentLog.juggling.newRecord" />
            新纪录!
          </label>
        </div>
      </div>

      <!-- Languages -->
      <div class="task-section">
        <h3>🌍 语言学习</h3>
        <div v-for="(lang, i) in dailyStore.currentLog.languages" :key="i" class="form-row">
          <select class="select" v-model="lang.type" style="flex: 1;">
            <option value="english-reading">英语阅读</option>
            <option value="english-words">英语单词</option>
            <option value="french">法语</option>
          </select>
          <input type="number" class="input" v-model.number="lang.minutes" placeholder="分钟" style="width: 100px;" />
          <button class="button" @click="dailyStore.removeLanguage(i)" style="padding: 8px 16px;">删除</button>
        </div>
        <button class="button" @click="addLanguage" style="margin-top: 12px;">+ 添加语言学习</button>
      </div>

      <!-- Preview Rewards -->
      <div class="reward-preview" v-if="previewRewards">
        <h3>预览奖励</h3>
        <div class="breakdown-item">
          <span>金币</span>
          <span class="gold">{{ previewRewards.totalGold }}</span>
        </div>
        <div class="breakdown-item">
          <span>经验值</span>
          <span class="xp">{{ previewRewards.totalXp }}</span>
        </div>
        <div class="breakdown-item">
          <span>星星</span>
          <span class="star">{{ previewRewards.totalStars }}</span>
        </div>
        <div v-if="previewRewards.breakdown.length > 0" style="margin-top: 16px;">
          <h4>详细分解:</h4>
          <div v-for="(item, i) in previewRewards.breakdown" :key="i" class="breakdown-item" style="font-size: 14px;">
            <span>{{ item.source }}</span>
            <span>
              <span v-if="item.gold > 0" class="gold">+{{ item.gold }}💰</span>
              <span v-if="item.xp > 0" class="xp" style="margin-left: 8px;">+{{ item.xp }}✨</span>
              <span v-if="item.stars > 0" class="star" style="margin-left: 8px;">+{{ item.stars }}⭐</span>
            </span>
          </div>
        </div>
      </div>

      <button class="button" @click="handleSave" style="width: 100%; margin-top: 24px; font-size: 18px;" :disabled="saving">
        {{ saving ? '保存中...' : '💾 保存并结算奖励' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDailyLogStore } from '@/stores/daily-log.store'
import { usePlayerStore } from '@/stores/player.store'
import { useModal } from '@/composables/useModal'

const { showAlert } = useModal()

const dailyStore = useDailyLogStore()
const playerStore = usePlayerStore()
const saving = ref(false)

const previewRewards = computed(() => {
  if (!dailyStore.currentLog) return null
  return dailyStore.currentLog.rewards
})

async function addLanguage() {
  dailyStore.addLanguage({ type: 'english-reading', completed: true, minutes: 15 })
}

async function handleSave() {
  if (!dailyStore.currentLog) return
  saving.value = true
  try {
    await dailyStore.save()
    await showAlert('保存成功!')
  } catch (e) {
    await showAlert('保存失败: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await dailyStore.loadToday()
  await dailyStore.recalculate()
})

watch(() => dailyStore.currentLog, () => {
  dailyStore.recalculate()
}, { deep: true })
</script>
