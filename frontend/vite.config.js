import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory
    outDir: 'dist',
    // Source map for production debugging (optional, remove for smaller bundle)
    sourcemap: false,
    // Minification
    minify: 'terser',
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // Rollup options
    rollupOptions: {
      output: {
        // Asset naming for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          } else if (/woff|woff2|ttf|otf|eot/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`
          } else if (ext === 'js') {
            return `js/[name]-[hash][extname]`
          }
          return `[name]-[hash][extname]`
        },
        // Chunk naming for caching
        chunkFileNames: 'js/[name]-[hash].js',
        // Entry file naming
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
  },
  // Server configuration for development
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
