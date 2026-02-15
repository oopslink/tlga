# 📱 完全离线安装到 iPad（无需联网）

## 🎯 目标

在 iPad 上完全本地运行应用，**不需要任何网络连接**。

---

## ✅ 推荐方案：使用 iSH

**iSH** 是一个免费的 iOS App，可以在 iPad 上运行 Linux 环境和 Web 服务器。

### 优势

- ✅ 完全免费
- ✅ 不需要越狱
- ✅ 完全离线
- ✅ 一次设置，永久使用
- ✅ 数据完全本地

---

## 📦 准备工作（在电脑上）

### 1. 构建生产版本

```bash
# 进入项目目录
cd /path/to/tlga

# 构建
npm run build

# 构建完成后，dist 文件夹包含所有文件
```

### 2. 压缩文件

```bash
# 进入 dist 目录
cd dist

# 压缩所有文件
zip -r ../tlga-app.zip .

# 返回项目根目录
cd ..
```

现在您有一个 `tlga-app.zip` 文件（约 2-3 MB）。

### 3. 传输到 iPad

选择一种方式：

**方式 A：AirDrop**
- 右键 tlga-app.zip → 共享 → AirDrop
- 选择您的 iPad
- 保存到"文件"App

**方式 B：iCloud Drive**
- 将 tlga-app.zip 拖到 iCloud Drive
- 在 iPad "文件"App 中访问

**方式 C：邮件**
- 将 tlga-app.zip 作为附件发送给自己
- 在 iPad 上下载附件

---

## 🚀 在 iPad 上安装

### 步骤 1：安装 iSH

1. 打开 **App Store**
2. 搜索 "**iSH Shell**"
3. 点击"获取"安装（完全免费）
4. 打开 iSH

### 步骤 2：安装 Web 服务器

在 iSH 中输入以下命令：

```bash
# 更新包管理器
apk update

# 安装 Python（包含简单的 HTTP 服务器）
apk add python3

# 验证安装
python3 --version
```

应该看到类似：`Python 3.x.x`

### 步骤 3：创建应用目录

```bash
# 创建应用目录
mkdir -p ~/tlga

# 进入目录
cd ~/tlga
```

### 步骤 4：导入应用文件

**方法 1：通过 Files App（推荐）**

1. 在 iSH 中运行：
```bash
# 创建一个符号链接到 iOS Files
cd ~
```

2. 在 iPad "文件"App 中：
   - 找到 tlga-app.zip
   - 点击并解压
   - 将解压后的所有文件移动到：
     `我的 iPad → iSH → root → tlga`

**方法 2：在 iSH 中解压**

如果文件已在 iSH 可访问位置：

```bash
cd ~/tlga
unzip ~/Downloads/tlga-app.zip
```

### 步骤 5：验证文件

```bash
# 查看文件
ls -la

# 应该看到：
# index.html
# assets/
# icon-192.png
# 等文件
```

### 步骤 6：启动 Web 服务器

```bash
# 在 tlga 目录中启动服务器
cd ~/tlga
python3 -m http.server 8080

# 看到：
# Serving HTTP on 0.0.0.0 port 8080 ...
```

**重要：** 保持 iSH App 运行在后台！

### 步骤 7：在 Safari 访问

1. 打开 **Safari**
2. 访问：`http://localhost:8080`
3. 应用加载成功！

### 步骤 8：添加到主屏幕

1. 点击**分享按钮** ↑
2. 选择 "**添加到主屏幕**"
3. 命名为 "小学霸"
4. 点击"添加"

### 步骤 9：自动启动脚本（可选）

创建一个启动脚本，方便以后使用：

```bash
# 创建启动脚本
cat > ~/start-tlga.sh << 'EOF'
#!/bin/sh
cd ~/tlga
python3 -m http.server 8080
EOF

# 添加执行权限
chmod +x ~/start-tlga.sh
```

以后只需运行：
```bash
~/start-tlga.sh
```

---

## 📱 日常使用

### 每次使用流程

```
1. 打开 iSH App
   ↓
2. 运行启动脚本
   ~/start-tlga.sh
   ↓
3. 保持 iSH 在后台运行
   ↓
4. 从主屏幕打开"小学霸"
   ↓
5. 正常使用！
```

### 关键点

- ✅ iSH 必须保持运行（可以在后台）
- ✅ 第一次启动后可以最小化 iSH
- ✅ 所有数据存储在 iPad 本地
- ✅ 完全不需要网络

---

## 🔧 进阶：自动启动（iOS 快捷指令）

### 创建快捷指令

1. 打开"快捷指令"App
2. 创建新快捷指令
3. 添加动作：
   - "打开 App" → iSH
   - "等待" 2 秒
   - "运行脚本" → `~/start-tlga.sh`
4. 命名为"启动小学霸"
5. 添加到主屏幕

**使用：**
- 点击"启动小学霸"快捷指令
- 自动打开 iSH 并启动服务器
- 然后打开"小学霸"App

---

## 📊 完整架构

```
iPad 本地
├── iSH App (Linux 环境)
│   ├── Python 3 HTTP 服务器
│   └── ~/tlga/ (应用文件)
│       ├── index.html
│       ├── assets/
│       └── 所有资源
├── Safari (浏览器)
│   └── localStorage (数据存储)
│       ├── 周计划
│       ├── 进度单
│       ├── 审批记录
│       └── 自定义任务
└── 主屏幕
    └── "小学霸"图标 (PWA)
```

**特点：**
- ✅ 所有组件在 iPad 本地
- ✅ 完全不依赖网络
- ✅ 完全不依赖外部设备

---

## 🆘 故障排查

### Q1: iSH 中无法下载 Python？

**解决：**
```bash
# 尝试更换镜像源
echo "http://dl-cdn.alpinelinux.org/alpine/v3.14/main" > /etc/apk/repositories
apk update
apk add python3
```

### Q2: 无法访问 localhost:8080？

**检查：**
1. iSH App 是否在运行
2. 服务器是否启动成功
3. 端口号是否正确
4. 尝试 `http://127.0.0.1:8080`

### Q3: 文件传输失败？

**解决：**
- 使用 AirDrop 更可靠
- 或使用 iCloud Drive
- 确保文件解压到正确位置

### Q4: Safari 无法添加到主屏幕？

**检查：**
- 是否使用 Safari（不是 Chrome）
- URL 是否正确（http://localhost:8080）
- 页面是否完全加载

### Q5: 数据丢失？

**预防：**
- 不要清除 Safari 数据
- 不要删除 iSH 中的文件
- 定期截图重要记录

---

## 🔄 更新应用

### 如何更新到新版本

1. **在电脑上构建新版本**
```bash
npm run build
cd dist
zip -r ../tlga-app-v2.zip .
```

2. **传输到 iPad**
   - 使用之前相同的方法

3. **在 iSH 中替换文件**
```bash
# 备份旧版本
cd ~
mv tlga tlga-backup

# 创建新目录
mkdir tlga
cd tlga

# 解压新版本
unzip ~/Downloads/tlga-app-v2.zip
```

4. **重启服务器**
```bash
python3 -m http.server 8080
```

5. **清除 Safari 缓存**
   - Safari → 清除历史记录和网站数据
   - 重新访问和添加到主屏幕

---

## 💡 优化技巧

### 1. 设置 iSH 为常驻后台

- 设置 → 通用 → 后台App刷新
- 开启 iSH 的后台刷新

### 2. 创建启动图标

- 使用快捷指令创建一键启动
- 添加到主屏幕

### 3. 定期备份

```bash
# 在 iSH 中备份应用文件
cd ~
tar -czf tlga-backup.tar.gz tlga

# 在 iPad Files App 中可以看到这个备份文件
```

---

## 📈 性能对比

| 指标 | iSH 方案 | 云端 PWA |
|------|----------|----------|
| 启动速度 | 3-5 秒 | < 1 秒 |
| 运行速度 | 正常 | 正常 |
| 依赖网络 | ❌ 否 | ⚠️ 首次 |
| 依赖外部 | ❌ 否 | ⚠️ 首次 |
| 设置复杂度 | 中 | 低 |
| 维护成本 | 中 | 低 |

---

## ✅ 总结

### 一次性设置

```bash
1. App Store 安装 iSH
2. 构建 + 传输应用文件
3. 在 iSH 中安装 Python
4. 启动 HTTP 服务器
5. Safari 访问并添加到主屏幕
```

### 日常使用

```bash
1. 打开 iSH
2. 运行 ~/start-tlga.sh
3. 打开"小学霸"App
4. 正常使用（完全离线）
```

### 最终效果

- ✅ 完全在 iPad 本地运行
- ✅ 不需要任何网络连接
- ✅ 不需要任何外部设备
- ✅ 数据完全本地存储
- ✅ 像真正的原生 App

---

## 🎉 开始安装！

现在就按照步骤操作，把应用完全安装到 iPad 上！

**需要帮助？** 告诉我您在哪一步遇到问题，我会详细指导。

---

**完全离线的独立 App！** 🚀
