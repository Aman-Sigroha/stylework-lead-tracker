type LeadListStateProps = {
  variant: 'loading' | 'error' | 'empty' | 'no-results';
  message?: string;
  onRetry?: () => void;
};

const DEFAULT_MESSAGES: Record<LeadListStateProps['variant'], string> = {
  loading: 'Loading leads...',
  error: 'Unable to load leads. Please try again.',
  empty: 'No leads yet. Create your first lead to get started.',
  'no-results': 'No leads match your search or filters.',
};

export function LeadListState({
  variant,
  message,
  onRetry,
}: LeadListStateProps) {
  return (
    <div
      className={`lead-list-state lead-list-state--${variant}`}
      role={variant === 'loading' ? 'status' : undefined}
      aria-live={variant === 'loading' ? 'polite' : undefined}
    >
      <p>{message ?? DEFAULT_MESSAGES[variant]}</p>
      {variant === 'error' && onRetry !== undefined ? (
        <button type="button" className="lead-list-state__retry" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
