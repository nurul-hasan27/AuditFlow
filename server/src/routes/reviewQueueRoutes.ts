import { Router } from 'express';
import { reviewQueueController } from '../controllers/reviewQueueController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => reviewQueueController.getQueue(req, res, next));

export default router;
