import type { Request, Response } from 'express';
import { z } from 'zod';
import { createLeadSchema } from '../schemas/create-lead.schema.js';
import { listLeadsQuerySchema } from '../schemas/list-leads-query.schema.js';
import { updateLeadSchema } from '../schemas/update-lead.schema.js';
import {
  leadIdParamSchema,
  updateLeadStatusSchema,
} from '../schemas/update-lead-status.schema.js';
import {
  createLead,
  listLeads,
  updateLead,
  updateLeadStatus,
} from '../services/lead.service.js';

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

export async function listLeadsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = listLeadsQuerySchema.safeParse(req.query);

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
    const leads = await listLeads({
      search: parsed.data.search,
      searchBy: parsed.data.searchBy,
    });
    res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error('List leads failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list leads',
      },
    });
  }
}

export async function updateLeadStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const idParsed = z
    .object({ id: leadIdParamSchema })
    .safeParse(req.params);

  if (!idParsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(idParsed.error.issues),
      },
    });
    return;
  }

  const bodyParsed = updateLeadStatusSchema.safeParse(req.body);

  if (!bodyParsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(bodyParsed.error.issues),
      },
    });
    return;
  }

  try {
    const lead = await updateLeadStatus(
      idParsed.data.id,
      bodyParsed.data.status,
    );

    if (lead === null) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Lead not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Update lead status failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update lead status',
      },
    });
  }
}

export async function updateLeadHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const idParsed = z
    .object({ id: leadIdParamSchema })
    .safeParse(req.params);

  if (!idParsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(idParsed.error.issues),
      },
    });
    return;
  }

  const bodyParsed = updateLeadSchema.safeParse(req.body);

  if (!bodyParsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(bodyParsed.error.issues),
      },
    });
    return;
  }

  try {
    const lead = await updateLead(idParsed.data.id, bodyParsed.data);

    if (lead === null) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Lead not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Update lead failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update lead',
      },
    });
  }
}
