import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();

// Enable CORS for frontend clients
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

// Request Logger in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// URL path normalization for Vercel and serverless environments
app.use((req: Request, _res: Response, next: NextFunction) => {
  const matchedHeader = (req.headers['x-matched-path'] as string) || (req.headers['x-forwarded-uri'] as string);
  if (matchedHeader && (req.url === '/api/index' || req.url === '/api' || req.url.startsWith('/api/index?'))) {
    req.url = matchedHeader;
  } else if (req.query?.__path && typeof req.query.__path === 'string') {
    const rawPath = req.query.__path.startsWith('/') ? req.query.__path : `/${req.query.__path}`;
    req.url = rawPath;
  }
  next();
});

// Health check on root and /api
const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'JKLU Shuttle Transit Backend API',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount API routes on both /api and root level for flexible serverless hosting
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// 404 Handler for undefined routes
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

export default app;
