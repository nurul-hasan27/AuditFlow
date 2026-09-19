import { Response, NextFunction } from 'express';
import { reviewQueueService } from '../services/reviewQueueService.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ReviewQueueController {
  async getQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const queue = await reviewQueueService.getQueue(req.user!.firmId);
      res.status(200).json({
        success: true,
        data: queue,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewQueueController = new ReviewQueueController();
