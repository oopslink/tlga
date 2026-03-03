# 打印本周计划 - 设计文档

日期：2026-03-03

## 需求

在"本周计划"页面（`PlanPage.vue`）添加打印功能，打印格式参考 `本周计划.pdf`：横向表格，列 = 7天，行 = 任务，底部显示每天预计金币。

## 方案

CSS Print + `window.print()`（方案 A）

## 实现细节

### 触发入口
- 在 `PlanPage.vue` 底部操作栏加"🖨️ 打印计划"按钮
- 始终可见（草稿/激活/已完成状态均可打印）

### 打印视图结构
在 `PlanPage.vue` 末尾添加隐藏的 `<div class="print-view">` 区域，包含：

1. **页眉**：学生姓名 + "本周计划" + 周次 + 日期范围
2. **任务表格**：
   - 列：任务名（第一列）+ 7天（周日～周六）
   - 行：跨全周去重汇总所有 `taskId`（普通任务）和锁定任务（来自模板）
   - 单元格：若当天有该任务 → 显示 `note` 或 `targetVariant`（若有），否则显示 ✓；若无该任务 → 空白
3. **页脚行**：每天预计金币合计 + 全周总计

### 任务行来源
- 普通任务：`taskId` 非锁定，名称来自 `getTaskById(taskId)?.name`
- 锁定任务（模板）：`isLocked = true`，名称来自 `t.note`（模板项标签）
- 去重：以 `taskId`（普通）或 `note`（锁定）为键

### 金币计算
- 普通任务：`getTaskReward(taskId, targetVariant).gold`
- 锁定任务：不参与金币预估（无 taskId 对应的 gold 值）

### CSS 打印样式
```css
@media print {
  /* 隐藏应用正常内容 */
  #app > *:not(.print-view) { display: none !important; }
  .print-view { display: block !important; }
  @page { size: A4 landscape; margin: 1cm; }
}
```

## 文件改动

- `src/pages/PlanPage.vue`：添加打印按钮、打印视图 div、相关 script 逻辑和 CSS
