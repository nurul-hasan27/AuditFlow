import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import documentRoutes from './documentRoutes.js';
import reviewQueueRoutes from './reviewQueueRoutes.js';
import activityRoutes from './activityRoutes.js';
import requirementRoutes from './requirementRoutes.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AuditFlow API',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/requirements', requirementRoutes);
apiRouter.use('/review-queue', reviewQueueRoutes);
apiRouter.use('/activity', activityRoutes);

export default apiRouter;
