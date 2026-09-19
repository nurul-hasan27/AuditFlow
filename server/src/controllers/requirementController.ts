import { Response, NextFunction } from 'express';
import { requirementService } from '../services/requirementService.js';
import { createRequirementSchema, updateRequirementSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../types/index.js';

export class RequirementController {
  async getRequirementsForClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.params.clientId || req.params.id;
      const includeInactive = req.query.includeInactive === 'true' || req.user?.role === 'REVIEWER';
      const requirements = await requirementService.getRequirementsForClient(
        req.user!.firmId,
        clientId,
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: requirements,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRequirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.params.clientId || req.params.id;
      const validated = createRequirementSchema.parse(req.body);
      const requirement = await requirementService.createRequirement(
        req.user!.firmId,
        clientId,
        { id: req.user!.userId, name: req.user!.name, role: req.user!.role },
        validated
      );

      res.status(201).json({
        success: true,
        message: 'Document requirement created successfully',
        data: requirement,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRequirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateRequirementSchema.parse(req.body);
      const requirement = await requirementService.updateRequirement(
        req.user!.firmId,
        req.params.requirementId,
        { id: req.user!.userId, name: req.user!.name },
        validated
      );

      res.status(200).json({
        success: true,
        message: 'Document requirement updated successfully',
        data: requirement,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateRequirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requirement = await requirementService.deactivateRequirement(
        req.user!.firmId,
        req.params.requirementId,
        { id: req.user!.userId, name: req.user!.name }
      );

      res.status(200).json({
        success: true,
        message: 'Document requirement deactivated successfully',
        data: requirement,
      });
    } catch (error) {
      next(error);
    }
  }

  async activateRequirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requirement = await requirementService.activateRequirement(
        req.user!.firmId,
        req.params.requirementId,
        { id: req.user!.userId, name: req.user!.name }
      );

      res.status(200).json({
        success: true,
        message: 'Document requirement reactivated successfully',
        data: requirement,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const requirementController = new RequirementController();
