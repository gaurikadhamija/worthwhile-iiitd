import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { seedDatabase } from './src/backend/db/seed.js';
import { apiRouter } from './src/backend/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse CLI flags like --port 3000 --host 0.0.0.0
function getCliArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return undefined;
}

const cliPort = getCliArg('--port');
const cliHost = getCliArg('--host');
const PORT = cliPort ? parseInt(cliPort, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
const HOST = cliHost || process.env.HOST || '0.0.0.0';

async function startServer() {
  const app = express();

  // Configure CORS for decoupled frontend (e.g. Vercel deployment) & local development
  const rawOrigins = process.env.CORS_ORIGIN;
  const configuredOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()) : null;

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Permissive by default or when configured with wildcard
      if (!configuredOrigins || configuredOrigins.includes('*')) return callback(null, true);
      if (configuredOrigins.includes(origin)) return callback(null, true);
      // Automatically allow Vercel production and preview deployments
      if (/\.vercel\.app$/.test(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }));

  // Parse JSON payloads
  app.use(express.json());

  // Initialize and seed database if empty
  try {
    seedDatabase();
    console.log('Database schema and campus seed verified.');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }

  // Static assets serving fallback (for image delivery from backend if requested directly)
  app.use('/images', express.static(path.resolve(__dirname, 'public/images')));
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'WorthWhile Campus Event Discovery',
      database: 'sqlite-node-22',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite middleware for React HMR / SSR bundling
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client SPA navigation
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }
      try {
        const rawHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const transformedHtml = await vite.transformIndexHtml(url, rawHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (err) {
        next(err);
      }
    });
  } else {
    // In production: serve static built files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`WorthWhile Server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
