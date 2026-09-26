import { formatLeadDate } from '../../../lib/format-date.js';
import type { Lead } from '../../../types/lead.js';

type LeadListProps = {
  leads: Lead[];
};

function formatStatus(status: Lead['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatPhone(phone: string | null): string {
  return phone ?? '—';
}

export function LeadList({ leads }: LeadListProps) {
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
                <span className={`lead-status lead-status--${lead.status}`}>
                  {formatStatus(lead.status)}
                </span>
              </td>
              <td data-label="Created at">{formatLeadDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
