import { Router } from 'express';
import {
  createLeadHandler,
  listLeadsHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js';

export const leadRouter = Router();

leadRouter.get('/leads', listLeadsHandler);
leadRouter.post('/leads', createLeadHandler);
leadRouter.patch('/leads/:id/status', updateLeadStatusHandler);
