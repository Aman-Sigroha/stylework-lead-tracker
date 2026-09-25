import { z } from 'zod';
import { LEAD_STATUSES } from '../constants/lead-status.js';

export const createLeadSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required'),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email({ error: 'Invalid email address' })),
  phone: z
    .union([
      z
        .string()
        .trim()
        .min(1, 'Phone cannot be empty when provided'),
      z.literal('').transform(() => undefined),
      z.null().transform(() => undefined),
    ])
    .optional(),
  status: z.enum(LEAD_STATUSES).optional().default('new'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
