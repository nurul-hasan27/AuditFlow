import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import { DocumentStatus } from '../types/index.js';

export interface IDocument extends MongooseDocument {
  firmId: Types.ObjectId;
  clientId: Types.ObjectId;
  title: string;
  category: string;
  status: DocumentStatus;
  currentVersionNumber: number;
  latestVersionId?: Types.ObjectId;
  latestCorrectionComment?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['PENDING', 'UPLOADED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    currentVersionNumber: {
      type: Number,
      default: 0,
      required: true,
    },
    latestVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentVersion',
    },
    latestCorrectionComment: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ firmId: 1, clientId: 1 });
documentSchema.index({ firmId: 1, status: 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
