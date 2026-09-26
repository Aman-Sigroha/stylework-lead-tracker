import { useEffect, useState } from 'react';
import { CreateLeadModal } from './components/CreateLeadModal.tsx';
import { DeleteLeadDialog } from './components/DeleteLeadDialog.tsx';
import { EditLeadModal } from './components/EditLeadModal.tsx';
import { CreateLeadSection } from './components/CreateLeadSection.tsx';
import { LeadAdvancedFilters } from './components/LeadAdvancedFilters.tsx';
import { LeadList } from './components/LeadList.tsx';
import { LeadListState } from './components/LeadListState.tsx';
import { LeadPaginationControls } from './components/LeadPaginationControls.tsx';
import { LeadSearchControls } from './components/LeadSearchControls.tsx';
import { LeadSortControls } from './components/LeadSortControls.tsx';
import { SuccessToast } from './components/SuccessToast.tsx';
import { InlineErrorBanner } from './components/InlineErrorBanner.tsx';
import { useDebouncedValue } from './hooks/useDebouncedValue.ts';
import { useLeadsQuery } from './hooks/useLeadsQuery.ts';
import { useLogoutMutation } from '../auth/hooks/useLogoutMutation.ts';
import { useUpdateLeadStatusMutation } from './hooks/useUpdateLeadStatusMutation.ts';
import { ApiRequestError } from '../../lib/api-errors.js';
import { getStatusUpdateErrorMessage } from './lib/status-update-errors.ts';
import type {
  Lead,
  LeadPageSize,
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
  LeadStatus,
  LeadStatusFilter,
} from '../../types/lead.js';
import './LeadTrackerPage.css';

export function LeadTrackerPage() {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<LeadSearchBy>('all');
  const [sortField, setSortField] = useState<LeadSortField>('default');
  const [sortOrder, setSortOrder] = useState<LeadSortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<LeadPageSize>(20);
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const logoutMutation = useLogoutMutation();
  const updateLeadStatusMutation = useUpdateLeadStatusMutation();
  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: debouncedSearch,
    searchBy,
    sortField,
    sortOrder,
    page,
    pageSize,
    statusFilter,
    createdFrom,
    createdTo,
  });

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    searchBy,
    sortField,
    sortOrder,
    pageSize,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  useEffect(() => {
    const pagination = data?.pagination;
    if (pagination === undefined) {
      return;
    }

    if (pagination.totalPages === 0) {
      if (page !== 1) {
        setPage(1);
      }
      return;
    }

    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [data?.pagination, page]);

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
  const hasActiveFilters =
    statusFilter !== 'all' ||
    createdFrom.trim() !== '' ||
    createdTo.trim() !== '';
  const hasQueryConstraints = hasActiveSearch || hasActiveFilters;
  const leads = data?.leads ?? [];
  const pagination = data?.pagination;

  const handleLeadCreated = () => {
    setIsCreateOpen(false);
    setSuccessMessage('Lead created successfully.');
  };

  const handleLeadUpdated = () => {
    setEditingLead(null);
    setSuccessMessage('Lead updated successfully.');
  };

  const handleLeadDeleted = () => {
    setDeletingLead(null);
    setSuccessMessage('Lead deleted successfully.');
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

  const showListLoading =
    isLoading || (isFetching && leads.length === 0 && !isError);

  return (
    <div className="lead-tracker">
      {successMessage !== null ? (
        <SuccessToast message={successMessage} />
      ) : null}

      <header className="lead-tracker__header">
        <div className="lead-tracker__header-top">
          <p className="lead-tracker__eyebrow">Stylework</p>
          <button
            type="button"
            className="lead-tracker__logout"
            onClick={() => {
              logoutMutation.mutate();
            }}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
          </button>
        </div>
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
          <LeadAdvancedFilters
            statusFilter={statusFilter}
            createdFrom={createdFrom}
            createdTo={createdTo}
            onStatusFilterChange={setStatusFilter}
            onCreatedFromChange={setCreatedFrom}
            onCreatedToChange={setCreatedTo}
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

          <LeadSortControls
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={setSortField}
            onSortOrderChange={setSortOrder}
          />

          {pagination !== undefined ? (
            <LeadPaginationControls
              pagination={pagination}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}

          {showListLoading ? (
            <LeadListState variant="loading" />
          ) : isError ? (
            <LeadListState variant="error" onRetry={() => void refetch()} />
          ) : leads.length === 0 ? (
            <LeadListState
              variant={hasQueryConstraints ? 'no-results' : 'empty'}
            />
          ) : (
            <LeadList
              leads={leads}
              pendingStatusLeadId={pendingStatusLeadId}
              onEditLead={setEditingLead}
              onDeleteLead={setDeletingLead}
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

      <EditLeadModal
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onUpdated={handleLeadUpdated}
      />

      <DeleteLeadDialog
        lead={deletingLead}
        onClose={() => setDeletingLead(null)}
        onDeleted={handleLeadDeleted}
      />
    </div>
  );
}
