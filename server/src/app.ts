import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/MVP while supporting configurable clientUrl
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Root welcome
  app.get('/', (_req, res) => {
    res.json({
      name: 'AuditFlow API',
      tagline: 'Audit document review, without the scattered workflow.',
      version: '1.0.0',
      status: 'operational',
    });
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Catch-all 404 handler for undefined API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route '${req.originalUrl}' not found`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
