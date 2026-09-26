import { Router } from 'express';
import {
  createLeadHandler,
  listLeadsHandler,
  updateLeadHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js';

export const leadRouter = Router();

leadRouter.get('/leads', listLeadsHandler);
leadRouter.post('/leads', createLeadHandler);
leadRouter.put('/leads/:id', updateLeadHandler);
leadRouter.patch('/leads/:id/status', updateLeadStatusHandler);
