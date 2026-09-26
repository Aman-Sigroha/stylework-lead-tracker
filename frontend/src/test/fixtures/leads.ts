import type { Lead } from '../../types/lead.js';

export const mockLead: Lead = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  status: 'new',
  createdAt: '2026-03-25T10:00:00.000Z',
  updatedAt: '2026-03-25T10:00:00.000Z',
};

export const mockLeadTwo: Lead = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  name: 'John Smith',
  email: 'john@example.com',
  phone: null,
  status: 'contacted',
  createdAt: '2026-03-24T09:30:00.000Z',
  updatedAt: '2026-03-24T11:00:00.000Z',
};
