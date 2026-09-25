import type { LeadStatus } from '../constants/lead-status.js';

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};
