import { Router } from 'express';
import { createLeadHandler } from '../controllers/lead.controller.js';

export const leadRouter = Router();

leadRouter.post('/leads', createLeadHandler);
