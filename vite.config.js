import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

const isAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
  // GitHub Pages 部署需要设置 base URL
  // 如果部署到自定义域名，请将 base 改为 '/'
  base: '/nonocross/',

  plugins: [
    vue(),

    // PWA 支持
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'puzzles.json'],
      manifest: {
        name: 'Nonocross',
        short_name: 'Nonocross',
        description: 'A browser-based Nonogram puzzle game',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),

    // 构建分析（仅在 ANALYZE=true 时启用）
    isAnalyze
      ? visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: 'dist/stats.html',
        })
      : null,
  ].filter(Boolean),

  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 Vue 核心库单独打包
          if (id.includes('node_modules/vue')) {
            return 'vendor'
          }
          // 将游戏逻辑单独打包
          if (id.includes('/src/solver.js')) {
            return 'game'
          }
        },
      },
    },

    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // 移除 console.*
        drop_debugger: true,     // 移除 debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,         // 移除注释
      },
    },

    // 源映射（生产环境建议关闭）
    sourcemap: false,

    // 资源内联阈值（小于 4KB 内联为 base64）
    assetsInlineLimit: 4096,

    // 代码块大小警告阈值
    chunkSizeWarningLimit: 500,
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
  },

  // 预览服务器配置
  preview: {
    port: 4173,
  },

  // 路径解析
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
