# 🔄 重新审批功能

## 功能概述

已审批通过的进度单现在支持重新审批，审批员可以调整奖励后重新结算积分。

## 🎯 使用场景

### 场景 1: 发现审批错误
```
审批员发现之前给的奖励不对
→ 打开已审批的进度单
→ 调整奖励金额
→ 点击"重新审批并结算"
→ 积分更新完成
```

### 场景 2: 额外奖励
```
小学霸表现特别好
→ 决定给予额外奖励
→ 打开已审批的进度单
→ 增加额外金币/XP
→ 更新评语
→ 重新结算
```

### 场景 3: 调整倍率
```
发现某天应该有特殊倍率
→ 打开进度单
→ 修改倍率或额外加成
→ 重新结算
→ 积分自动调整
```

## 💻 技术实现

### 1. 审批状态判断

**优化前**
```typescript
const isReviewable = computed(() => sheet.value?.status === 'submitted')
```
只有"已提交"状态可审批

**优化后**
```typescript
const isReviewable = computed(() =>
  sheet.value?.status === 'submitted' || sheet.value?.status === 'approved'
)
```
"已提交"和"已审批"状态都可审批

### 2. 初始化审批数据

**优化前**
```typescript
function initOverrides() {
  // 总是使用小学霸填写的数据初始化
  for (const task of sheet.value.tasks) {
    const result = inferResult(task)
    const reward = calcDefaultReward(task.taskId, result)
    overrides.push({ result, gold: reward.gold, xp: reward.xp, comment: '' })
  }
}
```

**优化后**
```typescript
function initOverrides() {
  // 恢复之前的审批设置
  bonus.multiplier = sheet.value?.bonusMultiplier ?? 1
  bonus.gold = sheet.value?.bonusGold ?? 0
  bonus.xp = sheet.value?.bonusXp ?? 0
  reviewComment.value = sheet.value?.reviewComment ?? ''

  if (sheet.value.status === 'approved') {
    // 已审批：从审批结果恢复
    for (const task of sheet.value.tasks) {
      let result = '__uncompleted'
      if (task.approverOverrideCompleted !== undefined) {
        if (task.approverOverrideCompleted) {
          result = task.approverOverrideVariant || '__completed'
        }
      } else if (task.completed) {
        result = task.achievedVariant || '__completed'
      }

      overrides.push({
        result,
        gold: task.finalGold ?? 0,
        xp: task.finalXp ?? 0,
        comment: task.approverComment ?? '',
      })
    }
  } else {
    // 未审批：使用小学霸填写的数据
    for (const task of sheet.value.tasks) {
      const result = inferResult(task)
      const reward = calcDefaultReward(task.taskId, result)
      overrides.push({ result, gold: reward.gold, xp: reward.xp, comment: '' })
    }
  }
}
```

### 3. 按钮文案优化

**动态显示**
```vue
<button class="button btn-approve" @click="handleApprove">
  {{ sheet.status === 'approved' ? '✅ 重新审批并结算' : '✅ 通过并结算' }}
</button>
```

**提示信息**
```vue
<p v-if="sheet.status === 'approved'" class="dim" style="width: 100%;">
  💡 提示：此进度单已审批，可以调整奖励后重新结算
</p>
```

### 4. 确认提示优化

```typescript
async function handleApprove() {
  const isReApproval = sheet.value?.status === 'approved'
  const message = isReApproval
    ? '确认重新审批？将使用新的奖励重新结算积分。'
    : '确认审批通过？将自动结算积分。'

  if (!await showConfirm(message)) return
  applyOverrides()
  await progressStore.approveSheet(reviewComment.value || undefined)

  const successMsg = isReApproval
    ? '重新审批成功，积分已更新！'
    : '审批通过，积分已结算！'
  await showAlert(successMsg)
}
```

## 🎨 用户界面

### 已提交状态（首次审批）

**按钮文案**
```
✅ 通过并结算
❌ 驳回
```

**确认提示**
```
确认审批通过？将自动结算积分。
```

**成功提示**
```
审批通过，积分已结算！
```

### 已审批状态（重新审批）

**按钮文案**
```
✅ 重新审批并结算
❌ 驳回
```

**提示信息**
```
💡 提示：此进度单已审批，可以调整奖励后重新结算
```

**确认提示**
```
确认重新审批？将使用新的奖励重新结算积分。
```

**成功提示**
```
重新审批成功，积分已更新！
```

## 📋 操作流程

### 首次审批

```
1. 小学霸提交进度单（状态：submitted）
2. 审批员打开进度单
3. 查看任务完成情况
4. 确认结果、调整奖励
5. 填写评语
6. 点击"通过并结算"
7. 进度单状态变为 approved
8. 积分结算到玩家账户
```

### 重新审批

```
1. 审批员打开已审批的进度单（状态：approved）
2. 自动加载之前的审批结果
   - 任务确认结果
   - 金币/XP 奖励
   - 倍率和额外加成
   - 审批评语
3. 修改需要调整的内容
   - 调整某个任务的奖励
   - 修改倍率
   - 增加额外加成
   - 更新评语
4. 点击"重新审批并结算"
5. 确认提示："将使用新的奖励重新结算积分"
6. 确认后重新结算
7. 积分更新到玩家账户
8. 成功提示："重新审批成功，积分已更新！"
```

## 💡 设计考虑

### 1. 数据保留
- 重新审批时保留之前的审批结果
- 审批员可以看到之前设置的所有值
- 避免重新从零开始调整

### 2. 清晰提示
- 按钮文案明确区分首次/重新审批
- 确认提示说明操作影响
- 成功消息反馈操作结果

### 3. 灵活调整
- 可以修改任意审批内容
- 支持增加或减少奖励
- 可以更新评语

### 4. 积分更新
- 重新审批会更新玩家积分
- 使用新的奖励重新计算
- 自动同步到玩家数据

## 🎯 使用建议

### 适合重新审批的情况

✅ **发现审批错误**
- 奖励计算错误
- 任务状态判断失误
- 评语写错了

✅ **政策调整**
- 决定给予额外奖励
- 调整某天的特殊倍率
- 追加奖励活动

✅ **特殊情况**
- 小学霸表现特别好
- 节日额外奖励
- 达成特殊成就

### 不建议重新审批的情况

❌ **频繁调整**
- 审批时就应该仔细确认
- 避免反复修改引起混乱

❌ **随意增减**
- 奖励应该有明确标准
- 避免不公平情况

❌ **重大调整**
- 大幅度修改应该慎重
- 最好与小学霸沟通

## 🔄 与驳回的区别

| 操作 | 状态变化 | 积分影响 | 是否需要小学霸操作 |
|------|----------|----------|-------------------|
| **重新审批** | approved → approved | 更新积分 | ❌ 不需要 |
| **驳回** | approved → rejected | 不变 | ✅ 需要修改后重新提交 |

**重新审批**：审批员自己调整，直接生效
**驳回**：让小学霸修改内容，重新提交

## 📊 数据流

### 重新审批数据流

```
1. 加载已审批进度单
   ↓
2. initOverrides() 恢复审批结果
   - 从 finalGold/finalXp 恢复奖励
   - 从 approverOverride* 恢复确认结果
   - 从 bonusMultiplier/bonusGold/bonusXp 恢复加成
   - 从 reviewComment 恢复评语
   ↓
3. 审批员修改
   - 调整任务奖励
   - 修改倍率/加成
   - 更新评语
   ↓
4. 点击"重新审批并结算"
   ↓
5. applyOverrides() 应用修改
   ↓
6. progressStore.approveSheet() 保存
   ↓
7. 重新计算并更新玩家积分
   ↓
8. 完成
```

## ✨ 用户体验优化

### 1. 智能初始化
- 已审批进度单自动加载之前的结果
- 不需要审批员重新输入

### 2. 清晰标识
- 按钮文案明确说明是"重新审批"
- 提示信息解释当前状态

### 3. 二次确认
- 重新审批前弹出确认框
- 说明操作影响（重新结算积分）

### 4. 操作反馈
- 成功后显示"重新审批成功"
- 区分首次审批的成功消息

## 🎉 功能总结

**重新审批功能让审批流程更加灵活！**

- ✅ 支持调整已审批的奖励
- ✅ 自动加载之前的审批结果
- ✅ 清晰的状态提示和确认
- ✅ 灵活的奖励调整机制
- ✅ 即时生效，无需小学霸操作

---

**功能完成！** 🔄✨

现在审批员可以随时调整已审批的进度单，让奖励管理更加灵活！
