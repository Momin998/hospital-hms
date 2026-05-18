import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/react-router-dom')) return 'router';
          if (id.includes('node_modules/react-hook-form')) return 'forms';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-hot-toast')) return 'ui';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          return undefined;
        },
      },
    },
  },
})
