import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLead, type CreateLeadPayload } from '../api/leads-api.js';
import { LEADS_QUERY_KEY } from './useLeadsQuery.js';

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
