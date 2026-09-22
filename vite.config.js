import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function apiQuestionsPlugin() {
  const dataDir = path.resolve(__dirname, 'data');
  const dataFile = path.resolve(dataDir, 'questions.json');

  function getQuestions() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading local questions data:', err);
    }
    return null;
  }

  function saveQuestions(data) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error saving local questions data:', err);
      return false;
    }
  }

  return {
    name: 'api-questions-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === '/api/questions') {
          res.setHeader('Content-Type', 'application/json');

          if (req.method === 'GET') {
            const data = getQuestions();
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              configured: true,
              isLocalDev: true,
              data: data || []
            }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                let current = getQuestions() || [];

                if (Array.isArray(parsed.sets)) {
                  current = parsed.sets;
                } else if (parsed.set && parsed.set.id) {
                  const idx = current.findIndex(s => s.id === parsed.set.id);
                  if (idx >= 0) {
                    current[idx] = parsed.set;
                  } else {
                    current.push(parsed.set);
                  }
                }

                saveQuestions(current);
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  configured: true,
                  isLocalDev: true,
                  data: current
                }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          if (req.method === 'DELETE') {
            const id = url.searchParams.get('id');
            let current = getQuestions() || [];
            if (id) {
              current = current.filter(s => s.id !== String(id));
              saveQuestions(current);
            }
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              configured: true,
              isLocalDev: true,
              data: current
            }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiQuestionsPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
