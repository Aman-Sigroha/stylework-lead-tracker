import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmLeadImport } from '../api/leads-import-api.js';
import type { LeadImportPreviewLead } from '../../../types/lead-import.js';
import { LEADS_QUERY_KEY } from './useLeadsQuery.js';

export function useConfirmLeadImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leads: LeadImportPreviewLead[]) => confirmLeadImport(leads),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
