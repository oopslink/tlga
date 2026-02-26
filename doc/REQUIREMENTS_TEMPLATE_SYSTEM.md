# 周计划模板系统 — 需求分析

> 甲方新需求，文档日期：2026-02-26
> 基于《REQUIREMENTS_ANALYSIS_V2.md》延伸

---

## 一、需求概述

本次新增需求围绕「**周计划模板系统**」展开，核心思想是：

> 每周开始前，系统自动为本周生成一份包含固定框架的计划模板。框架只含「类别」，不含「具体内容」。家长/孩子在此基础上填充具体任务，只能增加，不能删减。

---

## 二、需求详细说明

### 2.1 模板自动导入机制

**触发时机**：每周开始（建议周一，或首次访问本周计划时）

**模板内容**：固定的任务类别框架，不包含具体书目、章节、内容

**示例对比**：

| 类型 | 模板中的内容 | 不在模板中的内容 |
|------|------------|----------------|
| ✅ 有 | 奥数简单版 | 《走向联赛》第三章第2题 |
| ✅ 有 | 中文阅读 | 《草房子》第五章 |
| ✅ 有 | 英语/法语阅读选一 | 今天读哪本英语书 |

### 2.2 每日模板固定框架

每天的模板包含以下三个锚点的固定项目：

#### 锚点一：数学
- 学校数学作业（每日必做，包含课堂配套练习，合并计算奖励）⬅️ **✅ 已确认：课堂配套练习并入学校作业，无独立金币**
- 1道难题（每日必做，对应现有五模式中的钻石/王者模式）⬅️ **✅ 已确认：即五模式中的难题，非独立体系**

#### 锚点二：语言
- 背诵（每日必做）
- 中文阅读（每日必做）
- 英语/法语阅读选一（每日必做，最低要求选一，也可两个都做）⬅️ **✅ 已确认：选一为最低要求**

#### 锚点三：反思与创新
- 三选一（发现时刻 / 开放问题 / 方法日志）
- 参见 REQUIREMENTS_ANALYSIS_V2.md 第3.1节

### 2.3 模板只增不减原则

**核心约束**：在已生成的模板基础上，只能**增加**具体任务内容，**不能删除**模板预设的任何框架项目。

**操作场景**：
- ✅ 可以：在"奥数简单版"条目下补充"今天做《走向联赛》P45-47"
- ✅ 可以：在模板基础上额外添加"钢琴练习"等随机掉落任务
- ❌ 不可以：删除"学校数学作业"这个模板项
- ❌ 不可以：删除"背诵"这个模板项
- ❌ 不可以：把"英语/法语选一"从模板中移除

**UI 提示**：模板生成的框架项应有明显视觉标识（如锁定图标或不同颜色），表明该项不可删除。

### 2.4 反思内容自动归档

每日填写锚点三（反思与创新）后，内容**自动归档**到「思维档案」对应类别：

| 填写类型 | 归档目标 |
|---------|---------|
| 发现时刻 | 思维档案 → 发现时刻分类 |
| 开放问题 | 思维档案 → 开放问题分类 |
| 方法日志 | 思维档案 → 方法日志分类 |

归档时机：提交当日进度单时（或填写完成并确认时）自动执行，无需额外操作。

---

## 三、与现有需求的对比（Gap Analysis）

### 3.1 现有 V2 需求中已有但需细化的部分

| 功能 | V2 中的描述 | 本次新增细化 |
|------|-----------|------------|
| 反思锚点 | 三选一填写 | 明确"自动归档"为强制要求，非可选 |
| 数学锚点 | 学校作业 + 奥数模式 | 新增"课堂配套练习"、明确"1道难题"固定数量 |
| 语言锚点 | 英语/法语均可做 | 改为"英语/法语选一"（互斥二选一） |

### 3.2 全新需求（V2 中不存在）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **周计划模板系统** | P0 | 每周自动生成固定框架，这是本次最核心的新增 |
| **模板只增不减约束** | P0 | 模板项不可删除的业务规则 |
| **模板项视觉标识** | P1 | 区分"模板固定项"与"用户自由添加项" |

---

## 四、技术实现方案

### 4.1 新增数据模型

```typescript
// 单天模板框架
interface DayTemplate {
  anchors: {
    math: TemplateAnchorItem[]      // 锚点一：数学固定项
    language: TemplateAnchorItem[]  // 锚点二：语言固定项
    reflection: boolean             // 锚点三：是否启用（默认 true）
  }
  extraTasks?: TemplateAnchorItem[] // 额外任务（如随机掉落类）
}

// 周计划模板定义（包含完整7天）
interface WeeklyTemplate {
  id: string                 // 模板唯一 ID
  name: string               // 模板名称（如"标准学期模板"、"考试周模板"）
  isDefault: boolean         // 是否为当前默认模板
  createdAt: string          // 创建时间
  days: {
    monday: DayTemplate
    tuesday: DayTemplate
    wednesday: DayTemplate
    thursday: DayTemplate
    friday: DayTemplate
    saturday: DayTemplate
    sunday: DayTemplate
  }
}

// 模板项
interface TemplateAnchorItem {
  id: string                // 唯一标识
  label: string             // 显示名称（如"学校数学作业"）
  isTemplate: true          // 标记为模板项，不可删除
  note?: string             // 可选备注（填写具体内容用，如"今天做P45"）
}

// 模板管理 Store 中的状态
interface TemplateManagerState {
  templates: WeeklyTemplate[]   // 所有模板列表
  defaultTemplateId: string     // 当前默认模板 ID
}
```

**系统内置默认模板（标准学期模板）**：

```typescript
// 工作日（周一-周五）框架
const WEEKDAY_TEMPLATE: DayTemplate = {
  anchors: {
    math: [
      { id: "school-homework", label: "学校数学作业（含课堂配套练习）", isTemplate: true },
      { id: "hard-problem-1", label: "1道难题（钻石/王者模式）", isTemplate: true },
    ],
    language: [
      { id: "recitation", label: "背诵", isTemplate: true },
      { id: "chinese-reading", label: "中文阅读", isTemplate: true },
      { id: "en-or-fr-reading", label: "英语/法语阅读（选一，可两个都做）", isTemplate: true },
    ],
    reflection: true,
  }
}

// 周末（周六-周日）框架（可与工作日不同）
const WEEKEND_TEMPLATE: DayTemplate = {
  anchors: {
    math: [
      { id: "hard-problem-1", label: "1道难题（钻石/王者模式）", isTemplate: true },
    ],
    language: [
      { id: "chinese-reading", label: "中文阅读", isTemplate: true },
      { id: "en-or-fr-reading", label: "英语/法语阅读（选一，可两个都做）", isTemplate: true },
    ],
    reflection: true,
  }
}
```

> 注：以上周末框架为建议初稿，待甲方进一步确认是否周末模板与工作日相同。

### 4.2 模板管理功能

家长端新增「模板管理」页面（或设置面板），支持：

| 功能 | 说明 |
|------|------|
| 查看所有模板 | 列表展示，标注当前默认模板 |
| 新建模板 | 从空白创建，或从现有模板复制 |
| 编辑模板 | 修改各天的锚点内容 |
| 设为默认 | 选择某模板作为每周自动导入的默认模板 |
| 删除模板 | 删除非默认模板（默认模板不可直接删除）|

### 4.3 周计划生成逻辑

```
每周首次访问（或周一）时：
1. 检测本周是否已有计划
2. 若无 → 读取当前默认模板 → 生成本周7天的基础框架
3. 若有 → 直接展示现有计划（已在模板基础上修改过的）
4. 用户可在此框架上：
   - 为各模板项填写具体备注（如"今天做《走向联赛》P45"）
   - 额外添加随机掉落任务（如钢琴、写字）
5. 不允许删除 isTemplate: true 的项目
```

### 4.4 模板只增不减的实现

- 删除按钮对 `isTemplate: true` 的项目**不渲染**或**禁用**
- Store 层增加校验：`removeTask()` 检查 `isTemplate`，若为 true 则拒绝并给出 toast 提示
- UI 视觉区分：模板项用锁图标 + 略微不同的背景色标识

### 4.5 反思自动归档实现

- 在 `stores/progress.store.ts` 的"保存进度单"动作中，检测 `reflection` 字段
- 若存在且有内容，调用 `thinking-archive.store.ts` 的 `addEntry()` 方法
- 根据 `reflection.type` 写入对应归档分类
- 归档成功后给出简短 toast 通知："已归档到思维档案 ✓"

### 4.6 需要修改/新增的文件

| 文件 | 变更类型 | 变更内容 |
|------|---------|---------|
| `src/types/tasks.ts` | 修改 | 新增 `WeeklyTemplate`、`DayTemplate`、`TemplateAnchorItem` 类型 |
| `src/types/template.ts` | 新增 | 模板相关独立类型定义 |
| `src/data/templates/default.json` | 新增 | 系统内置默认模板数据 |
| `src/engine/weekly-plan.ts` | 修改 | 新增 `generateFromTemplate()` 函数 |
| `src/stores/template.store.ts` | 新增 | 模板列表管理、默认模板读写、CRUD |
| `src/stores/weekly-plan.store.ts` | 修改 | 新增模板加载逻辑、删除保护逻辑 |
| `src/stores/thinking-archive.store.ts` | 新增（V2已规划）| `addEntry()` 支持按类型写入 |
| `src/stores/progress.store.ts` | 修改 | 保存时自动触发反思归档 |
| `src/pages/TemplatePage.vue` | 新增 | 模板管理页（家长端）|
| `src/pages/WeeklyPlanPage.vue` | 修改 | 区分模板项与自由项的 UI 渲染 |
| `src/pages/ProgressPage.vue` | 修改 | 显示当日模板框架 + 锚点三填写UI |
| `src/App.vue` 或 `router` | 修改 | 新增模板管理路由 |

---

## 五、待确认问题

| # | 问题 | 状态 | 确认结果 |
|---|------|------|---------|
| 1 | **语言选一机制**：英语/法语"选一"是指每天只能选其一完成，还是选一作为最低要求（可以两个都做）？ | ✅ 已确认 | **最低要求选一，两个都做也可以** |
| 2 | **课堂配套练习**是每天都有，还是只有有作业的天才有？它有独立的奖励金币吗？ | ✅ 已确认 | **每天都有，无独立金币，并入学校作业计算** |
| 3 | **1道难题**：这里的"难题"是指现有五模式中的"钻石/王者"模式里的难题，还是独立于奥数的额外难题？ | ✅ 已确认 | **即五模式中的钻石/王者模式难题** |
| 4 | **模板是全周通用**（7天同一模板），还是工作日（周一至周五）和周末不同模板？ | ✅ 已确认 | **一套模板包含完整7天内容** |
| 5 | **反思归档时机**：是保存进度单时自动归档，还是需要用户手动点击"归档"按钮？ | ✅ 已确认 | **保存进度单时自动触发** |
| 6 | 是否需要支持**修改默认模板**（如某段时间无课堂配套练习可以暂时移除该项）？ | ✅ 已确认 | **家长可创建多套模板，选其一为默认模板，每周自动从默认模板生成** |

---

## 六、开发任务分解

### P0 — 本次新增核心

| # | 任务 | 涉及文件 | 估算 |
|---|------|---------|------|
| N1 | 新增模板相关类型定义 | `src/types/template.ts`（新建）| XS |
| N2 | 创建系统内置默认模板数据 | `src/data/templates/default.json`（新建）| XS |
| N3 | 新增模板管理 Store | `src/stores/template.store.ts`（新建）| S |
| N4 | `weekly-plan.ts` 新增 `generateFromTemplate()` | `src/engine/weekly-plan.ts` | S |
| N5 | `weekly-plan.store.ts` 新增模板加载 + 删除保护 | `src/stores/weekly-plan.store.ts` | S |
| N6 | `WeeklyPlanPage.vue` 区分模板项和自由项的 UI | `src/pages/WeeklyPlanPage.vue` | M |
| N7 | `progress.store.ts` 保存时自动归档反思内容 | `src/stores/progress.store.ts` | S |

### P1 — 重要功能

| # | 任务 | 涉及文件 | 估算 |
|---|------|---------|------|
| N8 | 完成思维档案 Store（V2 T8）| `src/stores/thinking-archive.store.ts`（新建）| S |
| N9 | 新增模板管理页面（家长端）| `src/pages/TemplatePage.vue`（新建）| L |
| N10 | 模板项视觉标识（锁图标 + 不同背景色）| `WeeklyPlanPage.vue`、`ProgressPage.vue` | S |
| N11 | 新增路由：模板管理页 | `router/index.ts` | XS |

---

## 七、与 V2 需求的关系

本次需求**不替代** REQUIREMENTS_ANALYSIS_V2.md，而是在其基础上新增和细化：

- V2 中的 T1-T17 任务继续有效
- 本文档新增 N1-N8 任务，建议在 T1（类型定义）阶段一并实现 N1
- 建议开发顺序：在 V2 的第3步（Store层）中插入 N2、N3、N4

---

*文档由 Claude Code 生成，日期：2026-02-26*
