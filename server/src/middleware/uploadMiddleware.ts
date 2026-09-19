import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler.js';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Permitted MIME types for CA audit documentation
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.xls', '.xlsx', '.csv'];

const storage = multer.memoryStorage();

function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const extension = '.' + file.originalname.split('.').pop()?.toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(extension)) {
    return cb(
      new AppError(
        `Unsupported file type '${file.mimetype}'. Allowed types are PDF, Excel (XLS, XLSX), CSV, and Images (JPEG, PNG).`,
        400
      )
    );
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
