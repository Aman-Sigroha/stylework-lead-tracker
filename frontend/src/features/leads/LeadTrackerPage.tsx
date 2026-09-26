import { useEffect, useState } from 'react';
import { CreateLeadModal } from './components/CreateLeadModal.tsx';
import { CreateLeadSection } from './components/CreateLeadSection.tsx';
import { LeadList } from './components/LeadList.tsx';
import { LeadListState } from './components/LeadListState.tsx';
import { LeadSearchControls } from './components/LeadSearchControls.tsx';
import { SuccessToast } from './components/SuccessToast.tsx';
import { InlineErrorBanner } from './components/InlineErrorBanner.tsx';
import { useDebouncedValue } from './hooks/useDebouncedValue.ts';
import { useLeadsQuery } from './hooks/useLeadsQuery.ts';
import { useUpdateLeadStatusMutation } from './hooks/useUpdateLeadStatusMutation.ts';
import { ApiRequestError } from '../../lib/api-errors.js';
import { getStatusUpdateErrorMessage } from './lib/status-update-errors.ts';
import type { LeadSearchBy, LeadStatus } from '../../types/lead.js';
import './LeadTrackerPage.css';

export function LeadTrackerPage() {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<LeadSearchBy>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const updateLeadStatusMutation = useUpdateLeadStatusMutation();
  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: debouncedSearch,
    searchBy,
  });

  useEffect(() => {
    if (successMessage === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const hasActiveSearch = debouncedSearch.trim() !== '';
  const leads = data ?? [];

  const handleLeadCreated = () => {
    setIsCreateOpen(false);
    setSuccessMessage('Lead created successfully.');
  };

  const pendingStatusLeadId =
    updateLeadStatusMutation.isPending &&
    updateLeadStatusMutation.variables !== undefined
      ? updateLeadStatusMutation.variables.id
      : null;

  const handleStatusChange = (
    leadId: string,
    nextStatus: LeadStatus,
    currentStatus: LeadStatus,
  ) => {
    if (nextStatus === currentStatus) {
      return;
    }

    setStatusError(null);

    updateLeadStatusMutation.mutate(
      { id: leadId, status: nextStatus },
      {
        onError: async (error) => {
          setStatusError(getStatusUpdateErrorMessage(error));

          if (error instanceof ApiRequestError && error.status === 404) {
            await refetch();
          }
        },
      },
    );
  };

  return (
    <div className="lead-tracker">
      {successMessage !== null ? (
        <SuccessToast message={successMessage} />
      ) : null}

      <header className="lead-tracker__header">
        <p className="lead-tracker__eyebrow">Stylework</p>
        <h1 className="lead-tracker__title">Lead Tracker</h1>
        <p className="lead-tracker__subtitle">
          Manage inbound leads from one place.
        </p>
      </header>

      <main className="lead-tracker__main">
        <section className="lead-tracker__panel" aria-label="Search leads">
          <h2 className="lead-tracker__panel-title">Search</h2>
          <LeadSearchControls
            search={search}
            searchBy={searchBy}
            onSearchChange={setSearch}
            onSearchByChange={setSearchBy}
          />
        </section>

        <CreateLeadSection onOpenCreate={() => setIsCreateOpen(true)} />

        <section
          className="lead-tracker__panel lead-tracker__panel--list"
          aria-label="Lead list"
        >
          <div className="lead-tracker__list-header">
            <h2 className="lead-tracker__panel-title">Leads</h2>
            {isFetching && !isLoading ? (
              <span className="lead-tracker__refreshing" aria-live="polite">
                Updating...
              </span>
            ) : null}
          </div>

          {statusError !== null ? (
            <InlineErrorBanner message={statusError} />
          ) : null}

          {isLoading ? (
            <LeadListState variant="loading" />
          ) : isError ? (
            <LeadListState variant="error" onRetry={() => void refetch()} />
          ) : leads.length === 0 ? (
            <LeadListState
              variant={hasActiveSearch ? 'no-results' : 'empty'}
            />
          ) : (
            <LeadList
              leads={leads}
              pendingStatusLeadId={pendingStatusLeadId}
              onStatusChange={handleStatusChange}
            />
          )}
        </section>
      </main>

      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLeadCreated}
      />
    </div>
  );
}
