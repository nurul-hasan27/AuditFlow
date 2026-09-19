import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

let isCloudinaryConfigured = false;
if (
  config.cloudinary.cloudName &&
  config.cloudinary.cloudName !== 'demo_cloud' &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  isCloudinaryConfigured = true;
}

export interface StoredFileResult {
  fileUrl: string;
  cloudinaryPublicId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export class StorageService {
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'auditflow_documents'
  ): Promise<StoredFileResult> {
    const fileName = file.originalname;
    const fileSize = file.size;
    const fileType = file.mimetype;

    // If Cloudinary is configured with actual credentials, upload to Cloudinary
    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload returned null'));
            }
            resolve({
              fileUrl: result.secure_url,
              cloudinaryPublicId: result.public_id,
              fileName,
              fileSize,
              fileType,
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    }

    // Fallback: If in local development or test without Cloudinary keys, create base64 Data URL or safe mock URL
    // This guarantees tests and local evaluation run reliably out of the box!
    const base64Content = file.buffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64Content}`;

    return {
      fileUrl: dataUrl,
      cloudinaryPublicId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fileName,
      fileSize,
      fileType,
    };
  }
}

export const storageService = new StorageService();
