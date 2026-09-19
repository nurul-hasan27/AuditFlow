import { Router } from 'express';
import { clientController } from '../controllers/clientController.js';
import { requirementController } from '../controllers/requirementController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All client routes require authentication (firm tenant isolation strictly enforced)
router.use(authenticate);

router.get('/', (req, res, next) => clientController.list(req, res, next));
router.post('/', (req, res, next) => clientController.create(req, res, next));
router.get('/:id', (req, res, next) => clientController.getById(req, res, next));

// Document requirements for a client
router.get('/:id/requirements', (req, res, next) =>
  requirementController.getRequirementsForClient(req, res, next)
);
router.post(
  '/:id/requirements',
  requireRole(['REVIEWER']),
  (req, res, next) => requirementController.createRequirement(req, res, next)
);

export default router;
