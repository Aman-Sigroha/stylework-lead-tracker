import { z } from 'zod';
import { LEAD_STATUSES } from '../../../types/lead.js';

export const leadFormSchema = z.object({
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

export const createLeadFormSchema = leadFormSchema;

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type CreateLeadFormValues = LeadFormValues;

export const leadFormDefaultValues: LeadFormValues = {
  name: '',
  email: '',
  phone: '',
  status: 'new',
};

export const createLeadFormDefaultValues = leadFormDefaultValues;
