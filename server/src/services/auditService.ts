import { Types } from 'mongoose';
import { AuditEvent, IAuditEvent } from '../models/AuditEvent.js';
import { AuditAction } from '../types/index.js';

export interface RecordAuditParams {
  firmId: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  action: AuditAction;
  clientId?: string | Types.ObjectId;
  requirementId?: string | Types.ObjectId;
  documentId?: string | Types.ObjectId;
  documentVersionId?: string | Types.ObjectId;
  comment?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Records an append-only, immutable audit event.
   * Internal business services call this; there is NO direct user endpoint to create arbitrary audit events.
   */
  async record(params: RecordAuditParams): Promise<IAuditEvent> {
    const event = await AuditEvent.create({
      firmId: new Types.ObjectId(params.firmId.toString()),
      actorId: new Types.ObjectId(params.actorId.toString()),
      action: params.action,
      clientId: params.clientId ? new Types.ObjectId(params.clientId.toString()) : undefined,
      requirementId: params.requirementId
        ? new Types.ObjectId(params.requirementId.toString())
        : undefined,
      documentId: params.documentId ? new Types.ObjectId(params.documentId.toString()) : undefined,
      documentVersionId: params.documentVersionId
        ? new Types.ObjectId(params.documentVersionId.toString())
        : undefined,
      comment: params.comment?.trim(),
      metadata: params.metadata || {},
    });

    return event;
  }

  /**
   * Retrieves timeline of audit events for a specific document.
   * Guarantees tenant isolation: firmId is enforced in query filter.
   */
  async getDocumentTimeline(firmId: string | Types.ObjectId, documentId: string | Types.ObjectId) {
    const events = await AuditEvent.find({
      firmId: new Types.ObjectId(firmId.toString()),
      documentId: new Types.ObjectId(documentId.toString()),
    })
      .sort({ createdAt: -1 })
      .populate('actorId', 'name email role')
      .populate('documentVersionId', 'versionNumber fileName')
      .lean();

    return events.map((e: any) => ({
      _id: e._id,
      action: e.action,
      comment: e.comment,
      metadata: e.metadata,
      createdAt: e.createdAt,
      actor: e.actorId
        ? {
            id: e.actorId._id,
            name: e.actorId.name,
            email: e.actorId.email,
            role: e.actorId.role,
          }
        : null,
      versionNumber: e.metadata?.version || e.documentVersionId?.versionNumber,
    }));
  }

  /**
   * Retrieves firm-wide activity feed for audit compliance dashboard.
   * Guarantees tenant isolation: firmId is strictly enforced.
   */
  async getFirmActivity(
    firmId: string | Types.ObjectId,
    options: {
      limit?: number;
      skip?: number;
      action?: string;
      clientId?: string;
    } = {}
  ) {
    const { limit = 20, skip = 0, action, clientId } = options;
    const query: any = { firmId: new Types.ObjectId(firmId.toString()) };

    if (action) {
      query.action = action;
    }
    if (clientId) {
      query.clientId = new Types.ObjectId(clientId);
    }

    const [events, total] = await Promise.all([
      AuditEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email role')
        .populate('clientId', 'name industry')
        .populate('documentId', 'title category')
        .lean(),
      AuditEvent.countDocuments(query),
    ]);

    return {
      events: events.map((e: any) => ({
        _id: e._id,
        action: e.action,
        comment: e.comment,
        metadata: e.metadata,
        createdAt: e.createdAt,
        actor: e.actorId
          ? {
              id: e.actorId._id,
              name: e.actorId.name,
              email: e.actorId.email,
              role: e.actorId.role,
            }
          : null,
        client: e.clientId
          ? {
              id: e.clientId._id,
              name: e.clientId.name,
            }
          : null,
        document: e.documentId
          ? {
              id: e.documentId._id,
              title: e.documentId.title,
            }
          : null,
      })),
      total,
      limit,
      skip,
    };
  }
}

export const auditService = new AuditService();
