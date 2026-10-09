import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite';
import type { ServerResponse } from 'http';
import react from '@vitejs/plugin-react';

function imagekitProxyPlugin(): Plugin {
  let privateKey = '';

  const handleApiRequest = async (req: Connect.IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (!privateKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY is not defined in environment variables' }));
      return;
    }

    try {
      const urlObj = new URL(req.url || '', 'http://localhost');
      const queryString = urlObj.search;
      const targetUrl = `https://api.imagekit.io/v1/files${queryString}`;
      const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;

      const response = await fetch(targetUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      const body = await response.text();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch from ImageKit';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: errorMessage }));
    }
  };

  return {
    name: 'imagekit-proxy',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '');
      privateKey = env.IMAGEKIT_PRIVATE_KEY || '';
    },
    configureServer(server) {
      server.middlewares.use('/api/files', handleApiRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/files', handleApiRequest);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), imagekitProxyPlugin()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173, // Default Vite port
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

