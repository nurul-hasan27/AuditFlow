import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'STAFF' | 'REVIEWER';

export type DocumentStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED';

export type AuditAction =
  | 'CLIENT_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'REVIEW_STARTED'
  | 'CORRECTION_REQUESTED'
  | 'DOCUMENT_REUPLOADED'
  | 'DOCUMENT_APPROVED'
  | 'USER_LOGIN';

export interface AuthenticatedUserPayload {
  userId: string;
  firmId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}
