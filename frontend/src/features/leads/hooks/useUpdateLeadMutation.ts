import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLead, type UpdateLeadPayload } from '../api/leads-api.js';
import { LEADS_QUERY_KEY } from './useLeadsQuery.js';

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLeadPayload) => updateLead(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
