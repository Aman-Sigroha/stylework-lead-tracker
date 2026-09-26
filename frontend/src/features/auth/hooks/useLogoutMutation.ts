import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth-api.js';
import { LEADS_QUERY_KEY } from '../../leads/hooks/useLeadsQuery.js';
import { CURRENT_USER_QUERY_KEY } from './useCurrentUserQuery.js';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: LEADS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}
