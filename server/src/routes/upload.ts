import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Resolve the upload directory relative to the project root
const UPLOAD_DIR = path.resolve(__dirname, '../../../../client/public/images/characters');

// Ensure upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate a safe, unique filename: timestamp + random hex + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: png, jpg, jpeg, webp, gif`));
    return;
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`Invalid file extension: ${ext}. Allowed: .png, .jpg, .jpeg, .webp, .gif`));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

const router = Router();

// POST /api/upload — upload a single image (auth required)
router.post('/', authenticate, (req: Request, res: Response): void => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({ error: 'Only one file can be uploaded at a time' });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided. Use form field name "image"' });
      return;
    }

    const url = `/images/characters/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

export default router;
