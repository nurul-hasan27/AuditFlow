import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export interface IClient extends MongooseDocument {
  firmId: Types.ObjectId;
  name: string;
  industry: string;
  financialYear: string;
  gstin?: string;
  pan?: string;
  assignedStaffId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    firmId: {
      type: Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
      default: 'General Trade',
    },
    financialYear: {
      type: String,
      required: true,
      default: '2025-26',
    },
    gstin: {
      type: String,
      trim: true,
    },
    pan: {
      type: String,
      trim: true,
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ firmId: 1, name: 1 });

export const Client = mongoose.model<IClient>('Client', clientSchema);
