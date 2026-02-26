import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

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
