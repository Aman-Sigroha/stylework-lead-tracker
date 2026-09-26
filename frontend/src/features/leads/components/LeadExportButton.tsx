import { useState } from 'react';
import { exportLeadsCsv, exportLeadsXlsx } from '../api/leads-api.js';
import { ApiRequestError } from '../../../lib/api-errors.js';
import type {
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
  LeadStatusFilter,
} from '../../../types/lead.js';
import { buildExportLeadsParams } from '../lib/build-export-params.js';
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

export function LeadExportButton(props: LeadExportButtonProps) {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportParams = buildExportLeadsParams(props);

  const handleExportError = (error: unknown) => {
    if (error instanceof ApiRequestError) {
      setExportError(error.message);
    } else if (error instanceof Error) {
      setExportError(error.message);
    } else {
      setExportError('Failed to export leads');
    }
  };

  const handleExportCsv = async () => {
    setExportError(null);
    setIsExportingCsv(true);

    try {
      await exportLeadsCsv(exportParams);
    } catch (error) {
      handleExportError(error);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportXlsx = async () => {
    setExportError(null);
    setIsExportingXlsx(true);

    try {
      await exportLeadsXlsx(exportParams);
    } catch (error) {
      handleExportError(error);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  return (
    <div className="lead-export">
      {exportError !== null ? (
        <InlineErrorBanner message={exportError} />
      ) : null}
      <div className="lead-export__actions">
        <button
          type="button"
          className="lead-export__button"
          onClick={() => void handleExportCsv()}
          disabled={isExportingCsv}
          aria-busy={isExportingCsv}
        >
          {isExportingCsv ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          type="button"
          className="lead-export__button"
          onClick={() => void handleExportXlsx()}
          disabled={isExportingXlsx}
          aria-busy={isExportingXlsx}
        >
          {isExportingXlsx ? 'Exporting...' : 'Export Excel'}
        </button>
      </div>
    </div>
  );
}
