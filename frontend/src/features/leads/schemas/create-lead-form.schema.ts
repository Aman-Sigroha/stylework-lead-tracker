import { z } from 'zod';
import { LEAD_STATUSES } from '../../../types/lead.js';

export const createLeadFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || value.length > 0,
      'Phone cannot be empty when provided',
    ),
  status: z.enum(LEAD_STATUSES),
});

export type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;

export const createLeadFormDefaultValues: CreateLeadFormValues = {
  name: '',
  email: '',
  phone: '',
  status: 'new',
};
