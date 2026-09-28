import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            // Normalise path so checks match exact package folders
            const m = id.replace(/\\/g, '/').split('/node_modules/').pop() || '';
            const pkg = m.startsWith('@') ? m.split('/').slice(0, 2).join('/') : m.split('/')[0];

            if (pkg === 'xlsx' || pkg === 'papaparse') return 'vendor-xlsx';
            if (pkg === 'recharts' || pkg.startsWith('d3-') || pkg === 'victory-vendor' || pkg === 'internmap' || pkg === 'decimal.js-light' || pkg === 'es-toolkit' || pkg === '@reduxjs/toolkit' || pkg === 'react-redux' || pkg === 'immer' || pkg === 'redux') return 'vendor-charts';
            if (pkg === 'firebase' || pkg.startsWith('@firebase/') || pkg === 'idb' || pkg === '@grpc/grpc-js' || pkg === 'protobufjs') return 'vendor-firebase';
            if (pkg === 'lucide-react') return 'vendor-icons';
            if (pkg === 'motion' || pkg === 'framer-motion' || pkg === 'motion-dom' || pkg === 'motion-utils') return 'vendor-motion';
            if (pkg === 'date-fns' || pkg === 'react-day-picker' || pkg === '@date-fns/tz') return 'vendor-date';
            if (pkg === '@base-ui/react' || pkg === '@base-ui/utils' || pkg.startsWith('@floating-ui/') || pkg === '@radix-ui' || pkg.startsWith('@radix-ui/') || pkg === 'class-variance-authority' || pkg === 'clsx' || pkg === 'tailwind-merge' || pkg === 'sonner' || pkg === 'tabbable' || pkg === 'reselect' || pkg === 'use-sync-external-store') return 'vendor-ui';
            if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') return 'vendor-react';
          }
        }
      }
    },
  };
});
