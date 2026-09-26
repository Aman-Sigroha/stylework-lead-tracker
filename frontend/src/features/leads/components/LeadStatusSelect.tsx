import { LEAD_STATUSES, type Lead, type LeadStatus } from '../../../types/lead.js';

type LeadStatusSelectProps = {
  lead: Lead;
  isUpdating: boolean;
  onStatusChange: (
    leadId: string,
    status: LeadStatus,
    currentStatus: LeadStatus,
  ) => void;
};

function formatStatusLabel(status: LeadStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function LeadStatusSelect({
  lead,
  isUpdating,
  onStatusChange,
}: LeadStatusSelectProps) {
  const selectId = `lead-status-${lead.id}`;

  return (
    <div className="lead-status-select">
      <label className="lead-status-select__label" htmlFor={selectId}>
        Status for {lead.name}
      </label>
      <select
        id={selectId}
        className="lead-status-select__control"
        value={lead.status}
        disabled={isUpdating}
        aria-busy={isUpdating}
        onChange={(event) => {
          const nextStatus = event.target.value as LeadStatus;
          onStatusChange(lead.id, nextStatus, lead.status);
        }}
      >
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatStatusLabel(status)}
          </option>
        ))}
      </select>
      {isUpdating ? (
        <span className="lead-status-select__loading" aria-live="polite">
          Saving...
        </span>
      ) : null}
    </div>
  );
}
