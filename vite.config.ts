import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Chunk groupings for code splitting
const CHUNK_MAP: Record<string, string> = {
  'react': 'vendor-react',
  'react-dom': 'vendor-react',
  '@tanstack/react-router': 'vendor-tanstack',
  '@tanstack/react-query': 'vendor-tanstack',
  '@tanstack/react-table': 'vendor-tanstack',
  '@supabase/supabase-js': 'vendor-supabase',
  'recharts': 'vendor-recharts',
  'react-hook-form': 'vendor-forms',
  '@hookform/resolvers': 'vendor-forms',
  'zod': 'vendor-forms',
  'xlsx': 'vendor-xlsx',
  '@zxing/browser': 'vendor-zxing',
  'lucide-react': 'vendor-ui',
  'clsx': 'vendor-ui',
  'tailwind-merge': 'vendor-ui',
  'class-variance-authority': 'vendor-ui',
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [pkg, chunk] of Object.entries(CHUNK_MAP)) {
            if (id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/${pkg}@`)) {
              return chunk
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
