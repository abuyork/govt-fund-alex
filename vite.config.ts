import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/bizinfo-api': {
        target: 'https://www.bizinfo.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bizinfo-api/, '/uss/rss/bizinfoApi.do'),
        configure: (proxy) => {
          // Set longer timeouts for slow API responses
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        }
      }
    }
  },
  // Performance optimizations for build
  build: {
    // Enable chunking for better caching
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true
      }
    },
    // Generate sourcemaps for production
    sourcemap: true,
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        }
      }
    }
  }
});
