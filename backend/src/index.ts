import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { initSocket } from './services/socket.service.js';
import { pool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and production clients
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Mount API routes
app.use('/api', apiRoutes);

// Serve frontend static assets from dist
import path from 'path';
import fs from 'fs';

const distPath = path.resolve(process.cwd(), '../dist');
if (fs.existsSync(distPath)) {
  console.log(`[Unified Server] Serving frontend static assets from: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Root fallback / health
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'JKLU Shuttle Management System API',
      version: '1.0.0',
      status: 'ONLINE',
      time: new Date().toISOString(),
    });
  });
}

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 JKLU Shuttle Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-Time gateway attached`);
  console.log(`🗄️ Connected to Supabase PostgreSQL database`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    pool.end();
    console.log('Server and database pool closed.');
    process.exit(0);
  });
});
