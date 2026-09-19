import { Types } from 'mongoose';
import { DocumentModel, IDocument } from '../models/Document.js';
import { DocumentVersion, IDocumentVersion } from '../models/DocumentVersion.js';
import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';
import { DocumentStatus } from '../types/index.js';
import { auditService } from './auditService.js';
import { storageService } from './storageService.js';

// Centralized state transition matrix
const ALLOWED_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  PENDING: ['UPLOADED'],
  UPLOADED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'CORRECTION_REQUIRED'],
  CORRECTION_REQUIRED: ['UPLOADED'], // Revision uploaded by staff
  APPROVED: [], // Terminal state in standard review cycle
};

export class DocumentService {
  /**
   * Validates if a state transition is permitted.
   */
  validateTransition(currentStatus: DocumentStatus, newStatus: DocumentStatus): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid document state transition from '${currentStatus}' to '${newStatus}'. Permitted transitions: ${
          allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
        }.`,
        400
      );
    }
  }

  /**
   * Retrieves single document detail with client info, latest version, and versions history.
   * Multi-tenancy strictly enforced via firmId.
   */
  async getDocumentById(firmId: string, documentId: string) {
    const firmObjectId = new Types.ObjectId(firmId);

    if (!Types.ObjectId.isValid(documentId)) {
      throw new AppError('Document not found', 404);
    }

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    })
      .populate('clientId', 'name industry financialYear gstin pan')
      .populate('reviewedBy', 'name email role')
      .populate({
        path: 'latestVersionId',
        populate: { path: 'uploadedBy reviewedBy', select: 'name email role' },
      })
      .lean();

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    const versions = await DocumentVersion.find({
      firmId: firmObjectId,
      documentId: document._id,
    })
      .sort({ versionNumber: -1 })
      .populate('uploadedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .lean();

    return {
      ...document,
      id: document._id,
      versions: versions.map((v) => ({
        ...v,
        id: v._id,
      })),
    };
  }

  /**
   * Uploads a document version (initial upload or revision).
   * Staff action.
   */
  async uploadDocumentVersion(
    firmId: string,
    documentId: string,
    actor: { id: string; name: string; role: string },
    file: Express.Multer.File,
    notes?: string
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    if (!Types.ObjectId.isValid(documentId)) {
      throw new AppError('Document not found', 404);
    }

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    });

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    // Check if status allows upload
    const isInitialUpload = document.status === 'PENDING';
    const isReupload = document.status === 'CORRECTION_REQUIRED';

    if (!isInitialUpload && !isReupload) {
      throw new AppError(
        `Cannot upload a file to a document in status '${document.status}'. Upload is only allowed when PENDING or CORRECTION_REQUIRED.`,
        400
      );
    }

    // Validate state transition
    const targetStatus: DocumentStatus = 'UPLOADED';
    this.validateTransition(document.status, targetStatus);

    // Upload file through storage service
    const storedFile = await storageService.uploadFile(file, `auditflow/${firmId}`);

    const newVersionNumber = (document.currentVersionNumber || 0) + 1;

    // Create new immutable DocumentVersion record
    const version = await DocumentVersion.create({
      firmId: firmObjectId,
      clientId: document.clientId,
      documentId: document._id,
      versionNumber: newVersionNumber,
      fileUrl: storedFile.fileUrl,
      cloudinaryPublicId: storedFile.cloudinaryPublicId,
      fileName: storedFile.fileName,
      fileSize: storedFile.fileSize,
      fileType: storedFile.fileType,
      uploadedBy: actorObjectId,
      reviewStatus: 'UPLOADED',
    });

    // Update parent Document status and latestVersion reference
    document.status = 'UPLOADED';
    document.currentVersionNumber = newVersionNumber;
    document.latestVersionId = version._id as any;
    // Clear latest correction comment on reupload since revision addressed it
    if (isReupload) {
      document.latestCorrectionComment = undefined;
    }
    await document.save();

    // Record appropriate audit event
    const action = isReupload ? 'DOCUMENT_REUPLOADED' : 'DOCUMENT_UPLOADED';
    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: document.clientId,
      documentId: document._id,
      documentVersionId: version._id,
      action,
      comment: notes || (isReupload ? `Revision v${newVersionNumber} uploaded` : `Initial upload of ${storedFile.fileName}`),
      metadata: {
        version: newVersionNumber,
        fileName: storedFile.fileName,
        fileSize: storedFile.fileSize,
      },
    });

    return this.getDocumentById(firmId, documentId);
  }

  /**
   * Starts review on an uploaded document.
   * Reviewer action.
   */
  async startReview(firmId: string, documentId: string, actor: { id: string; name: string }) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    });

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    if (document.status === 'UNDER_REVIEW') {
      // Already under review, return document without error
      return this.getDocumentById(firmId, documentId);
    }

    this.validateTransition(document.status, 'UNDER_REVIEW');

    document.status = 'UNDER_REVIEW';
    document.reviewedBy = actorObjectId;
    await document.save();

    if (document.latestVersionId) {
      await DocumentVersion.findByIdAndUpdate(document.latestVersionId, {
        reviewStatus: 'UNDER_REVIEW',
        reviewedBy: actorObjectId,
      });
    }

    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: document.clientId,
      documentId: document._id,
      documentVersionId: document.latestVersionId,
      action: 'REVIEW_STARTED',
      comment: `Review begun by ${actor.name}`,
      metadata: { version: document.currentVersionNumber },
    });

    return this.getDocumentById(firmId, documentId);
  }

  /**
   * Requests correction for a document under review.
   * Reviewer action. Requires non-empty comment.
   */
  async requestCorrection(
    firmId: string,
    documentId: string,
    actor: { id: string; name: string },
    comment: string
  ) {
    if (!comment || !comment.trim()) {
      throw new AppError('A detailed correction comment is required explaining what needs to be rectified.', 400);
    }

    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    });

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    this.validateTransition(document.status, 'CORRECTION_REQUIRED');

    document.status = 'CORRECTION_REQUIRED';
    document.latestCorrectionComment = comment.trim();
    document.reviewedBy = actorObjectId;
    document.reviewedAt = new Date();
    await document.save();

    if (document.latestVersionId) {
      await DocumentVersion.findByIdAndUpdate(document.latestVersionId, {
        reviewStatus: 'CORRECTION_REQUIRED',
        reviewComment: comment.trim(),
        reviewedBy: actorObjectId,
        reviewedAt: new Date(),
      });
    }

    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: document.clientId,
      documentId: document._id,
      documentVersionId: document.latestVersionId,
      action: 'CORRECTION_REQUESTED',
      comment: comment.trim(),
      metadata: { version: document.currentVersionNumber },
    });

    return this.getDocumentById(firmId, documentId);
  }

  /**
   * Approves a document under review.
   * Reviewer action.
   */
  async approveDocument(
    firmId: string,
    documentId: string,
    actor: { id: string; name: string },
    comment?: string
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    });

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    this.validateTransition(document.status, 'APPROVED');

    document.status = 'APPROVED';
    document.reviewedBy = actorObjectId;
    document.reviewedAt = new Date();
    await document.save();

    const approvalComment = comment?.trim() || 'Document verified and approved.';

    if (document.latestVersionId) {
      await DocumentVersion.findByIdAndUpdate(document.latestVersionId, {
        reviewStatus: 'APPROVED',
        reviewComment: approvalComment,
        reviewedBy: actorObjectId,
        reviewedAt: new Date(),
      });
    }

    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: document.clientId,
      documentId: document._id,
      documentVersionId: document.latestVersionId,
      action: 'DOCUMENT_APPROVED',
      comment: approvalComment,
      metadata: { version: document.currentVersionNumber },
    });

    return this.getDocumentById(firmId, documentId);
  }

  /**
   * Retrieves all historical versions for a document.
   */
  async getDocumentVersions(firmId: string, documentId: string) {
    const firmObjectId = new Types.ObjectId(firmId);

    const document = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      firmId: firmObjectId,
    });

    if (!document) {
      throw new AppError('Document not found or inaccessible', 404);
    }

    return DocumentVersion.find({
      firmId: firmObjectId,
      documentId: document._id,
    })
      .sort({ versionNumber: -1 })
      .populate('uploadedBy reviewedBy', 'name email role')
      .lean();
  }
}

export const documentService = new DocumentService();
