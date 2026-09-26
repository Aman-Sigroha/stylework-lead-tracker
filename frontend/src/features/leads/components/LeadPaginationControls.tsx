import {
  LEAD_PAGE_SIZE_OPTIONS,
  type LeadPageSize,
} from '../../../types/lead.js';
import type { LeadsPagination } from '../../../types/pagination.js';

type LeadPaginationControlsProps = {
  pagination: LeadsPagination;
  pageSize: LeadPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: LeadPageSize) => void;
};

export function LeadPaginationControls({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: LeadPaginationControlsProps) {
  const { page, total, totalPages } = pagination;
  const isFirstPage = page <= 1;
  const isLastPage = totalPages === 0 || page >= totalPages;
  const displayTotalPages = totalPages === 0 ? 1 : totalPages;

  return (
    <div className="lead-pagination" aria-label="Lead list pagination">
      <p className="lead-pagination__summary">
        {total === 0
          ? '0 results'
          : `${total} result${total === 1 ? '' : 's'}`}
      </p>

      <div className="lead-pagination__controls">
        <label className="lead-pagination__field">
          <span className="lead-pagination__label">Page size</span>
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value) as LeadPageSize);
            }}
            aria-label="Page size"
          >
            {LEAD_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="lead-pagination__nav">
          <button
            type="button"
            className="lead-pagination__button"
            onClick={() => {
              onPageChange(page - 1);
            }}
            disabled={isFirstPage}
          >
            Previous
          </button>
          <span className="lead-pagination__status" aria-live="polite">
            Page {page} of {displayTotalPages}
          </span>
          <button
            type="button"
            className="lead-pagination__button"
            onClick={() => {
              onPageChange(page + 1);
            }}
            disabled={isLastPage}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
