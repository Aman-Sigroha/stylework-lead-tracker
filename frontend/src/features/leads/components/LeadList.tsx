import { formatLeadDate } from '../../../lib/format-date.js';
import type { Lead, LeadStatus } from '../../../types/lead.js';
import { LeadStatusSelect } from './LeadStatusSelect.tsx';

type LeadListProps = {
  leads: Lead[];
  pendingStatusLeadId: string | null;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onStatusChange: (
    leadId: string,
    status: LeadStatus,
    currentStatus: LeadStatus,
  ) => void;
};

function formatPhone(phone: string | null): string {
  return phone ?? '—';
}

export function LeadList({
  leads,
  pendingStatusLeadId,
  onEditLead,
  onDeleteLead,
  onStatusChange,
}: LeadListProps) {
  return (
    <div className="lead-table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Status</th>
            <th scope="col">Created at</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td data-label="Name">{lead.name}</td>
              <td data-label="Email">{lead.email}</td>
              <td data-label="Phone">{formatPhone(lead.phone)}</td>
              <td data-label="Status">
                <LeadStatusSelect
                  lead={lead}
                  isUpdating={pendingStatusLeadId === lead.id}
                  onStatusChange={onStatusChange}
                />
              </td>
              <td data-label="Created at">{formatLeadDate(lead.createdAt)}</td>
              <td data-label="Actions">
                <div className="lead-table__actions">
                  <button
                    type="button"
                    className="lead-table__edit-button"
                    onClick={() => onEditLead(lead)}
                    aria-label={`Edit ${lead.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="lead-table__delete-button"
                    onClick={() => onDeleteLead(lead)}
                    aria-label={`Delete ${lead.name}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
