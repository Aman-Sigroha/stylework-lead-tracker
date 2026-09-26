import { z } from 'zod';
import { LEAD_IMPORT_MAX_ROWS } from '../constants/lead-import.js';
import { createLeadSchema } from './create-lead.schema.js';

export const confirmLeadImportSchema = z.object({
  leads: z
    .array(createLeadSchema)
    .min(1, 'At least one lead is required')
    .max(
      LEAD_IMPORT_MAX_ROWS,
      `Cannot import more than ${LEAD_IMPORT_MAX_ROWS} leads at once`,
    ),
});

export type ConfirmLeadImportInput = z.infer<typeof confirmLeadImportSchema>;
