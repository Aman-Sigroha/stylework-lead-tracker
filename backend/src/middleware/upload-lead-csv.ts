import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import {
  LEAD_IMPORT_CSV_FIELD,
  LEAD_IMPORT_MAX_FILE_SIZE_BYTES,
} from '../constants/lead-import.js';

const ACCEPTED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
]);

function isAcceptedCsvUpload(
  mimetype: string,
  originalname: string,
): boolean {
  if (!originalname.toLowerCase().endsWith('.csv')) {
    return false;
  }

  return (
    ACCEPTED_MIME_TYPES.has(mimetype) || mimetype === 'application/octet-stream'
  );
}

export const uploadLeadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LEAD_IMPORT_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAcceptedCsvUpload(file.mimetype, file.originalname)) {
      callback(new Error('Unsupported file type. Upload a .csv file.'));
      return;
    }

    callback(null, true);
  },
}).single(LEAD_IMPORT_CSV_FIELD);

export function respondToLeadCsvUploadError(
  error: unknown,
  res: Response,
): boolean {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          message: 'CSV file is too large',
        },
      });
      return true;
    }

    res.status(400).json({
      success: false,
      error: {
        message: error.message,
      },
    });
    return true;
  }

  if (error instanceof Error) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message,
      },
    });
    return true;
  }

  return false;
}

export function withLeadCsvUpload(
  handler: (req: Request, res: Response) => void | Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadLeadCsv(req, res, (error) => {
      if (error !== undefined && error !== null) {
        if (!respondToLeadCsvUploadError(error, res)) {
          next(error);
        }
        return;
      }

      void Promise.resolve(handler(req, res)).catch(next);
    });
  };
}
