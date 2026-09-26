import { Router } from 'express';
import {
  createLeadHandler,
  deleteLeadHandler,
  exportLeadsHandler,
  listLeadsHandler,
  updateLeadHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

export const leadRouter = Router();

leadRouter.use(requireAuth);

leadRouter.get('/leads/export.csv', exportLeadsHandler);
leadRouter.get('/leads', listLeadsHandler);
leadRouter.post('/leads', createLeadHandler);
leadRouter.put('/leads/:id', updateLeadHandler);
leadRouter.delete('/leads/:id', deleteLeadHandler);
leadRouter.patch('/leads/:id/status', updateLeadStatusHandler);
