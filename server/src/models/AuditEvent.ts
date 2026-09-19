import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import { AuditAction } from '../types/index.js';

export interface IAuditEvent extends MongooseDocument {
  firmId: Types.ObjectId;
  clientId?: Types.ObjectId;
  requirementId?: Types.ObjectId;
  documentId?: Types.ObjectId;
  documentVersionId?: Types.ObjectId;
  actorId: Types.ObjectId;
  action: AuditAction;
  comment?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    firmId: {
      type: Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentRequirement',
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    documentVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentVersion',
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'CLIENT_CREATED',
        'DOCUMENT_UPLOADED',
        'REVIEW_STARTED',
        'CORRECTION_REQUESTED',
        'DOCUMENT_REUPLOADED',
        'DOCUMENT_APPROVED',
        'USER_LOGIN',
        'REQUIREMENT_CREATED',
        'REQUIREMENT_UPDATED',
        'REQUIREMENT_DEACTIVATED',
        'REQUIREMENT_REACTIVATED',
      ],
      required: true,
      index: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are strictly append-only, no updatedAt!
  }
);

auditEventSchema.index({ firmId: 1, createdAt: -1 });
auditEventSchema.index({ documentId: 1, createdAt: -1 });
auditEventSchema.index({ clientId: 1, createdAt: -1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);
