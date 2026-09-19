import { Router } from 'express';
import { requirementController } from '../controllers/requirementController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All requirement management endpoints require authentication and REVIEWER role
router.use(authenticate);

// Update / rename requirement (Reviewer only)
router.patch(
  '/:requirementId',
  requireRole(['REVIEWER']),
  (req, res, next) => requirementController.updateRequirement(req, res, next)
);

// Deactivate requirement (Reviewer only)
router.patch(
  '/:requirementId/deactivate',
  requireRole(['REVIEWER']),
  (req, res, next) => requirementController.deactivateRequirement(req, res, next)
);

// Reactivate requirement (Reviewer only)
router.patch(
  '/:requirementId/activate',
  requireRole(['REVIEWER']),
  (req, res, next) => requirementController.activateRequirement(req, res, next)
);

export default router;
