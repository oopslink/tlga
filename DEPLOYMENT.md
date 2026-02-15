# 📱 iPad 部署指南

## ✅ 已完成的 PWA 配置

项目已完整配置为 PWA（渐进式 Web 应用），支持：

- ✅ **像原生 App 一样使用** - 添加到主屏幕后全屏运行
- ✅ **支持离线访问** - Service Worker 自动缓存资源
- ✅ **自动更新** - 新版本自动部署并提示更新
- ✅ **数据持久化** - localStorage 数据完全保留
- ✅ **完整图标支持** - 包含 192x192、512x512 和 favicon

## 🚀 部署方案

### 推荐方案 1：Vercel（最简单，完全免费）

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署到生产环境
```bash
# 首次部署
vercel

# 确认部署到生产
vercel --prod
```

部署后会得到一个网址，例如：`https://tlga.vercel.app`

---

### 推荐方案 2：Netlify（拖拽部署）

#### 1. 构建项目
```bash
npm run build
```

#### 2. 访问 Netlify
- 打开 https://app.netlify.com/
- 注册/登录账号
- 拖拽 `dist` 文件夹到页面上
- 自动部署完成

---

### 推荐方案 3：GitHub Pages（完全免费）

#### 1. 更新 `vite.config.ts` 添加 base
```typescript
export default defineConfig({
  base: '/tlga/', // 你的仓库名
  // ... 其他配置
})
```

#### 2. 构建并部署
```bash
npm run build

# 部署到 gh-pages 分支
npx gh-pages -d dist
```

#### 3. 在 GitHub 仓库设置中启用 Pages
- Settings → Pages → Source 选择 `gh-pages` 分支

---

## 📱 在 iPad 上使用

### 添加到主屏幕（类似安装 App）

1. **用 Safari 打开**部署后的网址
2. 点击底部的**分享**按钮 <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L8 6h3v8h2V6h3l-4-4z M19 14v5H5v-5H3v7h18v-7h-2z'/%3E%3C/svg%3E" width="20" height="20" style="display:inline;vertical-align:middle;" />
3. 向下滚动，选择 **"添加到主屏幕"**
4. 输入名称（默认是"小学霸"）
5. 点击**添加**

### 使用体验

- ✅ **独立 App 图标** - 主屏幕显示完整图标
- ✅ **全屏显示** - 无浏览器地址栏，沉浸式体验
- ✅ **快速启动** - 像原生 App 一样快速打开
- ✅ **离线可用** - 没有网络也能正常使用
- ✅ **自动同步** - 联网后数据自动同步

---

## 🔄 更新应用

### 如何发布更新

```bash
# 1. 修改代码后构建
npm run build

# 2. 部署更新（以 Vercel 为例）
vercel --prod

# 3. 用户打开 App 时自动提示更新
```

PWA 会自动检测新版本并提示用户刷新。

---

## 🎨 自定义图标

如果需要修改应用图标：

1. 编辑 `public/icon.svg`
2. 运行图标生成脚本：
```bash
npx tsx scripts/generate-icons.ts
```

会自动生成：
- `icon-192.png` - 小图标
- `icon-512.png` - 大图标
- `favicon.ico` - 浏览器标签图标

---

## 🔧 PWA 配置文件

### 关键文件

- **vite.config.ts** - PWA 插件配置
- **index.html** - PWA meta 标签
- **public/icon.svg** - 源图标
- **scripts/generate-icons.ts** - 图标生成脚本

### Service Worker 缓存策略

当前配置自动缓存：
- ✅ 所有 JavaScript/CSS/HTML
- ✅ 图片和字体文件
- ✅ Google Fonts（1年有效期）
- ✅ JSON 数据文件

---

## 📊 数据存储

### 当前存储方式

- **localStorage** - 所有数据（计划、进度、审批）
- **离线优先** - 数据存储在本地，不依赖服务器

### 多设备同步（可选）

如果需要多设备同步，可以考虑：
1. **Supabase** - 免费 PostgreSQL 后端
2. **Firebase** - 实时数据库
3. **自建服务器** - 完全控制

---

## 🎯 推荐工作流

### 开发环境
```bash
npm run dev
# 访问 http://localhost:3000/
```

### 生产部署
```bash
# 方案 A：Vercel（推荐）
vercel --prod

# 方案 B：手动构建
npm run build
# 然后上传 dist 文件夹到托管服务
```

### iPad 使用
1. 访问部署后的网址
2. 添加到主屏幕
3. 开始使用！

---

## ⚠️ 注意事项

### Safari 浏览器要求

- ✅ 必须使用 **Safari** 浏览器添加到主屏幕
- ❌ Chrome/Firefox 等浏览器在 iOS 上不支持完整 PWA

### 数据备份

建议定期导出数据：
- localStorage 数据存储在设备本地
- 清除浏览器数据会丢失所有记录
- 可以添加导出/导入功能（未来优化）

---

## 🌟 优势总结

### vs 原生 App

| 特性 | PWA | 原生 App |
|------|-----|----------|
| 开发者账号 | ❌ 不需要 | ✅ 需要（$99/年）|
| 审核流程 | ❌ 无需审核 | ✅ 需要审核 |
| 更新速度 | ⚡ 即时更新 | 🐢 审核+下载 |
| 安装方式 | 🌐 网页添加 | 📱 App Store |
| 离线支持 | ✅ 完整支持 | ✅ 完整支持 |
| 跨平台 | ✅ iPad/iPhone/PC | ❌ 单平台 |
| 成本 | 💰 完全免费 | 💰 需要账号费用 |

---

## 🆘 故障排查

### 添加到主屏幕选项不显示

1. 确保使用 **Safari** 浏览器
2. 确认访问的是 **HTTPS** 网址（Vercel/Netlify 自动提供）
3. 检查是否已经添加过

### 离线不可用

1. 首次访问时需要联网加载资源
2. 确保 Service Worker 已注册（F12 检查）
3. 清除缓存后重新访问

### 数据丢失

1. 不要清除浏览器数据
2. 不要卸载后重新安装
3. 建议定期截图备份重要数据

---

## 📚 相关资源

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Vercel 部署文档](https://vercel.com/docs)
- [Netlify 部署文档](https://docs.netlify.com/)
- [PWA 最佳实践](https://web.dev/progressive-web-apps/)

---

**现在就开始部署吧！** 🚀

推荐使用 Vercel，只需 3 条命令即可完成部署：
```bash
npm i -g vercel
vercel login
vercel --prod
```

部署完成后，在 iPad 上访问网址并添加到主屏幕即可！
