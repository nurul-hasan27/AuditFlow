import { Types } from 'mongoose';
import { DocumentRequirement, IDocumentRequirement } from '../models/DocumentRequirement.js';
import { DocumentModel } from '../models/Document.js';
import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditService } from './auditService.js';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class RequirementService {
  /**
   * Lists requirements for a client.
   * If includeInactive is false, only active requirements are returned.
   * Strictly tenant-isolated via firmId.
   */
  async getRequirementsForClient(
    firmId: string,
    clientId: string,
    includeInactive: boolean = false
  ) {
    const firmObjectId = new Types.ObjectId(firmId);

    if (!Types.ObjectId.isValid(clientId)) {
      throw new AppError('Client not found', 404);
    }

    const client = await Client.findOne({
      _id: new Types.ObjectId(clientId),
      firmId: firmObjectId,
    });

    if (!client) {
      throw new AppError('Client not found or inaccessible', 404);
    }

    const query: any = {
      firmId: firmObjectId,
      clientId: client._id,
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    const requirements = await DocumentRequirement.find(query)
      .sort({ createdAt: 1 })
      .populate('createdBy', 'name email role')
      .lean();

    // Map each requirement to its linked Document state container
    const requirementsWithDocs = await Promise.all(
      requirements.map(async (req) => {
        let doc = await DocumentModel.findOne({
          firmId: firmObjectId,
          requirementId: req._id,
        })
          .populate('reviewedBy', 'name email role')
          .populate('latestVersionId')
          .lean();

        // Fallback: in case of existing records before requirementId link, match by title & client
        if (!doc) {
          doc = await DocumentModel.findOne({
            firmId: firmObjectId,
            clientId: client._id,
            title: req.name,
          })
            .populate('reviewedBy', 'name email role')
            .populate('latestVersionId')
            .lean();

          if (doc && !doc.requirementId) {
            await DocumentModel.findByIdAndUpdate(doc._id, {
              requirementId: req._id,
              isActive: req.isActive,
            });
          }
        }

        return {
          ...req,
          id: req._id,
          document: doc
            ? {
                ...doc,
                id: doc._id,
              }
            : null,
        };
      })
    );

    return requirementsWithDocs;
  }

  /**
   * Creates a new document requirement for a client.
   * Reviewer only. Prevents duplicate active requirement names for the same client.
   */
  async createRequirement(
    firmId: string,
    clientId: string,
    actor: { id: string; name: string; role: string },
    data: { name: string; description?: string; category?: string }
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    if (!Types.ObjectId.isValid(clientId)) {
      throw new AppError('Client not found', 404);
    }

    const client = await Client.findOne({
      _id: new Types.ObjectId(clientId),
      firmId: firmObjectId,
    });

    if (!client) {
      throw new AppError('Client not found or inaccessible', 404);
    }

    const trimmedName = data.name.trim();

    // Check for accidental duplicate active requirement name for this client
    const existingActive = await DocumentRequirement.findOne({
      firmId: firmObjectId,
      clientId: client._id,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      isActive: true,
    });

    if (existingActive) {
      throw new AppError(
        `An active requirement with the name "${trimmedName}" already exists for this client.`,
        400
      );
    }

    const requirement = await DocumentRequirement.create({
      firmId: firmObjectId,
      clientId: client._id,
      name: trimmedName,
      description: data.description?.trim(),
      category: data.category?.trim() || 'General',
      isActive: true,
      createdBy: actorObjectId,
    });

    // Create the associated Document container for file uploads and review tracking
    const document = await DocumentModel.create({
      firmId: firmObjectId,
      clientId: client._id,
      requirementId: requirement._id,
      title: requirement.name,
      category: requirement.category,
      status: 'PENDING',
      currentVersionNumber: 0,
      isActive: true,
    });

    // Record immutable audit event
    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: client._id,
      requirementId: requirement._id,
      documentId: document._id,
      action: 'REQUIREMENT_CREATED',
      comment: `Requirement "${requirement.name}" created by ${actor.name}`,
      metadata: {
        requirementName: requirement.name,
        category: requirement.category,
        description: requirement.description,
      },
    });

    return {
      ...requirement.toObject(),
      id: requirement._id,
      document: {
        ...document.toObject(),
        id: document._id,
      },
    };
  }

  /**
   * Updates/renames an existing requirement.
   * Reviewer only. Prevents duplicate active requirement names for the same client.
   */
  async updateRequirement(
    firmId: string,
    requirementId: string,
    actor: { id: string; name: string },
    data: { name?: string; description?: string; category?: string }
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    if (!Types.ObjectId.isValid(requirementId)) {
      throw new AppError('Requirement not found', 404);
    }

    const requirement = await DocumentRequirement.findOne({
      _id: new Types.ObjectId(requirementId),
      firmId: firmObjectId,
    });

    if (!requirement) {
      throw new AppError('Requirement not found or inaccessible', 404);
    }

    const oldName = requirement.name;
    let nameChanged = false;

    if (data.name && data.name.trim() && data.name.trim() !== requirement.name) {
      const trimmedName = data.name.trim();

      // Check duplicate
      const duplicate = await DocumentRequirement.findOne({
        _id: { $ne: requirement._id },
        firmId: firmObjectId,
        clientId: requirement.clientId,
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
        isActive: true,
      });

      if (duplicate) {
        throw new AppError(
          `An active requirement with the name "${trimmedName}" already exists for this client.`,
          400
        );
      }

      requirement.name = trimmedName;
      nameChanged = true;

      // Update current Document title to reflect rename
      await DocumentModel.findOneAndUpdate(
        { requirementId: requirement._id, firmId: firmObjectId },
        { title: trimmedName }
      );
    }

    if (data.description !== undefined) {
      requirement.description = data.description.trim();
    }

    if (data.category && data.category.trim()) {
      requirement.category = data.category.trim();
      await DocumentModel.findOneAndUpdate(
        { requirementId: requirement._id, firmId: firmObjectId },
        { category: requirement.category }
      );
    }

    await requirement.save();

    // Record audit event
    const auditComment = nameChanged
      ? `Requirement renamed from "${oldName}" to "${requirement.name}" by ${actor.name}`
      : `Requirement "${requirement.name}" updated by ${actor.name}`;

    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: requirement.clientId,
      requirementId: requirement._id,
      action: 'REQUIREMENT_UPDATED',
      comment: auditComment,
      metadata: {
        oldName,
        newName: requirement.name,
        category: requirement.category,
      },
    });

    const doc = await DocumentModel.findOne({
      firmId: firmObjectId,
      requirementId: requirement._id,
    })
      .populate('reviewedBy', 'name email role')
      .populate('latestVersionId')
      .lean();

    return {
      ...requirement.toObject(),
      id: requirement._id,
      document: doc ? { ...doc, id: doc._id } : null,
    };
  }

  /**
   * Deactivates a document requirement.
   * Reviewer only. Existing uploaded documents, versions, and audit trail are preserved!
   */
  async deactivateRequirement(
    firmId: string,
    requirementId: string,
    actor: { id: string; name: string }
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    if (!Types.ObjectId.isValid(requirementId)) {
      throw new AppError('Requirement not found', 404);
    }

    const requirement = await DocumentRequirement.findOne({
      _id: new Types.ObjectId(requirementId),
      firmId: firmObjectId,
    });

    if (!requirement) {
      throw new AppError('Requirement not found or inaccessible', 404);
    }

    if (!requirement.isActive) {
      return {
        ...requirement.toObject(),
        id: requirement._id,
      };
    }

    requirement.isActive = false;
    await requirement.save();

    // Mark current Document container as inactive so it stops showing in active checklist/queues
    await DocumentModel.findOneAndUpdate(
      { requirementId: requirement._id, firmId: firmObjectId },
      { isActive: false }
    );

    // Record audit event
    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: requirement.clientId,
      requirementId: requirement._id,
      action: 'REQUIREMENT_DEACTIVATED',
      comment: `Requirement "${requirement.name}" deactivated by ${actor.name}. Historical records preserved.`,
      metadata: { requirementName: requirement.name },
    });

    const doc = await DocumentModel.findOne({
      firmId: firmObjectId,
      requirementId: requirement._id,
    }).lean();

    return {
      ...requirement.toObject(),
      id: requirement._id,
      document: doc ? { ...doc, id: doc._id } : null,
    };
  }

  /**
   * Reactivates a previously deactivated requirement.
   * Reviewer only.
   */
  async activateRequirement(
    firmId: string,
    requirementId: string,
    actor: { id: string; name: string }
  ) {
    const firmObjectId = new Types.ObjectId(firmId);
    const actorObjectId = new Types.ObjectId(actor.id);

    if (!Types.ObjectId.isValid(requirementId)) {
      throw new AppError('Requirement not found', 404);
    }

    const requirement = await DocumentRequirement.findOne({
      _id: new Types.ObjectId(requirementId),
      firmId: firmObjectId,
    });

    if (!requirement) {
      throw new AppError('Requirement not found or inaccessible', 404);
    }

    if (requirement.isActive) {
      return {
        ...requirement.toObject(),
        id: requirement._id,
      };
    }

    // Check duplicate active name
    const duplicate = await DocumentRequirement.findOne({
      _id: { $ne: requirement._id },
      firmId: firmObjectId,
      clientId: requirement.clientId,
      name: { $regex: new RegExp(`^${escapeRegex(requirement.name)}$`, 'i') },
      isActive: true,
    });

    if (duplicate) {
      throw new AppError(
        `Cannot reactivate. An active requirement named "${requirement.name}" already exists for this client.`,
        400
      );
    }

    requirement.isActive = true;
    await requirement.save();

    await DocumentModel.findOneAndUpdate(
      { requirementId: requirement._id, firmId: firmObjectId },
      { isActive: true }
    );

    // Record audit event
    await auditService.record({
      firmId: firmObjectId,
      actorId: actorObjectId,
      clientId: requirement.clientId,
      requirementId: requirement._id,
      action: 'REQUIREMENT_REACTIVATED',
      comment: `Requirement "${requirement.name}" reactivated by ${actor.name}`,
      metadata: { requirementName: requirement.name },
    });

    const doc = await DocumentModel.findOne({
      firmId: firmObjectId,
      requirementId: requirement._id,
    }).lean();

    return {
      ...requirement.toObject(),
      id: requirement._id,
      document: doc ? { ...doc, id: doc._id } : null,
    };
  }
}

export const requirementService = new RequirementService();
