import { useState } from 'react';
import { LeadList } from './components/LeadList.tsx';
import { LeadListState } from './components/LeadListState.tsx';
import { LeadSearchControls } from './components/LeadSearchControls.tsx';
import { useDebouncedValue } from './hooks/useDebouncedValue.ts';
import { useLeadsQuery } from './hooks/useLeadsQuery.ts';
import type { LeadSearchBy } from '../../types/lead.js';
import './LeadTrackerPage.css';

export function LeadTrackerPage() {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<LeadSearchBy>('all');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch, isFetching } = useLeadsQuery({
    search: debouncedSearch,
    searchBy,
  });

  const hasActiveSearch = debouncedSearch.trim() !== '';
  const leads = data ?? [];

  return (
    <div className="lead-tracker">
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

        <section
          className="lead-tracker__panel lead-tracker__panel--placeholder"
          aria-label="Create lead"
        >
          <h2 className="lead-tracker__panel-title">Create lead</h2>
          <p className="lead-tracker__placeholder">
            New lead form will appear here.
          </p>
        </section>

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

          {isLoading ? (
            <LeadListState variant="loading" />
          ) : isError ? (
            <LeadListState variant="error" onRetry={() => void refetch()} />
          ) : leads.length === 0 ? (
            <LeadListState
              variant={hasActiveSearch ? 'no-results' : 'empty'}
            />
          ) : (
            <LeadList leads={leads} />
          )}
        </section>
      </main>
    </div>
  );
}
