import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { connectDB } from './config/db.js';
import { dataRepository } from './models/dataRepository.js';
import { monitorEngine } from './services/monitorEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/api/stream' && req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Real-Time Server-Sent Events (SSE) Stream
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date(), message: 'Connected to NetWatch SSE stream' })}\n\n`);

  monitorEngine.addSseClient(res);

  // Send periodic keep-alive ping every 15s
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// API Routes
app.use('/api', apiRouter);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    await dataRepository.seedIfEmpty();

    // Start background network prober cycle
    monitorEngine.start(5000);

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🛡️  NetWatch NOC Core Backend Server running on port ${PORT}`);
      console.log(`📡 API Base:   http://localhost:${PORT}/api`);
      console.log(`⚡ Stream:     http://localhost:${PORT}/api/stream`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start NetWatch server:', err);
    process.exit(1);
  }
}

startServer();
