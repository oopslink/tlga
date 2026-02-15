# 🚀 Git 部署快速开始

## 📋 5 分钟完成首次部署

### 前提条件

- ✅ 已安装 Git
- ✅ 已安装 Node.js
- ✅ 有 GitHub 账号

---

## 步骤 1：初始化 Git 仓库（如果还没有）

```bash
# 检查是否已是 Git 仓库
git status

# 如果不是，初始化
git init
git add .
git commit -m "Initial commit"
```

---

## 步骤 2：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`tlga`
3. 可见性：**Private**（推荐）或 Public
4. **不要**勾选任何初始化选项
5. 点击 "Create repository"

---

## 步骤 3：推送代码到 GitHub

复制 GitHub 显示的命令，或运行：

```bash
# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/tlga.git

# 推送代码
git branch -M main
git push -u origin main
```

---

## 步骤 4：首次部署

### 方式 A：使用自动化脚本（推荐）

```bash
./scripts/deploy.sh
```

### 方式 B：手动部署

```bash
npm run deploy
```

---

## 步骤 5：启用 GitHub Pages

**仅首次需要：**

1. 访问你的仓库：`https://github.com/你的用户名/tlga`
2. 点击 **Settings**（设置）
3. 左侧菜单点击 **Pages**
4. Source 选择 **gh-pages** 分支
5. 点击 **Save**（保存）

等待 1-2 分钟...

---

## 步骤 6：在 iPad 上安装

你的应用现在部署在：
```
https://你的用户名.github.io/tlga/
```

**在 iPad 上：**

1. **Safari 打开**上述网址（首次需要联网）
2. 等待完全加载（约 10-20 秒）
3. 点击**分享按钮** ↑
4. 选择 "**添加到主屏幕**"
5. 命名为 "小学霸"
6. 点击 "添加"

**测试离线：**
- 开启飞行模式
- 打开 App
- 完全正常使用！

✅ **完成！** 应用已部署并可离线使用。

---

## 🔄 日常更新流程

### 超简单！只需两步：

```bash
# 1. 修改代码...
# (编辑文件、添加功能等)

# 2. 运行部署脚本
./scripts/deploy.sh

# 完成！
```

脚本会自动：
1. ✅ 提交你的更改
2. ✅ 推送到 GitHub
3. ✅ 构建生产版本
4. ✅ 部署到 GitHub Pages

### iPad 自动更新

- ✅ 下次联网时自动检测更新
- ✅ 后台下载新版本
- ✅ 重启 App 应用更新
- ✅ 所有数据自动保留

---

## 🎯 或者使用 GitHub Actions 自动部署

### 启用自动部署（推荐）

已配置好 GitHub Actions，只需：

```bash
# 提交并推送
git add .
git commit -m "✨ 新功能"
git push

# GitHub 自动构建和部署，无需其他操作！
```

### 查看部署状态

访问：`https://github.com/你的用户名/tlga/actions`

---

## 📊 Git 命令速查

### 日常使用

```bash
# 查看状态
git status

# 提交更改
git add .
git commit -m "描述你的更改"
git push

# 查看历史
git log --oneline -10

# 查看当前分支
git branch
```

### 版本管理

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# 列出所有版本
git tag -l

# 查看版本详情
git show v1.0.0
```

### 回滚版本

```bash
# 回滚到特定版本
git checkout v1.0.0
npm run deploy

# 回到最新版本
git checkout main
```

---

## 🆘 常见问题

### Q1: 推送失败 "permission denied"

**解决：**
```bash
# 检查远程地址
git remote -v

# 更新为 HTTPS
git remote set-url origin https://github.com/你的用户名/tlga.git

# 或使用 SSH（需要配置 SSH key）
git remote set-url origin git@github.com:你的用户名/tlga.git
```

### Q2: GitHub Pages 显示 404

**检查：**
1. 仓库设置 → Pages → 是否选择了 gh-pages 分支
2. 是否等待了几分钟让部署生效
3. 访问的 URL 是否正确

**解决：**
```bash
# 查看 gh-pages 分支是否存在
git branch -a

# 如果不存在，重新部署
npm run deploy
```

### Q3: iPad 显示旧版本

**解决：**
1. 清除 Safari 缓存
2. 强制刷新页面
3. 重新添加到主屏幕

---

## 💡 高级技巧

### 1. 使用 Git Aliases 简化命令

```bash
# 配置别名
git config --global alias.co checkout
git config --global alias.st status
git config --global alias.cm commit
git config --global alias.br branch

# 使用
git st  # = git status
git cm -m "message"  # = git commit -m "message"
```

### 2. 查看部署历史

```bash
# 查看 gh-pages 分支历史
git log gh-pages --oneline -10
```

### 3. 自动化版本号

```bash
# 自动增加版本号并部署
npm version patch  # 1.0.0 → 1.0.1
./scripts/deploy.sh
```

---

## 📚 相关文档

- **完整指南**: [GIT_DEPLOYMENT.md](./GIT_DEPLOYMENT.md)
- **更新指南**: [UPDATE_GUIDE.md](./UPDATE_GUIDE.md)
- **离线安装**: [OFFLINE_IPAD_INSTALL.md](./OFFLINE_IPAD_INSTALL.md)

---

## 🎉 现在开始

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git remote add origin https://github.com/你的用户名/tlga.git
git push -u origin main

# 3. 部署
./scripts/deploy.sh

# 4. 在 GitHub 启用 Pages
# 5. iPad Safari 访问并添加到主屏幕
# 6. 完成！
```

**祝您使用愉快！** 🚀
