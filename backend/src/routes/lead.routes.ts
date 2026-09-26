import { Router } from 'express';
import {
  confirmLeadImportHandler,
  previewLeadImportHandler,
} from '../controllers/lead-import.controller.js';
import {
  createLeadHandler,
  deleteLeadHandler,
  exportLeadsHandler,
  exportLeadsXlsxHandler,
  listLeadsHandler,
  updateLeadHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { withLeadCsvUpload } from '../middleware/upload-lead-csv.js';

export const leadRouter = Router();

leadRouter.use(requireAuth);

leadRouter.get('/leads/export.csv', exportLeadsHandler);
leadRouter.get('/leads/export.xlsx', exportLeadsXlsxHandler);
leadRouter.post(
  '/leads/import/preview',
  withLeadCsvUpload(previewLeadImportHandler),
);
leadRouter.post('/leads/import/confirm', confirmLeadImportHandler);
leadRouter.get('/leads', listLeadsHandler);
leadRouter.post('/leads', createLeadHandler);
leadRouter.put('/leads/:id', updateLeadHandler);
leadRouter.delete('/leads/:id', deleteLeadHandler);
leadRouter.patch('/leads/:id/status', updateLeadStatusHandler);
