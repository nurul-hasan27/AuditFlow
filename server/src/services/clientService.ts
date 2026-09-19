import { Types } from 'mongoose';
import { Client, IClient } from '../models/Client.js';
import { DocumentModel } from '../models/Document.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditService } from './auditService.js';

const STANDARD_DOCUMENT_CHECKLIST = [
  { title: 'Bank Statement', category: 'Banking' },
  { title: 'Sales Register', category: 'Sales & Invoicing' },
  { title: 'Purchase Register', category: 'Procurement & Expenses' },
  { title: 'GST Return', category: 'Statutory & Tax' },
  { title: 'Expense Summary', category: 'Financial Summary' },
];

export class ClientService {
  /**
   * Lists all clients for the authenticated firm with aggregate document statuses.
   * Multi-tenancy strictly enforced via firmId filter.
   */
  async listClients(firmId: string) {
    const firmObjectId = new Types.ObjectId(firmId);
    const clients = await Client.find({ firmId: firmObjectId })
      .sort({ createdAt: -1 })
      .populate('assignedStaffId', 'name email')
      .lean();

    const clientSummaries = await Promise.all(
      clients.map(async (client) => {
        const documents = await DocumentModel.find({
          firmId: firmObjectId,
          clientId: client._id,
        }).lean();

        const totalDocs = documents.length;
        const approvedDocs = documents.filter((d) => d.status === 'APPROVED').length;
        const correctionDocs = documents.filter((d) => d.status === 'CORRECTION_REQUIRED').length;
        const underReviewDocs = documents.filter((d) => d.status === 'UNDER_REVIEW').length;
        const pendingDocs = documents.filter((d) => d.status === 'PENDING').length;
        const uploadedDocs = documents.filter((d) => d.status === 'UPLOADED').length;

        // Fetch last activity
        const lastAudit = await AuditEvent.findOne({
          firmId: firmObjectId,
          clientId: client._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...client,
          id: client._id,
          stats: {
            total: totalDocs,
            approved: approvedDocs,
            correctionRequired: correctionDocs,
            underReview: underReviewDocs,
            pending: pendingDocs,
            uploaded: uploadedDocs,
            completionPercentage: totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0,
          },
          lastActivityAt: lastAudit ? lastAudit.createdAt : client.createdAt,
        };
      })
    );

    return clientSummaries;
  }

  /**
   * Retrieves single client with full document requirements checklist.
   * Returns 404 if client does not exist OR belongs to another tenant.
   */
  async getClientById(firmId: string, clientId: string) {
    const firmObjectId = new Types.ObjectId(firmId);

    if (!Types.ObjectId.isValid(clientId)) {
      throw new AppError('Client not found', 404);
    }

    const client = await Client.findOne({
      _id: new Types.ObjectId(clientId),
      firmId: firmObjectId,
    })
      .populate('assignedStaffId', 'name email role')
      .lean();

    if (!client) {
      // Safe 404: Does not reveal whether ID exists in another firm!
      throw new AppError('Client not found or inaccessible', 404);
    }

    const documents = await DocumentModel.find({
      firmId: firmObjectId,
      clientId: client._id,
    })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    const stats = {
      total: documents.length,
      approved: documents.filter((d) => d.status === 'APPROVED').length,
      correctionRequired: documents.filter((d) => d.status === 'CORRECTION_REQUIRED').length,
      underReview: documents.filter((d) => d.status === 'UNDER_REVIEW').length,
      pending: documents.filter((d) => d.status === 'PENDING').length,
      uploaded: documents.filter((d) => d.status === 'UPLOADED').length,
    };

    return {
      ...client,
      id: client._id,
      stats,
      documents: documents.map((doc) => ({
        ...doc,
        id: doc._id,
      })),
    };
  }

  /**
   * Creates a new client and initializes their standard audit document checklist.
   */
  async createClient(
    firmId: string,
    actorId: string,
    data: {
      name: string;
      industry?: string;
      financialYear?: string;
      gstin?: string;
      pan?: string;
    }
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actorId);

    const client = await Client.create({
      firmId: firmObjectId,
      name: data.name.trim(),
      industry: data.industry || 'General Trade',
      financialYear: data.financialYear || '2025-26',
      gstin: data.gstin?.trim(),
      pan: data.pan?.trim(),
      assignedStaffId: actorObjectId,
    });

    // Initialize the standard 5 audit document requirements
    await Promise.all(
      STANDARD_DOCUMENT_CHECKLIST.map((item) =>
        DocumentModel.create({
          firmId: firmObjectId,
          clientId: client._id,
          title: item.title,
          category: item.category,
          status: 'PENDING',
          currentVersionNumber: 0,
        })
      )
    );

    // Record audit event
    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: client._id,
      action: 'CLIENT_CREATED',
      comment: `Client engagement '${client.name}' created with standard audit document checklist`,
      metadata: { clientName: client.name, financialYear: client.financialYear },
    });

    return this.getClientById(firmId, client._id.toString());
  }
}

export const clientService = new ClientService();
