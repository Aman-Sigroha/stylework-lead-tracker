import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateLeadStatus,
  type UpdateLeadStatusPayload,
} from '../api/leads-api.js';
import { LEADS_QUERY_KEY } from './useLeadsQuery.js';

export function useUpdateLeadStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLeadStatusPayload) => updateLeadStatus(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
