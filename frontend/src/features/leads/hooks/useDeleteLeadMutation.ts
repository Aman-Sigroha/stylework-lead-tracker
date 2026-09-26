import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLead } from '../api/leads-api.js';
import { LEADS_QUERY_KEY } from './useLeadsQuery.js';

export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
