import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}${ext}`);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed. Only images and PDFs are accepted.`));
    }
  },
});
