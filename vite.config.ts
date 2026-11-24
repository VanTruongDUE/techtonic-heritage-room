import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function localApiDevPlugin(): Plugin {
  return {
    name: 'techtonic-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url?.split('?')[0];
        if (!urlPath || !urlPath.startsWith('/api/')) {
          return next();
        }

        const routeMap: Record<string, string> = {
          '/api/health': '/api/health.ts',
          '/api/heritage': '/api/heritage.ts',
          '/api/guestbook': '/api/guestbook.ts',
        };

        const modulePath = routeMap[urlPath];
        if (!modulePath) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'API route not found' }));
          return;
        }

        try {
          const mod = await server.ssrLoadModule(modulePath);
          await mod.default(req, res);
        } catch (err) {
          console.error(`Local API error on ${urlPath}:`, err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@dimforge')) return 'vendor-rapier-wasm';
          if (id.includes('node_modules/three/') || id.includes('node_modules\\three\\')) {
            return 'vendor-three';
          }
          if (id.includes('@react-three')) return 'vendor-r3f';
          if (
            id.includes('react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules\\react\\') ||
            id.includes('zustand') ||
            id.includes('lucide-react')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
