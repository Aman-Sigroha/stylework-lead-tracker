import type { LeadSortField, LeadSortOrder } from '../../../types/lead.js';

type LeadSortControlsProps = {
  sortField: LeadSortField;
  sortOrder: LeadSortOrder;
  onSortFieldChange: (value: LeadSortField) => void;
  onSortOrderChange: (value: LeadSortOrder) => void;
};

const SORT_FIELD_OPTIONS: { value: LeadSortField; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Status' },
];

const SORT_ORDER_OPTIONS: { value: LeadSortOrder; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export function LeadSortControls({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
}: LeadSortControlsProps) {
  return (
    <div className="lead-sort">
      <label className="lead-sort__field">
        <span className="lead-sort__label">Sort by</span>
        <select
          className="lead-sort__select"
          aria-label="Sort by"
          value={sortField}
          onChange={(event) =>
            onSortFieldChange(event.target.value as LeadSortField)
          }
        >
          {SORT_FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="lead-sort__field">
        <span className="lead-sort__label">Direction</span>
        <select
          className="lead-sort__select"
          aria-label="Direction"
          value={sortOrder}
          onChange={(event) =>
            onSortOrderChange(event.target.value as LeadSortOrder)
          }
          disabled={sortField === 'default'}
          aria-disabled={sortField === 'default'}
        >
          {SORT_ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
