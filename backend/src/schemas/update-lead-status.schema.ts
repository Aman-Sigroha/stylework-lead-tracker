import { z } from 'zod';
import { LEAD_STATUSES } from '../constants/lead-status.js';

export const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES, {
    error: 'status must be one of: new, contacted, qualified, converted, lost',
  }),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const leadIdParamSchema = z.string().uuid({
  error: 'Invalid lead id',
});
