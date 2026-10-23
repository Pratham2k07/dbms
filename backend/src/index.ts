import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[API] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Attach io to the req object so controllers can use it to broadcast
app.use((req: Request, res: Response, next) => {
  (req as any).io = io;
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Example: Client joins a specific shuttle room to listen for its updates
  socket.on('join_shuttle_room', (shuttleId) => {
    socket.join(`shuttle_${shuttleId}`);
    console.log(`Socket ${socket.id} joined room shuttle_${shuttleId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

import path from 'path';
import fs from 'fs';

// Routes
app.use('/api', apiRoutes);

// Serve frontend static build files (All-in-one unified port)
const frontendDistPath = path.resolve(__dirname, '../../dist');

if (fs.existsSync(frontendDistPath)) {
  console.log(`[Unified Port] Serving frontend static assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA fallback for React client-side routing
  app.use((req: Request, res: Response, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.send('JKLU Shuttle Transit Backend is running. Run `npm run build` to package frontend.');
  });
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
