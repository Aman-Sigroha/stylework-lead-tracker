import type { Request, Response } from 'express';
import { createLeadSchema } from '../schemas/create-lead.schema.js';
import { createLead } from '../services/lead.service.js';

function formatValidationErrors(
  issues: { path: PropertyKey[]; message: string }[],
) {
  return issues.map((issue) => ({
    field: issue.path.map(String).join('.') || 'body',
    message: issue.message,
  }));
}

export async function createLeadHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = createLeadSchema.safeParse(req.body);

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
    const lead = await createLead(parsed.data);
    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Create lead failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create lead',
      },
    });
  }
}
