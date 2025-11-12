import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  server: {
    proxy: {
      // Proxy สำหรับ Lambda API (แก้ปัญหา CORS ใน development)
      '^/(table|users|user|connection)': {
        target: 'https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('➡️  Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },

  // Build optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // แยก vendor chunks เพื่อ caching ที่ดีขึ้น
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aws-vendor': ['amazon-cognito-identity-js']
        }
      }
    },
    // Minify with esbuild (faster than terser and built-in)
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 500
  }
})