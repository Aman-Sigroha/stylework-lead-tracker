import { useState } from 'react';
import { exportLeadsCsv } from '../api/leads-api.js';
import { ApiRequestError } from '../../../lib/api-errors.js';
import type {
  LeadListSortBy,
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
  LeadStatusFilter,
} from '../../../types/lead.js';
import { InlineErrorBanner } from './InlineErrorBanner.tsx';

type LeadExportButtonProps = {
  search: string;
  searchBy: LeadSearchBy;
  sortField: LeadSortField;
  sortOrder: LeadSortOrder;
  statusFilter: LeadStatusFilter;
  createdFrom: string;
  createdTo: string;
};

export function LeadExportButton({
  search,
  searchBy,
  sortField,
  sortOrder,
  statusFilter,
  createdFrom,
  createdTo,
}: LeadExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);

    const trimmedSearch = search.trim();
    const sortBy: LeadListSortBy | undefined =
      sortField === 'default' ? undefined : sortField;
    const trimmedCreatedFrom = createdFrom.trim();
    const trimmedCreatedTo = createdTo.trim();

    try {
      await exportLeadsCsv({
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        searchBy,
        sortBy,
        sortOrder: sortBy === undefined ? undefined : sortOrder,
        status: statusFilter === 'all' ? undefined : statusFilter,
        createdFrom:
          trimmedCreatedFrom === '' ? undefined : trimmedCreatedFrom,
        createdTo: trimmedCreatedTo === '' ? undefined : trimmedCreatedTo,
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setExportError(error.message);
      } else if (error instanceof Error) {
        setExportError(error.message);
      } else {
        setExportError('Failed to export leads');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="lead-export">
      {exportError !== null ? (
        <InlineErrorBanner message={exportError} />
      ) : null}
      <button
        type="button"
        className="lead-export__button"
        onClick={() => void handleExport()}
        disabled={isExporting}
        aria-busy={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  );
}
