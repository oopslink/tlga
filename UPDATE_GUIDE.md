# 🔄 应用更新指南（iSH 方案）

## 📋 更新流程概览

```
┌──────────────────────────────────────┐
│  1. 电脑上构建新版本                  │
│  2. 传输到 iPad                       │
│  3. iSH 中替换文件                    │
│  4. 重启服务器                        │
│  5. 清除浏览器缓存（如需要）          │
│  6. 完成！数据自动保留                │
└──────────────────────────────────────┘
```

**关键：** 所有用户数据（计划、进度、审批记录）都存储在 Safari localStorage 中，更新应用文件**不会影响数据**！

---

## 🚀 标准更新流程

### 步骤 1：在电脑上构建新版本

```bash
# 进入项目目录
cd /path/to/tlga

# 拉取最新代码（如果使用 Git）
git pull

# 或者直接修改代码后构建

# 安装依赖（如有新的）
npm install

# 构建新版本
npm run build

# 压缩
cd dist
zip -r ../tlga-app-v2.zip .
cd ..
```

**建议命名规则：**
- `tlga-app-v1.0.zip`
- `tlga-app-v1.1.zip`
- `tlga-app-v2.0.zip`

### 步骤 2：传输到 iPad

选择一种方式：

**方式 A：AirDrop（最快）**
```
右键 tlga-app-v2.zip → 共享 → AirDrop → 选择 iPad
```

**方式 B：iCloud Drive**
```
上传到 iCloud Drive → 在 iPad 访问
```

**方式 C：邮件**
```
发送给自己 → 在 iPad 下载
```

### 步骤 3：备份旧版本（可选但推荐）

在 iSH 中：

```bash
# 停止服务器（Ctrl+C）

# 备份旧版本
cd ~
mv tlga tlga-backup-$(date +%Y%m%d)

# 或者打包备份
tar -czf tlga-backup-$(date +%Y%m%d).tar.gz tlga
rm -rf tlga
```

### 步骤 4：安装新版本

```bash
# 创建新目录
mkdir ~/tlga
cd ~/tlga

# 解压新版本
# 方法 1: 如果文件在 iSH Downloads
unzip ~/Downloads/tlga-app-v2.zip

# 方法 2: 从 Files App 导入
# 在 Files App 中解压，然后移动文件到 iSH → root → tlga

# 验证文件
ls -la
# 应该看到 index.html, assets/ 等
```

### 步骤 5：重启服务器

```bash
# 在 tlga 目录中
cd ~/tlga
python3 -m http.server 8080

# 看到：
# Serving HTTP on 0.0.0.0 port 8080 ...
```

### 步骤 6：清除浏览器缓存（如果需要）

**何时需要清除：**
- 更新后看到的还是旧版本
- 新功能没有显示
- PWA 缓存了旧版本

**如何清除：**

1. **方法 A：清除特定网站数据**
   - Safari → 设置（AA图标）
   - 网站设置 → 高级
   - 网站数据 → localhost
   - 移除

2. **方法 B：清除所有历史记录**
   - 设置 → Safari
   - 清除历史记录和网站数据
   - ⚠️ 这会删除所有网站数据

3. **方法 C：强制刷新**
   - 访问 http://localhost:8080
   - 长按刷新按钮
   - 选择"请求桌面网站"

**重要：** 清除缓存后需要重新添加到主屏幕！

### 步骤 7：重新添加到主屏幕（如清除了缓存）

1. Safari 访问 `http://localhost:8080`
2. 分享 → 添加到主屏幕
3. 命名为"小学霸"
4. 完成

---

## 🔒 数据安全

### 数据不会丢失

**用户数据存储位置：**
```
Safari localStorage (独立存储)
├── plan_2026-W07: {...}          # 周计划
├── progress_2026-02-15: {...}    # 进度单
├── player_state: {...}           # 玩家状态
└── custom_tasks: [...]           # 自定义任务
```

**应用文件位置：**
```
iSH ~/tlga/ (可以替换)
├── index.html
├── assets/
└── ...
```

**关键点：**
- ✅ 数据和代码**完全分离**
- ✅ 更新应用文件**不影响数据**
- ✅ 只要不清除 Safari 数据，用户数据永久保留

### 验证数据保留

更新后验证：

1. 打开应用
2. 检查：
   - ✅ 周计划还在
   - ✅ 进度单还在
   - ✅ 审批记录还在
   - ✅ 自定义任务还在
   - ✅ 玩家金币和经验还在

---

## 🎯 快速更新脚本

### 在电脑上创建更新脚本

创建 `scripts/build-for-ipad.sh`：

```bash
#!/bin/bash

# 构建并打包 iPad 版本

echo "🔨 构建生产版本..."
npm run build

echo "📦 压缩文件..."
cd dist
VERSION=$(date +%Y%m%d-%H%M)
zip -r ../tlga-app-$VERSION.zip .
cd ..

echo "✅ 完成！"
echo "📁 文件: tlga-app-$VERSION.zip"
echo "📱 现在传输到 iPad 并更新"
```

使用：
```bash
chmod +x scripts/build-for-ipad.sh
./scripts/build-for-ipad.sh
```

### 在 iSH 中创建更新脚本

创建 `~/update-tlga.sh`：

```bash
#!/bin/sh

echo "🔄 更新小学霸应用..."

# 停止旧服务器（如果在运行）
pkill -f "python3 -m http.server"

# 备份旧版本
if [ -d ~/tlga ]; then
    BACKUP_NAME="tlga-backup-$(date +%Y%m%d-%H%M)"
    echo "💾 备份旧版本到 $BACKUP_NAME"
    mv ~/tlga ~/$BACKUP_NAME
fi

# 创建新目录
mkdir -p ~/tlga
cd ~/tlga

# 提示用户
echo "📥 请在 Files App 中解压新版本文件"
echo "📁 移动所有文件到: iSH → root → tlga"
echo ""
echo "⏸️  完成后按回车继续..."
read

# 验证文件
if [ -f ~/tlga/index.html ]; then
    echo "✅ 文件检测成功"

    # 启动服务器
    echo "🚀 启动服务器..."
    cd ~/tlga
    python3 -m http.server 8080
else
    echo "❌ 错误：未找到 index.html"
    echo "请确保文件已正确导入"
fi
```

使用：
```bash
chmod +x ~/update-tlga.sh
~/update-tlga.sh
```

---

## 🔍 故障排查

### 问题 1：更新后显示旧版本

**原因：** PWA/浏览器缓存

**解决：**
```bash
1. 清除 Safari 缓存
   设置 → Safari → 清除历史记录和网站数据

2. 重启 Safari

3. 重新访问 http://localhost:8080

4. 强制刷新（长按刷新按钮）

5. 重新添加到主屏幕
```

### 问题 2：新功能不显示

**原因：** Service Worker 缓存

**解决：**
```bash
1. 访问 http://localhost:8080

2. 打开 Safari 开发者工具
   设置 → Safari → 高级 → 网页检查器

3. 控制台输入：
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(reg => reg.unregister()))

4. 刷新页面

5. 重新添加到主屏幕
```

### 问题 3：数据丢失

**预防：**
- ❌ 不要选择"清除历史记录和网站数据"
- ✅ 只清除缓存图片和文件

**如果已经丢失：**
- 检查备份（如果有）
- 无法恢复 localStorage 数据

**建议：**
- 定期导出数据（未来功能）
- 或定期截图重要记录

### 问题 4：服务器无法启动

**检查：**
```bash
# 检查端口是否被占用
netstat -an | grep 8080

# 使用不同端口
python3 -m http.server 9000

# 在 Safari 访问 http://localhost:9000
```

---

## 📅 更新频率建议

### 何时需要更新

**必须更新：**
- 🐛 严重 bug 修复
- 🔒 安全漏洞修复
- 💥 功能损坏

**建议更新：**
- ✨ 新功能添加
- 🎨 UI 改进
- ⚡ 性能优化

**可选更新：**
- 📝 文字修改
- 🎨 样式微调

### 更新策略

**方案 A：稳定版策略**
```
只更新稳定版本
- 每月或每季度更新一次
- 只更新经过充分测试的版本
- 适合保守用户
```

**方案 B：激进策略**
```
及时获取新功能
- 有新版本就更新
- 快速体验新功能
- 需要承担一定风险
```

---

## 🎯 版本管理

### 记录版本信息

在 `public/version.json`：

```json
{
  "version": "1.0.0",
  "buildDate": "2026-02-15",
  "changelog": [
    "新增任务管理功能",
    "优化界面布局",
    "修复已知bug"
  ]
}
```

### 在应用中显示版本

可以在设置页添加版本信息显示：

```vue
<template>
  <div class="version-info">
    <span>版本：{{ version }}</span>
    <span>构建日期：{{ buildDate }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const version = ref('')
const buildDate = ref('')

onMounted(async () => {
  const res = await fetch('/version.json')
  const data = await res.json()
  version.value = data.version
  buildDate.value = data.buildDate
})
</script>
```

---

## 📦 自动更新方案（高级）

### 方案：Git + Working Copy

如果使用 Git 管理代码：

1. **在 iPad 上安装 Working Copy**（免费）

2. **Clone 仓库到 iPad**

3. **在电脑上更新并推送**
```bash
npm run build
git add dist/
git commit -m "Update build"
git push
```

4. **在 iPad Working Copy 中拉取**
   - 打开 Working Copy
   - 拉取最新代码
   - 导出 dist 文件夹到 iSH

5. **在 iSH 中替换文件**

**优势：**
- ✅ 版本控制
- ✅ 可以回滚
- ✅ 查看更新日志

---

## 🎉 最佳实践

### 更新前检查清单

- [ ] 备份旧版本文件
- [ ] 记录当前版本号
- [ ] 确认数据已保存
- [ ] 准备回滚方案

### 更新后验证清单

- [ ] 应用正常启动
- [ ] 所有页面可访问
- [ ] 数据完整保留
- [ ] 新功能正常工作
- [ ] 没有报错信息

### 回滚方案

如果更新失败：

```bash
# 停止服务器
pkill -f "python3 -m http.server"

# 恢复备份
cd ~
rm -rf tlga
mv tlga-backup tlga

# 重启服务器
cd ~/tlga
python3 -m http.server 8080
```

---

## 📝 更新记录模板

建议维护一个更新日志：

```
# 更新记录

## v2.0.0 (2026-02-20)
- ✨ 新增：任务管理功能
- ✨ 新增：自定义任务定义
- 🎨 优化：设置页面布局
- 🐛 修复：审批页渲染错误
- 更新方式：按标准流程更新

## v1.1.0 (2026-02-15)
- ✨ 新增：历史记录页面
- 🎨 优化：移动端适配
- 🐛 修复：数据加载问题
- 更新方式：按标准流程更新

## v1.0.0 (2026-02-10)
- 🎉 首次发布
- ✨ 周计划管理
- ✨ 每日进度
- ✨ 审批系统
```

---

## 🎯 总结

### 更新很简单

```
1. 电脑：npm run build + 压缩
2. 传输：AirDrop 到 iPad
3. iSH：备份 + 替换文件 + 重启
4. Safari：清除缓存（如需）
5. 完成：数据自动保留！
```

### 关键点

- ✅ **数据安全**：更新不影响用户数据
- ✅ **可回滚**：保留备份可随时恢复
- ✅ **离线操作**：整个更新过程不需要联网
- ✅ **简单快速**：5-10 分钟完成更新

---

**现在您可以放心更新应用了！** 🚀
