import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 项目根目录
  root: '.',

  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',

    // 代码分割配置
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['web-vitals'],
          router: ['src/modules/router.js'],
          utils: ['src/utils/logger.js', 'src/utils/performance.js']
        },
        // 确保动态导入的组件能够正确解析
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // 资源处理
    assetsInlineLimit: 4096,

    // 压缩配置
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,

    // 代理配置（用于开发时的API请求）
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: true
  },

  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },

  // CSS配置
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },

  // 环境变量配置
  envPrefix: 'VITE_',

  // 插件配置
  plugins: [],

  // 优化配置
  optimizeDeps: {
    include: ['web-vitals'],
    exclude: []
  },

  // 实验性功能
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  },

  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});
