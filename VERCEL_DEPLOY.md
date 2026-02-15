# 🚀 Vercel 部署指南

## 📋 快速开始

### 前提条件

- ✅ 已安装 Node.js
- ✅ 有 Vercel 账号（免费版即可）
- ✅ 代码已推送到 GitHub

---

## 方式 1：通过 Vercel 网站部署（推荐 - 最简单）

### 步骤 1：访问 Vercel

1. 打开 https://vercel.com
2. 点击 "Sign Up" 或 "Log In"
3. 使用 GitHub 账号登录

### 步骤 2：导入项目

1. 点击 "Add New..." → "Project"
2. 选择你的 GitHub 仓库 `tlga`
3. 点击 "Import"

### 步骤 3：配置项目

**Vercel 会自动检测为 Vite 项目，默认配置如下：**

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**无需修改，直接点击 "Deploy"**

### 步骤 4：等待部署

- 首次部署约 1-2 分钟
- 部署完成后会显示部署 URL
- 格式：`https://tlga-xxxxx.vercel.app`

### 步骤 5：在 iPad 上安装

1. **Safari 打开部署 URL**（首次需联网）
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

## 方式 2：通过命令行部署

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录

```bash
vercel login
```

按提示完成登录（通过邮箱或 GitHub）

### 步骤 3：首次部署

```bash
# 进入项目目录
cd /path/to/tlga

# 部署
vercel
```

按提示操作：
1. Set up and deploy? → **Y**
2. Which scope? → 选择你的账号
3. Link to existing project? → **N**
4. Project name? → **tlga** (或按 Enter 使用默认)
5. In which directory? → **./** (按 Enter)
6. Want to override the settings? → **N**

等待部署完成，记下 Production URL。

### 步骤 4：后续部署

```bash
# 部署到生产环境
vercel --prod
```

---

## 🔄 日常更新流程

### 超简单！

#### 方式 A：自动部署（推荐）

**无需任何操作！** Vercel 会自动监听 GitHub 仓库：

```bash
# 1. 修改代码...
# 2. 提交并推送
git add .
git commit -m "✨ 新功能"
git push

# 3. Vercel 自动构建和部署！
# 无需其他操作，等待 1-2 分钟即可
```

#### 方式 B：手动部署

```bash
vercel --prod
```

### iPad 自动更新

- ✅ 下次联网时自动检测更新
- ✅ 后台下载新版本
- ✅ 重启 App 应用更新
- ✅ 所有数据自动保留

---

## 🎯 Vercel 特点

### 优势

- ✅ **最简单的部署方式** - 零配置，一键部署
- ✅ **自动 CI/CD** - 推送到 GitHub 自动部署
- ✅ **极快的全球 CDN** - 访问速度快
- ✅ **预览部署** - 每个 PR 都有独立预览 URL
- ✅ **自定义域名** - 免费 SSL 证书
- ✅ **实时日志** - 部署和运行时日志
- ✅ **免费额度充足** - 个人项目完全够用

### 免费额度

- 100 GB 带宽/月
- 无限部署次数
- 无限网站数量
- 自动 HTTPS

---

## 📊 查看部署状态

### 通过 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 点击你的项目 `tlga`
3. 查看：
   - 部署历史
   - 实时日志
   - 性能分析
   - 使用统计

### 通过命令行

```bash
# 查看最近部署
vercel list

# 查看项目信息
vercel inspect

# 查看日志
vercel logs
```

---

## 🌐 自定义域名（可选）

### 添加自己的域名

1. 在 Vercel Dashboard 进入项目
2. 点击 "Settings" → "Domains"
3. 添加你的域名
4. 按提示配置 DNS

**示例：**
```
你的域名.com → 指向 Vercel
```

---

## 🆚 Vercel vs GitHub Pages

| 特性 | Vercel | GitHub Pages |
|------|--------|--------------|
| **部署速度** | 非常快 ⭐⭐⭐⭐⭐ | 较快 ⭐⭐⭐⭐ |
| **设置复杂度** | 极简单 ⭐⭐⭐⭐⭐ | 简单 ⭐⭐⭐⭐ |
| **自动部署** | ✅ 零配置 | ✅ 需配置 Actions |
| **全球 CDN** | ✅ 边缘网络 | ✅ 基础 CDN |
| **预览部署** | ✅ 每个 PR | ❌ |
| **部署日志** | ✅ 详细实时 | ⚠️ 基础 |
| **自定义域名** | ✅ 简单 | ✅ 需配置 |
| **免费额度** | 充足 | 无限 |

---

## 🔍 常见问题

### Q1: 部署失败怎么办？

**检查：**
```bash
# 本地测试构建
npm run build

# 查看 Vercel 日志
vercel logs
```

### Q2: 如何回滚到之前的版本？

1. 访问 Vercel Dashboard
2. 进入 "Deployments"
3. 找到之前的部署
4. 点击 "..." → "Promote to Production"

### Q3: iPad 显示旧版本

**解决：**
1. 清除 Safari 缓存
2. 强制刷新页面
3. 重新添加到主屏幕

### Q4: 部署 URL 太长，能改吗？

**可以！** 在 Vercel Dashboard：
1. Settings → Domains
2. 编辑 vercel.app 域名
3. 改成更短的名字，如：`xiaoxueba.vercel.app`

---

## 💡 高级技巧

### 1. 环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

```
NODE_ENV=production
VITE_APP_VERSION=1.0.0
```

### 2. 预览部署

创建 PR 时，Vercel 自动创建预览部署：

```bash
# 创建功能分支
git checkout -b feature/new-task
# ... 修改代码
git push origin feature/new-task

# 在 GitHub 创建 PR
# Vercel 自动部署预览版本！
```

### 3. 部署钩子

在 `vercel.json` 添加构建钩子：

```json
{
  "github": {
    "silent": true
  },
  "buildCommand": "npm run build",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./src"
}
```

---

## 🎉 开始使用

### 最简单方式：

1. 访问 https://vercel.com
2. 用 GitHub 登录
3. Import 项目 `tlga`
4. 点击 Deploy
5. 等待完成
6. iPad Safari 访问并添加到主屏幕

**仅需 5 分钟！** 🚀

---

## 📚 相关资源

- **Vercel 文档**: https://vercel.com/docs
- **Vite 部署指南**: https://vitejs.dev/guide/static-deploy.html
- **本项目快速开始**: [QUICK_START_GIT.md](./QUICK_START_GIT.md)

---

**祝您使用愉快！** 🚀
