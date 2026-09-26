import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/auth-api.js';

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const;

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
  });
}
