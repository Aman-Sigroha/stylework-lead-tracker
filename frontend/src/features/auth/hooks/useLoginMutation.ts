import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, type LoginPayload } from '../api/auth-api.js';
import { CURRENT_USER_QUERY_KEY } from './useCurrentUserQuery.js';

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}
