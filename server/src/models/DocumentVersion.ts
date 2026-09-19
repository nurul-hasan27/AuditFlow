import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import { DocumentStatus } from '../types/index.js';

export interface IDocumentVersion extends MongooseDocument {
  firmId: Types.ObjectId;
  clientId: Types.ObjectId;
  documentId: Types.ObjectId;
  requirementId?: Types.ObjectId;
  versionNumber: number;
  fileUrl: string;
  cloudinaryPublicId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: Types.ObjectId;
  reviewStatus: DocumentStatus;
  reviewComment?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>(
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
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentRequirement',
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'UPLOADED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED'],
      default: 'UPLOADED',
      required: true,
    },
    reviewComment: {
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

documentVersionSchema.index({ documentId: 1, versionNumber: -1 });
documentVersionSchema.index({ firmId: 1, createdAt: -1 });

export const DocumentVersion = mongoose.model<IDocumentVersion>('DocumentVersion', documentVersionSchema);
