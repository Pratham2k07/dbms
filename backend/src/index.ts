import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { initSocket } from './services/socket.service.js';
import { pool } from './config/db.js';

dotenv.config();

import app from './app.js';
const PORT = process.env.PORT || 5000;

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
initSocket(server);

let currentPort = Number(PORT);

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${currentPort} is already in use by another process.`);
    currentPort += 1;
    console.log(`🔄 Automatically retrying on port http://localhost:${currentPort}...`);
    setTimeout(() => {
      server.listen(currentPort, '0.0.0.0', () => {
        console.log(`🚀 JKLU Shuttle Unified Server running on http://localhost:${currentPort}`);
        console.log(`📡 Socket.IO Real-Time gateway attached`);
        console.log(`🗄️ Connected to MySQL database`);
        console.log(`👉 Open http://localhost:${currentPort} in your browser`);
      });
    }, 500);
  } else {
    console.error('[Server Error]', err);
  }
});

server.listen(currentPort, '0.0.0.0', () => {
  console.log(`🚀 JKLU Shuttle Unified Server running on http://localhost:${currentPort}`);
  console.log(`📡 Socket.IO Real-Time gateway attached`);
  console.log(`🗄️ Connected to MySQL database`);
  console.log(`👉 Open http://localhost:${currentPort} in your browser`);
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
