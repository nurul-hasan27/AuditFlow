import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IFirm extends MongooseDocument {
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

const firmSchema = new Schema<IFirm>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Firm = mongoose.model<IFirm>('Firm', firmSchema);
