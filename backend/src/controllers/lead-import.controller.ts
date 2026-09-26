import type { Request, Response } from 'express';
import { confirmLeadImportSchema } from '../schemas/confirm-lead-import.schema.js';
import {
  confirmLeadImport,
  previewLeadImportFromCsv,
} from '../services/lead-import.service.js';
import { LeadImportCsvParseError } from '../utils/parse-lead-import-csv.js';

function formatValidationErrors(
  issues: { path: PropertyKey[]; message: string }[],
) {
  return issues.map((issue) => ({
    field: issue.path.map(String).join('.') || 'body',
    message: issue.message,
  }));
}

export async function previewLeadImportHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (req.file === undefined) {
    res.status(400).json({
      success: false,
      error: {
        message: 'CSV file is required',
      },
    });
    return;
  }

  try {
    const preview = previewLeadImportFromCsv(req.file.buffer);

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    if (error instanceof LeadImportCsvParseError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    console.error('Lead import preview failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to preview lead import',
      },
    });
  }
}

export async function confirmLeadImportHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = confirmLeadImportSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(parsed.error.issues),
      },
    });
    return;
  }

  try {
    const result = await confirmLeadImport(parsed.data.leads);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Lead import confirm failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to import leads',
      },
    });
  }
}
