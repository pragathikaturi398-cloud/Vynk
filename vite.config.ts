import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function geminiDevPlugin(): Plugin {
  return {
    name: 'gemini-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { default: handler } = await import('./api/gemini.ts');
              const jsonBody = body ? JSON.parse(body) : {};
              const mockReq = { method: 'POST', body: jsonBody };
              const mockRes = {
                status: (code: number) => ({
                  json: (data: any) => {
                    res.statusCode = code;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end(),
                }),
                setHeader: (k: string, v: string) => res.setHeader(k, v),
              };
              await handler(mockReq, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), geminiDevPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
