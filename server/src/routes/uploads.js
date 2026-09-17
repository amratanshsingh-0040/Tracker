import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const router = express.Router();

// Require authentication for receipt viewing and downloads
router.use(authMiddleware);

// GET /api/receipts/:filename - Preview / View receipt inline
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Receipt file not found' });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Query original filename from DB if available
    const record = db.prepare(`SELECT receipt_original_name FROM expenses WHERE receipt_filename = ?`).get(safeFilename);
    const downloadName = record?.receipt_original_name || safeFilename;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/receipts/:filename/download - Force download receipt
router.get('/:filename/download', (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Receipt file not found' });
    }

    const record = db.prepare(`SELECT receipt_original_name FROM expenses WHERE receipt_filename = ?`).get(safeFilename);
    const downloadName = record?.receipt_original_name || safeFilename;

    res.download(filePath, downloadName);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
