import { LEAD_STATUSES, type LeadStatusFilter } from '../../../types/lead.js';

type LeadAdvancedFiltersProps = {
  statusFilter: LeadStatusFilter;
  createdFrom: string;
  createdTo: string;
  onStatusFilterChange: (value: LeadStatusFilter) => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
};

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function LeadAdvancedFilters({
  statusFilter,
  createdFrom,
  createdTo,
  onStatusFilterChange,
  onCreatedFromChange,
  onCreatedToChange,
}: LeadAdvancedFiltersProps) {
  return (
    <div className="lead-advanced-filters">
      <label className="lead-advanced-filters__field">
        <span className="lead-advanced-filters__label">Status</span>
        <select
          value={statusFilter}
          onChange={(event) => {
            onStatusFilterChange(event.target.value as LeadStatusFilter);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <label className="lead-advanced-filters__field">
        <span className="lead-advanced-filters__label">Created from</span>
        <input
          type="date"
          value={createdFrom}
          onChange={(event) => {
            onCreatedFromChange(event.target.value);
          }}
          aria-label="Created from"
        />
      </label>

      <label className="lead-advanced-filters__field">
        <span className="lead-advanced-filters__label">Created to</span>
        <input
          type="date"
          value={createdTo}
          onChange={(event) => {
            onCreatedToChange(event.target.value);
          }}
          aria-label="Created to"
        />
      </label>
    </div>
  );
}
