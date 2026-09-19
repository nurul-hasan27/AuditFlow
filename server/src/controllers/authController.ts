import { Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { loginSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated.email, validated.password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId, req.user!.firmId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
