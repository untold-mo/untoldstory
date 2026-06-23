import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function normalizeViteBase(raw?: string): string {
  const s = raw?.trim()
  if (!s || s === '/') return '/'
  const withSlash = s.startsWith('/') ? s : `/${s}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: normalizeViteBase(env.VITE_BASE_PATH),

    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: {
      sourcemap: false,
      cssMinify: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@mui')) return 'vendor-mui';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('/react-dom/') || id.includes('/react/')) return 'vendor-react';
            return 'vendor';
          },
        },
      },
    },

    server: {
      // `/api/integrations` is served by Express (port 4000). Override with VITE_OAUTH_PROXY_TARGET if needed.
      proxy: {
        '/api/integrations': {
          target: env.VITE_OAUTH_PROXY_TARGET?.trim() || 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
