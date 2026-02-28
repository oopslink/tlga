import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import type { PluginCreator } from 'postcss'

/**
 * PostCSS plugin: scope all CSS selectors to .tlga-obsidian-root
 * so that our global styles don't pollute Obsidian's own UI.
 *
 * Rules:
 *  - :root  → kept as-is (CSS variables need to be global)
 *  - html / body / #app  → remapped to .tlga-obsidian-root
 *  - @keyframes / @font-face contents → kept as-is
 *  - everything else  → prefixed with .tlga-obsidian-root
 */
const scopeToObsidianRoot: PluginCreator<void> = () => ({
  postcssPlugin: 'scope-to-obsidian-root',
  Rule(rule) {
    const parent = rule.parent as { type?: string; name?: string } | undefined
    // Skip rules nested inside @keyframes
    if (parent?.type === 'atrule' && /keyframes/i.test(parent.name ?? '')) return
    // Keep :root as-is
    if (/^:root(\s|,|$)/.test(rule.selector.trim())) return
    // Skip already scoped
    if (rule.selector.includes('.tlga-obsidian-root')) return

    rule.selector = rule.selector
      .split(',')
      .map(s => {
        const trimmed = s.trim()
        if (/^(html|body|#app)$/.test(trimmed)) return '.tlga-obsidian-root'
        return `.tlga-obsidian-root ${trimmed}`
      })
      .join(', ')
  },
})
scopeToObsidianRoot.postcss = true

/**
 * Obsidian Plugin Build Config
 *
 * 输出到 dist-obsidian/，包含：
 *   main.js     — 插件主体（CJS，Obsidian 要求）
 *   styles.css  — 样式（Obsidian 自动加载此文件名）
 *   manifest.json — 由 npm script 复制进来
 *
 * 安装到 Obsidian Vault：
 *   复制 dist-obsidian/ 内容到 {vault}/.obsidian/plugins/tlga-adventure/
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  css: {
    postcss: {
      plugins: [scopeToObsidianRoot()],
    },
  },

  define: {
    // 强制使用 localStorage 存储（与 Web 生产模式一致）
    'import.meta.env.PROD': 'true',
    'import.meta.env.DEV': 'false',
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/obsidian-entry.ts'),
      name: 'TlgaPlugin',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },

    rollupOptions: {
      // obsidian 由 Obsidian 运行时提供，不打包进去
      external: ['obsidian'],
      output: {
        // 内联所有动态 import，输出单文件 main.js
        inlineDynamicImports: true,
        // Obsidian 要求样式文件名为 styles.css
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some(n => n.endsWith('.css'))) return 'styles.css'
          return '[name][extname]'
        },
        globals: { obsidian: 'obsidian' },
      },
    },

    outDir: 'dist-obsidian',
    emptyOutDir: true,
    sourcemap: false,
    minify: false, // 保持可读，便于 Obsidian 社区审核
  },
})
