import { Response, NextFunction } from 'express';
import { auditService } from '../services/auditService.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ActivityController {
  async getFirmActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
      const action = req.query.action as string | undefined;
      const clientId = req.query.clientId as string | undefined;

      const activity = await auditService.getFirmActivity(req.user!.firmId, {
        limit,
        skip,
        action,
        clientId,
      });

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
