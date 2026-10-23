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

// Routes
app.use('/api', apiRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.send('Backend Server is running with WebSockets!');
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
