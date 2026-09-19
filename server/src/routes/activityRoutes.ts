import { Router } from 'express';
import { activityController } from '../controllers/activityController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => activityController.getFirmActivity(req, res, next));

export default router;
