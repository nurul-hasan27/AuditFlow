import { Response, NextFunction } from 'express';
import { documentService } from '../services/documentService.js';
import { auditService } from '../services/auditService.js';
import { requestCorrectionSchema, approveDocumentSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class DocumentController {
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await documentService.getDocumentById(req.user!.firmId, req.params.id);
      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadVersion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No document file was uploaded. Please select a valid file.', 400);
      }

      const updatedDoc = await documentService.uploadDocumentVersion(
        req.user!.firmId,
        req.params.id,
        { id: req.user!.userId, name: req.user!.name, role: req.user!.role },
        req.file,
        req.body?.notes
      );

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  async startReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updatedDoc = await documentService.startReview(
        req.user!.firmId,
        req.params.id,
        { id: req.user!.userId, name: req.user!.name }
      );

      res.status(200).json({
        success: true,
        message: 'Review started successfully',
        data: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestCorrection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = requestCorrectionSchema.parse(req.body);
      const updatedDoc = await documentService.requestCorrection(
        req.user!.firmId,
        req.params.id,
        { id: req.user!.userId, name: req.user!.name },
        validated.comment
      );

      res.status(200).json({
        success: true,
        message: 'Correction requested successfully',
        data: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = approveDocumentSchema.parse(req.body);
      const updatedDoc = await documentService.approveDocument(
        req.user!.firmId,
        req.params.id,
        { id: req.user!.userId, name: req.user!.name },
        validated.comment
      );

      res.status(200).json({
        success: true,
        message: 'Document approved successfully',
        data: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const versions = await documentService.getDocumentVersions(req.user!.firmId, req.params.id);
      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const timeline = await auditService.getDocumentTimeline(req.user!.firmId, req.params.id);
      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
