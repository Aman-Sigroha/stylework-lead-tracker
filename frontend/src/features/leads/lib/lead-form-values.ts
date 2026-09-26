import type { Lead } from '../../../types/lead.js';
import type { LeadFormValues } from '../schemas/create-lead-form.schema.js';

export function leadToFormValues(lead: Lead): LeadFormValues {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? '',
    status: lead.status,
  };
}

export function formValuesToLeadPayload(values: LeadFormValues) {
  return {
    name: values.name,
    email: values.email,
    status: values.status,
    ...(values.phone.trim() !== '' ? { phone: values.phone.trim() } : {}),
  };
}
