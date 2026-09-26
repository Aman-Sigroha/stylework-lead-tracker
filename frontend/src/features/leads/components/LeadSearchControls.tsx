import type { LeadSearchBy } from '../../../types/lead.js';

type LeadSearchControlsProps = {
  search: string;
  searchBy: LeadSearchBy;
  onSearchChange: (value: string) => void;
  onSearchByChange: (value: LeadSearchBy) => void;
};

const SEARCH_BY_OPTIONS: { value: LeadSearchBy; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

export function LeadSearchControls({
  search,
  searchBy,
  onSearchChange,
  onSearchByChange,
}: LeadSearchControlsProps) {
  return (
    <div className="lead-search">
      <label className="lead-search__field">
        <span className="lead-search__label">Search</span>
        <input
          className="lead-search__input"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search leads..."
          autoComplete="off"
        />
      </label>

      <label className="lead-search__field">
        <span className="lead-search__label">Search by</span>
        <select
          className="lead-search__select"
          aria-label="Search by scope"
          value={searchBy}
          onChange={(event) =>
            onSearchByChange(event.target.value as LeadSearchBy)
          }
        >
          {SEARCH_BY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
