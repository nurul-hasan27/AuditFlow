import { Response, NextFunction } from 'express';
import { clientService } from '../services/clientService.js';
import { createClientSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ClientController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clients = await clientService.listClients(req.user!.firmId);
      res.status(200).json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const client = await clientService.getClientById(req.user!.firmId, req.params.id);
      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createClientSchema.parse(req.body);
      const client = await clientService.createClient(
        req.user!.firmId,
        req.user!.userId,
        validated
      );
      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
