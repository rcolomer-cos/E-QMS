import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure base uploads directory exists
const baseUploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Legacy document upload directory
const uploadDir = path.join(baseUploadDir, 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to ensure entity-specific directory exists
const ensureEntityDir = (entityType: string): string => {
  const entityDir = path.join(baseUploadDir, entityType);
  if (!fs.existsSync(entityDir)) {
    fs.mkdirSync(entityDir, { recursive: true });
  }
  return entityDir;
};

// Configure storage for attachments with entity-specific directories
const attachmentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Get entity type from request body or default to 'general'
    const entityType = (req.body.entityType as string) || 'general';
    const entityDir = ensureEntityDir(entityType);
    cb(null, entityDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for legacy document uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter - allow common document types
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, PowerPoint, text, and image files are allowed.'));
  }
};

// Configure multer for attachments
export const attachmentUpload = multer({
  storage: attachmentStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files per request
  },
});

// Configure multer for legacy document uploads
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
