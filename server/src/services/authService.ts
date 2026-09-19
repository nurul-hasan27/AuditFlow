import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Firm } from '../models/Firm.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedUserPayload } from '../types/index.js';
import { auditService } from './auditService.js';

export class AuthService {
  async login(email: string, candidatePassword: string) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    const isMatch = await user.comparePassword(candidatePassword);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    const firm = await Firm.findById(user.firmId);
    if (!firm) {
      throw new AppError('Firm associated with this account could not be found', 404);
    }

    const payload: AuthenticatedUserPayload = {
      userId: user._id.toString(),
      firmId: user.firmId.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d',
    });

    // Record login audit event
    await auditService.record({
      firmId: user.firmId,
      actorId: user._id,
      action: 'USER_LOGIN',
      comment: `User ${user.name} (${user.role}) logged in successfully`,
      metadata: { role: user.role, email: user.email },
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firm: {
          id: firm._id,
          name: firm.name,
          code: firm.code,
        },
      },
    };
  }

  async getCurrentUser(userId: string, firmId: string) {
    const user = await User.findOne({ _id: userId, firmId }).select('-password');
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    const firm = await Firm.findById(firmId);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      firm: firm
        ? {
            id: firm._id,
            name: firm.name,
            code: firm.code,
          }
        : null,
    };
  }
}

export const authService = new AuthService();
