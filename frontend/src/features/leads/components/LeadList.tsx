import { formatLeadDate } from '../../../lib/format-date.js';
import type { Lead, LeadStatus } from '../../../types/lead.js';
import { LeadStatusSelect } from './LeadStatusSelect.tsx';

type LeadListProps = {
  leads: Lead[];
  pendingStatusLeadId: string | null;
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
