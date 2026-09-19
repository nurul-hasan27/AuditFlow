import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// All document routes require authentication and tenant isolation
router.use(authenticate);

// Document details and history (both STAFF and REVIEWER within same firm)
router.get('/:id', (req, res, next) => documentController.getById(req, res, next));
router.get('/:id/versions', (req, res, next) => documentController.getVersions(req, res, next));
router.get('/:id/audit-history', (req, res, next) => documentController.getAuditHistory(req, res, next));

// Upload / Reupload document version (STAFF only)
router.post(
  '/:id/upload',
  requireRole(['STAFF']),
  upload.single('file'),
  (req, res, next) => documentController.uploadVersion(req, res, next)
);

// Reviewer Actions (REVIEWER only)
router.post(
  '/:id/start-review',
  requireRole(['REVIEWER']),
  (req, res, next) => documentController.startReview(req, res, next)
);

router.post(
  '/:id/request-correction',
  requireRole(['REVIEWER']),
  (req, res, next) => documentController.requestCorrection(req, res, next)
);

router.post(
  '/:id/approve',
  requireRole(['REVIEWER']),
  (req, res, next) => documentController.approve(req, res, next)
);

export default router;
