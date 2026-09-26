import { LeadTrackerPage } from '../leads/LeadTrackerPage.tsx';
import { LoginPage } from './LoginPage.tsx';
import { useCurrentUserQuery } from './hooks/useCurrentUserQuery.ts';

export function AuthGate() {
  const { data: user, isLoading, isError, refetch } = useCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="auth-gate__loading" role="status" aria-live="polite">
        Checking authentication...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="auth-gate__error">
        <p>Unable to verify your session. Please try again.</p>
        <button type="button" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (user === null || user === undefined) {
    return <LoginPage />;
  }

  return <LeadTrackerPage />;
}
