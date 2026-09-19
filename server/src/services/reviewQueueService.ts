import { Types } from 'mongoose';
import { DocumentModel } from '../models/Document.js';

export class ReviewQueueService {
  /**
   * Generates prioritized Review Queue for the firm's Reviewers.
   * Categories:
   * 1. Needs Correction (documents requiring staff revision)
   * 2. Awaiting Review (documents uploaded/under review, sorted oldest upload first)
   * 3. Recently Approved (verified documents for reference)
   * Multi-tenancy strictly enforced with firmId.
   */
  async getQueue(firmId: string) {
    const firmObjectId = new Types.ObjectId(firmId);

    // Fetch documents that have active versions
    const documents = await DocumentModel.find({
      firmId: firmObjectId,
      status: { $in: ['UPLOADED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED'] },
    })
      .populate('clientId', 'name industry financialYear')
      .populate('reviewedBy', 'name email')
      .populate({
        path: 'latestVersionId',
        populate: { path: 'uploadedBy', select: 'name email role' },
      })
      .sort({ updatedAt: -1 })
      .lean();

    const needsCorrection: any[] = [];
    const awaitingReview: any[] = [];
    const recentlyApproved: any[] = [];

    const now = Date.now();

    for (const doc of documents) {
      const latestVer: any = doc.latestVersionId;
      const uploadedAt = latestVer ? new Date(latestVer.createdAt).getTime() : new Date(doc.updatedAt).getTime();
      const waitingTimeMs = Math.max(0, now - uploadedAt);

      const item = {
        id: doc._id,
        title: doc.title,
        category: doc.category,
        status: doc.status,
        version: doc.currentVersionNumber,
        client: doc.clientId
          ? {
              id: (doc.clientId as any)._id,
              name: (doc.clientId as any).name,
              industry: (doc.clientId as any).industry,
            }
          : null,
        latestVersion: latestVer
          ? {
              id: latestVer._id,
              versionNumber: latestVer.versionNumber,
              fileName: latestVer.fileName,
              fileSize: latestVer.fileSize,
              fileType: latestVer.fileType,
              fileUrl: latestVer.fileUrl,
              uploadedBy: latestVer.uploadedBy
                ? {
                    id: latestVer.uploadedBy._id,
                    name: latestVer.uploadedBy.name,
                    role: latestVer.uploadedBy.role,
                  }
                : null,
              uploadedAt: latestVer.createdAt,
            }
          : null,
        correctionComment: doc.latestCorrectionComment,
        waitingDurationMs: waitingTimeMs,
        updatedAt: doc.updatedAt,
      };

      if (doc.status === 'CORRECTION_REQUIRED') {
        needsCorrection.push(item);
      } else if (doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW') {
        awaitingReview.push(item);
      } else if (doc.status === 'APPROVED') {
        recentlyApproved.push(item);
      }
    }

    // Sort awaitingReview: oldest uploaded first to prevent reviewer backlog
    awaitingReview.sort((a, b) => {
      const aTime = a.latestVersion ? new Date(a.latestVersion.uploadedAt).getTime() : 0;
      const bTime = b.latestVersion ? new Date(b.latestVersion.uploadedAt).getTime() : 0;
      return aTime - bTime;
    });

    return {
      needsCorrection,
      awaitingReview,
      recentlyApproved: recentlyApproved.slice(0, 10), // Most recent 10 approved
      counts: {
        needsCorrection: needsCorrection.length,
        awaitingReview: awaitingReview.length,
        recentlyApproved: recentlyApproved.length,
      },
    };
  }
}

export const reviewQueueService = new ReviewQueueService();
