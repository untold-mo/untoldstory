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
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

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
