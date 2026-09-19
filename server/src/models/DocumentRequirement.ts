import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export interface IDocumentRequirement extends MongooseDocument {
  firmId: Types.ObjectId;
  clientId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentRequirementSchema = new Schema<IDocumentRequirement>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for client requirements queries and tenant isolation
documentRequirementSchema.index({ firmId: 1, clientId: 1, isActive: 1 });

export const DocumentRequirement = mongoose.model<IDocumentRequirement>(
  'DocumentRequirement',
  documentRequirementSchema
);
