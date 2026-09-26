import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../../lib/api-errors.js';
import { formatLeadDate } from '../../lib/format-date.js';
import { LEAD_STATUSES } from '../../types/lead.js';
import { mockLead, mockLeadTwo } from '../../test/fixtures/leads.js';
import { renderLeadTracker } from '../../test/render-lead-tracker.tsx';

const {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
} = vi.hoisted(() => ({
  fetchLeads: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

vi.mock('./api/leads-api.js', () => ({
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
}));

function getSearchSection() {
  return screen.getByRole('region', { name: 'Search leads' });
}

function getCreateSection() {
  return screen.getByRole('region', { name: 'Create lead' });
}

function getLeadListSection() {
  return screen.getByRole('region', { name: 'Lead list' });
}

function getSearchInput() {
  return within(getSearchSection()).getByPlaceholderText('Search leads...');
}

function getSearchBySelect() {
  return within(getSearchSection()).getByRole('combobox');
}

function openCreateLeadDialog(user: ReturnType<typeof userEvent.setup>) {
  return user.click(
    within(getCreateSection()).getByRole('button', { name: 'Create lead' }),
  );
}

function submitCreateLeadForm(user: ReturnType<typeof userEvent.setup>) {
  return user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Create lead',
    }),
  );
}

async function typeSearchTerm(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.clear(getSearchInput());
  if (value !== '') {
    await user.type(getSearchInput(), value);
  }
}

describe('LeadTrackerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLeads.mockResolvedValue([mockLead, mockLeadTwo]);
    createLead.mockResolvedValue(mockLead);
    updateLead.mockResolvedValue({
      ...mockLead,
      name: 'Updated Jane',
      email: 'updated@example.com',
    });
    updateLeadStatus.mockResolvedValue({
      ...mockLead,
      status: 'contacted',
    });
    deleteLead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  describe('lead list', () => {
    it('renders returned leads', async () => {
      renderLeadTracker();

      expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('displays name, email, phone, status, and created date', async () => {
      renderLeadTracker();

      await screen.findByText('Jane Doe');
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1 555 0100')).toBeInTheDocument();
      expect(screen.getByText(formatLeadDate(mockLead.createdAt))).toBeInTheDocument();
      expect(screen.getByLabelText('Status for Jane Doe')).toHaveValue('new');
    });

    it('shows loading state', () => {
      fetchLeads.mockImplementation(() => new Promise(() => {}));
      renderLeadTracker();

      expect(
        within(getLeadListSection()).getByText('Loading leads...'),
      ).toBeInTheDocument();
    });

    it('shows empty-database state', async () => {
      fetchLeads.mockResolvedValue([]);
      renderLeadTracker();

      expect(
        await screen.findByText('No leads yet. Create your first lead to get started.'),
      ).toBeInTheDocument();
    });

    it('shows no-results state when searching', async () => {
      fetchLeads.mockImplementation(({ search }) =>
        Promise.resolve(search === 'nomatch' ? [] : [mockLead]),
      );

      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'nomatch');

      expect(
        await screen.findByText('No leads match your search.', { timeout: 2000 }),
      ).toBeInTheDocument();
    });

    it('shows API error state and Retry control', async () => {
      fetchLeads.mockRejectedValueOnce(new Error('Network error'));
      renderLeadTracker();

      expect(
        await screen.findByText('Unable to load leads. Please try again.'),
      ).toBeInTheDocument();

      fetchLeads.mockResolvedValue([mockLead]);
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    });
  });

  describe('search', () => {
    it('updates the query after entering a search term', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'jane');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: 'jane',
          searchBy: 'all',
        });
      });
    });

    it('uses All as the default search scope', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      expect(getSearchBySelect()).toHaveValue('all');
    });

    it('sends name scope when Name is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSearchBySelect(), 'name');
      await typeSearchTerm(user, 'jane');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: 'jane',
          searchBy: 'name',
        });
      });
    });

    it('sends email scope when Email is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSearchBySelect(), 'email');
      await typeSearchTerm(user, 'jane@example.com');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: 'jane@example.com',
          searchBy: 'email',
        });
      });
    });

    it('sends phone scope when Phone is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSearchBySelect(), 'phone');
      await typeSearchTerm(user, '555');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: '555',
          searchBy: 'phone',
        });
      });
    });

    it('returns to the full list when search is cleared', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'jane');
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: 'jane',
          searchBy: 'all',
        });
      });

      await typeSearchTerm(user, '');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith({
          search: undefined,
          searchBy: 'all',
        });
      });
    });
  });

  describe('create lead', () => {
    it('opens the dialog when Create Lead is clicked', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows the create form fields', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('shows validation errors on empty submission', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await submitCreateLeadForm(user);

      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('shows a validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await submitCreateLeadForm(user);

      expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    });

    it('calls createLead with the expected payload on valid submission', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText(/Phone/), '+1 555 0100');
      await submitCreateLeadForm(user);

      await waitFor(() => {
        expect(createLead).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555 0100',
          status: 'new',
        });
      });
    });

    it('closes the dialog after successful creation', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await submitCreateLeadForm(user);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows a success indication after successful creation', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await submitCreateLeadForm(user);

      expect(
        await screen.findByText('Lead created successfully.'),
      ).toBeInTheDocument();
    });

    it('refetches the lead list after successful creation', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');
      const initialCalls = fetchLeads.mock.calls.length;

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await submitCreateLeadForm(user);

      await waitFor(() => {
        expect(fetchLeads.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('keeps the form open and preserves values when the API fails', async () => {
      const user = userEvent.setup();
      createLead.mockRejectedValue(
        new ApiRequestError('Validation failed', 400, {
          success: false,
          error: { message: 'Validation failed' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      await user.type(nameInput, 'Jane Doe');
      await user.type(emailInput, 'jane@example.com');
      await submitCreateLeadForm(user);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(nameInput).toHaveValue('Jane Doe');
      expect(emailInput).toHaveValue('jane@example.com');
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });

    it('disables submit while the create request is pending', async () => {
      const user = userEvent.setup();
      let resolveCreate!: (value: typeof mockLead) => void;
      createLead.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openCreateLeadDialog(user);
      await user.type(screen.getByLabelText('Name'), 'Jane Doe');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await submitCreateLeadForm(user);

      const submitButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Creating...',
      });
      expect(submitButton).toBeDisabled();

      resolveCreate(mockLead);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('edit lead', () => {
    function openEditLeadDialog(
      user: ReturnType<typeof userEvent.setup>,
      leadName = 'Jane Doe',
    ) {
      return user.click(
        screen.getByRole('button', { name: `Edit ${leadName}` }),
      );
    }

    function submitEditLeadForm(user: ReturnType<typeof userEvent.setup>) {
      return user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Save Changes',
        }),
      );
    }

    it('opens the edit modal with Edit Lead title', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        within(screen.getByRole('dialog')).getByRole('heading', {
          name: 'Edit Lead',
        }),
      ).toBeInTheDocument();
    });

    it('pre-fills the form with the selected lead values', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Jane Doe');
      expect(within(dialog).getByLabelText('Email')).toHaveValue('jane@example.com');
      expect(within(dialog).getByLabelText(/Phone/)).toHaveValue('+1 555 0100');
      expect(within(dialog).getByLabelText('Status')).toHaveValue('new');
    });

    it('calls updateLead with the expected payload on valid submission', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);
      const dialog = screen.getByRole('dialog');
      const nameInput = within(dialog).getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Jane');
      await submitEditLeadForm(user);

      await waitFor(() => {
        expect(updateLead).toHaveBeenCalledWith({
          id: mockLead.id,
          name: 'Updated Jane',
          email: 'jane@example.com',
          phone: '+1 555 0100',
          status: 'new',
        });
      });
    });

    it('closes the dialog and shows success after a successful update', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);
      await submitEditLeadForm(user);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(
        await screen.findByText('Lead updated successfully.'),
      ).toBeInTheDocument();
    });

    it('refetches the lead list after a successful update', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');
      const initialCalls = fetchLeads.mock.calls.length;

      await openEditLeadDialog(user);
      await submitEditLeadForm(user);

      await waitFor(() => {
        expect(fetchLeads.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('keeps the form open and preserves values when the API fails', async () => {
      const user = userEvent.setup();
      updateLead.mockRejectedValue(
        new ApiRequestError('Validation failed', 400, {
          success: false,
          error: { message: 'Validation failed' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);
      const dialog = screen.getByRole('dialog');
      const nameInput = within(dialog).getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Jane');
      await submitEditLeadForm(user);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(nameInput).toHaveValue('Updated Jane');
      expect(within(dialog).getByText('Validation failed')).toBeInTheDocument();
    });

    it('shows validation errors on invalid submission', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openEditLeadDialog(user);
      const dialog = screen.getByRole('dialog');
      await user.clear(within(dialog).getByLabelText('Name'));
      await user.clear(within(dialog).getByLabelText('Email'));
      await submitEditLeadForm(user);

      expect(await within(dialog).findByText('Name is required')).toBeInTheDocument();
      expect(within(dialog).getByText('Email is required')).toBeInTheDocument();
    });
  });

  describe('delete lead', () => {
    function getDeleteDialog() {
      return screen.getByRole('dialog', { name: 'Delete lead' });
    }

    function openDeleteLeadDialog(
      user: ReturnType<typeof userEvent.setup>,
      leadName = 'Jane Doe',
    ) {
      return user.click(
        screen.getByRole('button', { name: `Delete ${leadName}` }),
      );
    }

    it('opens a confirmation dialog when Delete is clicked', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openDeleteLeadDialog(user);

      const dialog = getDeleteDialog();
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByText('Are you sure you want to delete this lead?'),
      ).toBeInTheDocument();
      expect(within(dialog).getByText('Jane Doe')).toBeInTheDocument();
      expect(within(dialog).getByText('jane@example.com')).toBeInTheDocument();
    });

    it('does not call deleteLead when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openDeleteLeadDialog(user);
      await user.click(
        within(getDeleteDialog()).getByRole('button', { name: 'Cancel' }),
      );

      expect(deleteLead).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: 'Delete lead' }),
        ).not.toBeInTheDocument();
      });
    });

    it('calls deleteLead when Delete is confirmed', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openDeleteLeadDialog(user);
      await user.click(
        within(getDeleteDialog()).getByRole('button', { name: 'Delete' }),
      );

      await waitFor(() => {
        expect(deleteLead).toHaveBeenCalledWith(mockLead.id);
      });
    });

    it('closes the dialog and refreshes the list after a successful deletion', async () => {
      const user = userEvent.setup();
      fetchLeads
        .mockResolvedValueOnce([mockLead, mockLeadTwo])
        .mockResolvedValue([mockLeadTwo]);
      renderLeadTracker();
      await screen.findByText('Jane Doe');
      const initialCalls = fetchLeads.mock.calls.length;

      await openDeleteLeadDialog(user);
      await user.click(
        within(getDeleteDialog()).getByRole('button', { name: 'Delete' }),
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: 'Delete lead' }),
        ).not.toBeInTheDocument();
      });
      expect(
        await screen.findByText('Lead deleted successfully.'),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(fetchLeads.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('keeps the lead visible and shows an error when deletion fails', async () => {
      const user = userEvent.setup();
      deleteLead.mockRejectedValue(
        new ApiRequestError('Failed to delete lead', 500, {
          success: false,
          error: { message: 'Failed to delete lead' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await openDeleteLeadDialog(user);
      await user.click(
        within(getDeleteDialog()).getByRole('button', { name: 'Delete' }),
      );

      const dialog = await screen.findByRole('dialog', { name: 'Delete lead' });
      expect(
        within(dialog).getByText('Failed to delete lead'),
      ).toBeInTheDocument();
      expect(
        within(getLeadListSection()).getByText('Jane Doe'),
      ).toBeInTheDocument();
    });
  });

  describe('status update', () => {
    it('calls updateLeadStatus when a new status is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(
        screen.getByLabelText('Status for Jane Doe'),
        'contacted',
      );

      await waitFor(() => {
        expect(updateLeadStatus).toHaveBeenCalledWith({
          id: mockLead.id,
          status: 'contacted',
        });
      });
    });

    it('refreshes lead data after a successful status update', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');
      const initialCalls = fetchLeads.mock.calls.length;

      await user.selectOptions(
        screen.getByLabelText('Status for Jane Doe'),
        'contacted',
      );

      await waitFor(() => {
        expect(fetchLeads.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('does not silently change the displayed status when the update fails', async () => {
      const user = userEvent.setup();
      updateLeadStatus.mockRejectedValue(
        new ApiRequestError('Lead not found', 404, {
          success: false,
          error: { message: 'Lead not found' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(
        screen.getByLabelText('Status for Jane Doe'),
        'qualified',
      );

      expect(
        await screen.findByText('Lead not found. The list will refresh.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Status for Jane Doe')).toHaveValue('new');
    });

    it('shows all valid status options in the selector', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const statusSelect = screen.getByLabelText('Status for Jane Doe');
      const options = within(statusSelect).getAllByRole('option');

      expect(options).toHaveLength(LEAD_STATUSES.length);
      for (const status of LEAD_STATUSES) {
        expect(
          within(statusSelect).getByRole('option', { name: new RegExp(status, 'i') }),
        ).toBeInTheDocument();
      }
    });
  });
});
