#!/bin/bash

# Git 部署脚本
# 用于快速提交、构建和部署到 GitHub Pages

set -e

echo "🚀 小学霸冒险记 - Git 部署脚本"
echo ""

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo "📝 发现未提交的更改"
    git status -s
    echo ""

    # 询问提交信息
    echo "请输入提交信息 (留空使用默认信息):"
    read COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Update $(date +%Y-%m-%d\ %H:%M)"
    fi

    echo ""
    echo "📋 提交更改: $COMMIT_MSG"
    git add .
    git commit -m "$COMMIT_MSG"
else
    echo "✅ 工作目录干净，无需提交"
fi

echo ""
echo "📤 推送到 GitHub..."
git push

echo ""
echo "🔨 构建生产版本..."
npm run build

echo ""
echo "🚀 部署到 GitHub Pages..."
npx gh-pages -d dist

echo ""
echo "✅ 部署完成！"
echo ""
echo "📱 访问地址："
echo "https://$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/\//.github.io\//')/"
echo ""
echo "💡 提示："
echo "- 首次部署需要在 GitHub 仓库设置中启用 Pages"
echo "- 部署可能需要几分钟生效"
echo "- 在 iPad Safari 访问上述网址"
echo "- 添加到主屏幕即可离线使用"
