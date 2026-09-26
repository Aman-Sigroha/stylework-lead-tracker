import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../../lib/api-errors.js';
import { formatLeadDate } from '../../lib/format-date.js';
import { LEAD_STATUSES } from '../../types/lead.js';
import type { FetchLeadsParams } from './api/leads-api.js';
import { createFetchLeadsResult } from './lib/leads-query-response.js';
import { mockLead, mockLeadTwo } from '../../test/fixtures/leads.js';
import { renderLeadTracker } from '../../test/render-lead-tracker.tsx';

function listQuery(
  overrides: Partial<FetchLeadsParams> = {},
): FetchLeadsParams {
  return {
    searchBy: 'all',
    page: 1,
    limit: 20,
    ...overrides,
  };
}

const {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  exportLeadsCsv,
  exportLeadsXlsx,
  previewLeadImport,
  confirmLeadImport,
} = vi.hoisted(() => ({
  fetchLeads: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  updateLeadStatus: vi.fn(),
  exportLeadsCsv: vi.fn(),
  exportLeadsXlsx: vi.fn(),
  previewLeadImport: vi.fn(),
  confirmLeadImport: vi.fn(),
}));

vi.mock('./api/leads-api.js', () => ({
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  exportLeadsCsv,
  exportLeadsXlsx,
}));

vi.mock('./api/leads-import-api.js', () => ({
  previewLeadImport,
  confirmLeadImport,
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

function getSortBySelect() {
  return within(getLeadListSection()).getByLabelText('Sort by');
}

function getSortDirectionSelect() {
  return within(getLeadListSection()).getByLabelText('Direction');
}

function getSearchInput() {
  return within(getSearchSection()).getByPlaceholderText('Search leads...');
}

function getSearchBySelect() {
  return within(getSearchSection()).getByLabelText('Search by scope');
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
    fetchLeads.mockResolvedValue(
      createFetchLeadsResult([mockLead, mockLeadTwo], {
        total: 2,
        totalPages: 1,
      }),
    );
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
      fetchLeads.mockResolvedValue(createFetchLeadsResult([], { total: 0, totalPages: 0 }));
      renderLeadTracker();

      expect(
        await screen.findByText('No leads yet. Create your first lead to get started.'),
      ).toBeInTheDocument();
    });

    it('shows no-results state when searching', async () => {
      fetchLeads.mockImplementation(({ search }) =>
        Promise.resolve(
          createFetchLeadsResult(search === 'nomatch' ? [] : [mockLead], {
            total: search === 'nomatch' ? 0 : 1,
            totalPages: search === 'nomatch' ? 0 : 1,
          }),
        ),
      );

      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'nomatch');

      expect(
        await screen.findByText('No leads match your search or filters.', {
          timeout: 2000,
        }),
      ).toBeInTheDocument();
    });

    it('shows API error state and Retry control', async () => {
      fetchLeads.mockRejectedValueOnce(new Error('Network error'));
      renderLeadTracker();

      expect(
        await screen.findByText('Unable to load leads. Please try again.'),
      ).toBeInTheDocument();

      fetchLeads.mockResolvedValue(createFetchLeadsResult([mockLead]));
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
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane' }),
        );
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
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane', searchBy: 'name' }),
        );
      });
    });

    it('sends email scope when Email is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSearchBySelect(), 'email');
      await typeSearchTerm(user, 'jane@example.com');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane@example.com', searchBy: 'email' }),
        );
      });
    });

    it('sends phone scope when Phone is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSearchBySelect(), 'phone');
      await typeSearchTerm(user, '555');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: '555', searchBy: 'phone' }),
        );
      });
    });

    it('returns to the full list when search is cleared', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'jane');
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane' }),
        );
      });

      await typeSearchTerm(user, '');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(listQuery());
      });
    });
  });

  describe('sort', () => {
    it('renders sort controls above the lead list', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      expect(getSortBySelect()).toBeInTheDocument();
      expect(getSortDirectionSelect()).toBeInTheDocument();
      expect(getSortBySelect()).toHaveValue('default');
    });

    it('requests name sorting when Name is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'name');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ sortBy: 'name', sortOrder: 'desc' }),
        );
      });
    });

    it('requests email sorting when Email is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'email');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ sortBy: 'email', sortOrder: 'desc' }),
        );
      });
    });

    it('requests status sorting when Status is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'status');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ sortBy: 'status', sortOrder: 'desc' }),
        );
      });
    });

    it('updates sortOrder when direction changes', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'name');
      await user.selectOptions(getSortDirectionSelect(), 'asc');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ sortBy: 'name', sortOrder: 'asc' }),
        );
      });
    });

    it('combines search and sorting in the API request', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'email');
      await typeSearchTerm(user, 'jane');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({
            search: 'jane',
            sortBy: 'email',
            sortOrder: 'desc',
          }),
        );
      });
    });

    it('omits sortBy when Default is selected', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'name');
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'name' }),
        );
      });

      await user.selectOptions(getSortBySelect(), 'default');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(listQuery());
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

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText('Name')).toBeInTheDocument();
      expect(within(dialog).getByLabelText('Email')).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Phone/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText('Status')).toBeInTheDocument();
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
        .mockResolvedValueOnce(
          createFetchLeadsResult([mockLead, mockLeadTwo], {
            total: 2,
            totalPages: 1,
          }),
        )
        .mockResolvedValue(
          createFetchLeadsResult([mockLeadTwo], { total: 1, totalPages: 1 }),
        );
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

  describe('pagination and filters', () => {
    function getPaginationRegion() {
      return within(getLeadListSection()).getByLabelText('Lead list pagination');
    }

    function getStatusFilterSelect() {
      return within(getSearchSection()).getByLabelText('Filter by status');
    }

    it('renders pagination controls with total count', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const pagination = getPaginationRegion();
      expect(within(pagination).getByText('2 results')).toBeInTheDocument();
      expect(within(pagination).getByText('Page 1 of 1')).toBeInTheDocument();
      expect(
        within(pagination).getByRole('button', { name: 'Previous' }),
      ).toBeDisabled();
      expect(
        within(pagination).getByRole('button', { name: 'Next' }),
      ).toBeDisabled();
    });

    it('disables Previous on the first page and Next on the last page', async () => {
      fetchLeads.mockImplementation(({ page = 1 }) =>
        Promise.resolve(
          createFetchLeadsResult([mockLead], {
            page,
            limit: 20,
            total: 2,
            totalPages: 2,
          }),
        ),
      );

      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const pagination = getPaginationRegion();
      expect(
        within(pagination).getByRole('button', { name: 'Previous' }),
      ).toBeDisabled();
      expect(
        within(pagination).getByRole('button', { name: 'Next' }),
      ).not.toBeDisabled();

      await user.click(
        within(pagination).getByRole('button', { name: 'Next' }),
      );

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(listQuery({ page: 2, limit: 20 }));
      });
      expect(
        within(getPaginationRegion()).getByRole('button', { name: 'Next' }),
      ).toBeDisabled();
    });

    it('changes page size through the selector', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(
        within(getPaginationRegion()).getByLabelText('Page size'),
        '50',
      );

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(listQuery({ limit: 50 }));
      });
    });

    it('requests status filtering from the backend', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getStatusFilterSelect(), 'qualified');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ status: 'qualified' }),
        );
      });
    });

    it('requests date filtering from the backend', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.type(
        within(getSearchSection()).getByLabelText('Created from'),
        '2026-03-01',
      );
      await user.type(
        within(getSearchSection()).getByLabelText('Created to'),
        '2026-03-31',
      );

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({
            createdFrom: '2026-03-01',
            createdTo: '2026-03-31',
          }),
        );
      });
    });

    it('combines search, filters, and sorting in the API request', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'name');
      await user.selectOptions(getStatusFilterSelect(), 'new');
      await typeSearchTerm(user, 'jane');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({
            search: 'jane',
            sortBy: 'name',
            sortOrder: 'desc',
            status: 'new',
          }),
        );
      });
    });

    it('resets page to 1 when search changes', async () => {
      fetchLeads.mockImplementation(({ page }) =>
        Promise.resolve(
          createFetchLeadsResult([mockLead], {
            page,
            total: 3,
            totalPages: 3,
            limit: 1,
          }),
        ),
      );

      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.click(
        within(getLeadListSection()).getByRole('button', { name: 'Next' }),
      );

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ page: 2, limit: 20 }),
        );
      });

      await typeSearchTerm(user, 'jane');

      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane', page: 1, limit: 20 }),
        );
      });
    });

    it('shows an empty filtered state when no leads match', async () => {
      fetchLeads.mockResolvedValue(
        createFetchLeadsResult([], { total: 0, totalPages: 0 }),
      );

      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('0 results');

      await user.selectOptions(getStatusFilterSelect(), 'lost');

      expect(
        await screen.findByText('No leads match your search or filters.'),
      ).toBeInTheDocument();
    });

    it('refetches the current query after a successful mutation', async () => {
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

  describe('lead export', () => {
    beforeEach(() => {
      exportLeadsCsv.mockResolvedValue(undefined);
      exportLeadsXlsx.mockResolvedValue(undefined);
    });

    function getExportCsvButton() {
      return within(getSearchSection()).getByRole('button', {
        name: 'Export CSV',
      });
    }

    function getExportExcelButton() {
      return within(getSearchSection()).getByRole('button', {
        name: 'Export Excel',
      });
    }

    it('renders the Export CSV and Export Excel buttons', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      expect(getExportCsvButton()).toBeInTheDocument();
      expect(getExportExcelButton()).toBeInTheDocument();
    });

    it('exports with the current search and searchBy values', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'jane');
      await user.selectOptions(getSearchBySelect(), 'name');
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane', searchBy: 'name' }),
        );
      });

      await user.click(getExportCsvButton());

      await waitFor(() => {
        expect(exportLeadsCsv).toHaveBeenCalledWith({
          search: 'jane',
          searchBy: 'name',
        });
      });
    });

    it('exports with status and date filters', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(
        within(getSearchSection()).getByLabelText('Filter by status'),
        'qualified',
      );
      await user.type(
        within(getSearchSection()).getByLabelText('Created from'),
        '2026-03-01',
      );
      await user.type(
        within(getSearchSection()).getByLabelText('Created to'),
        '2026-03-31',
      );

      await user.click(getExportCsvButton());

      await waitFor(() => {
        expect(exportLeadsCsv).toHaveBeenCalledWith({
          searchBy: 'all',
          status: 'qualified',
          createdFrom: '2026-03-01',
          createdTo: '2026-03-31',
        });
      });
    });

    it('exports with sorting and omits pagination params', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.selectOptions(getSortBySelect(), 'email');
      await user.selectOptions(getSortDirectionSelect(), 'asc');
      await user.click(getExportCsvButton());

      await waitFor(() => {
        expect(exportLeadsCsv).toHaveBeenCalledWith({
          searchBy: 'all',
          sortBy: 'email',
          sortOrder: 'asc',
        });
      });

      const exportArgs = exportLeadsCsv.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(exportArgs.page).toBeUndefined();
      expect(exportArgs.limit).toBeUndefined();
    });

    it('disables the CSV button while CSV export is in progress', async () => {
      const user = userEvent.setup();
      let resolveExport: (() => void) | undefined;
      exportLeadsCsv.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveExport = resolve;
          }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const exportButton = getExportCsvButton();
      await user.click(exportButton);

      expect(exportButton).toBeDisabled();
      expect(exportButton).toHaveTextContent('Exporting...');
      expect(getExportExcelButton()).not.toBeDisabled();

      resolveExport?.();
      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('shows an error when CSV export fails', async () => {
      const user = userEvent.setup();
      exportLeadsCsv.mockRejectedValue(
        new ApiRequestError('Failed to export leads', 500, {
          success: false,
          error: { message: 'Failed to export leads' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.click(getExportCsvButton());

      expect(
        await within(getSearchSection()).findByText('Failed to export leads'),
      ).toBeInTheDocument();
    });

    it('passes current filters and sorting to Excel export without pagination', async () => {
      const user = userEvent.setup();
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await typeSearchTerm(user, 'jane');
      await user.selectOptions(getSearchBySelect(), 'email');
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(
          listQuery({ search: 'jane', searchBy: 'email' }),
        );
      });
      await user.selectOptions(getSortBySelect(), 'status');
      await user.selectOptions(getSortDirectionSelect(), 'desc');
      await user.click(getExportExcelButton());

      await waitFor(() => {
        expect(exportLeadsXlsx).toHaveBeenCalledWith({
          search: 'jane',
          searchBy: 'email',
          sortBy: 'status',
          sortOrder: 'desc',
        });
      });

      const exportArgs = exportLeadsXlsx.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(exportArgs.page).toBeUndefined();
      expect(exportArgs.limit).toBeUndefined();
    });

    it('disables the Excel button while Excel export is in progress', async () => {
      const user = userEvent.setup();
      let resolveExport: (() => void) | undefined;
      exportLeadsXlsx.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveExport = resolve;
          }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const exportButton = getExportExcelButton();
      await user.click(exportButton);

      expect(exportButton).toBeDisabled();
      expect(exportButton).toHaveTextContent('Exporting...');

      resolveExport?.();
      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('shows an error when Excel export fails', async () => {
      const user = userEvent.setup();
      exportLeadsXlsx.mockRejectedValue(
        new ApiRequestError('Failed to export leads', 500, {
          success: false,
          error: { message: 'Failed to export leads' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.click(getExportExcelButton());

      expect(
        await within(getSearchSection()).findByText('Failed to export leads'),
      ).toBeInTheDocument();
    });
  });

  describe('CSV import', () => {
    const importCsv = `${'name,email,phone,status\n'}Jane,jane@example.com,,new`;

    function getImportButton() {
      return within(getSearchSection()).getByRole('button', {
        name: 'Import CSV',
      });
    }

    function getImportFileInput() {
      return within(getSearchSection()).getByLabelText('Import CSV file');
    }

    beforeEach(() => {
      confirmLeadImport.mockResolvedValue({ importedCount: 1, leads: [] });
    });

    it('renders the Import CSV button', async () => {
      renderLeadTracker();
      await screen.findByText('Jane Doe');

      expect(getImportButton()).toBeInTheDocument();
    });

    it('shows preview counts and validation errors', async () => {
      const user = userEvent.setup();
      previewLeadImport.mockResolvedValue({
        totalRows: 2,
        validRows: 1,
        invalidRows: 1,
        duplicateRows: 0,
        errors: [
          {
            row: 3,
            field: 'email',
            type: 'validation',
            message: 'Invalid email address',
          },
        ],
        validLeads: [
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
        ],
      });

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const file = new File([importCsv], 'leads.csv', { type: 'text/csv' });
      await user.upload(getImportFileInput(), file);

      const dialog = await screen.findByRole('dialog', {
        name: 'Import CSV preview',
      });
      expect(within(dialog).getByText('Total rows')).toBeInTheDocument();
      expect(within(dialog).getByText('Ready to import')).toBeInTheDocument();
      expect(within(dialog).getByText('Duplicates')).toBeInTheDocument();
      expect(within(dialog).getByText('Invalid')).toBeInTheDocument();
      expect(
        within(dialog).getByText('Row 3, email: Invalid email address'),
      ).toBeInTheDocument();
    });

    it('shows duplicate rows separately from validation errors', async () => {
      const user = userEvent.setup();
      previewLeadImport.mockResolvedValue({
        totalRows: 2,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 1,
        errors: [
          {
            row: 3,
            field: 'email',
            type: 'duplicate',
            message: 'Email already exists in this import',
            email: 'jane@example.com',
          },
        ],
        validLeads: [
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
        ],
      });

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.upload(
        getImportFileInput(),
        new File([importCsv], 'leads.csv', { type: 'text/csv' }),
      );

      const dialog = await screen.findByRole('dialog', {
        name: 'Import CSV preview',
      });
      expect(
        within(dialog).getByRole('heading', { name: 'Duplicates' }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          'Row 3: jane@example.com — Email already exists in this import',
        ),
      ).toBeInTheDocument();
    });

    it('disables import when there are zero valid rows', async () => {
      const user = userEvent.setup();
      previewLeadImport.mockResolvedValue({
        totalRows: 1,
        validRows: 0,
        invalidRows: 1,
        duplicateRows: 0,
        errors: [
          {
            row: 2,
            field: 'name',
            type: 'validation',
            message: 'Name is required',
          },
        ],
        validLeads: [],
      });

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.upload(
        getImportFileInput(),
        new File([importCsv], 'leads.csv', { type: 'text/csv' }),
      );

      const dialog = await screen.findByRole('dialog', {
        name: 'Import CSV preview',
      });
      expect(
        within(dialog).getByRole('button', { name: 'Import Valid Rows' }),
      ).toBeDisabled();
      expect(
        within(dialog).getByText(/No rows are ready to import/i),
      ).toBeInTheDocument();
    });

    it('confirms import, refetches leads, and resets to page 1', async () => {
      const user = userEvent.setup();
      previewLeadImport.mockResolvedValue({
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        errors: [],
        validLeads: [
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
        ],
      });

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.upload(
        getImportFileInput(),
        new File([importCsv], 'leads.csv', { type: 'text/csv' }),
      );
      await screen.findByRole('dialog', { name: 'Import CSV preview' });

      await user.click(screen.getByRole('button', { name: 'Import Valid Rows' }));

      await waitFor(() => {
        expect(confirmLeadImport).toHaveBeenCalledWith([
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
        ]);
      });
      expect(
        await screen.findByText('Successfully imported 1 lead.'),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(fetchLeads).toHaveBeenLastCalledWith(listQuery({ page: 1 }));
      });
    });

    it('shows preview API errors', async () => {
      const user = userEvent.setup();
      previewLeadImport.mockRejectedValue(
        new ApiRequestError('Malformed CSV file', 400, {
          success: false,
          error: { message: 'Malformed CSV file' },
        }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      await user.upload(
        getImportFileInput(),
        new File([importCsv], 'leads.csv', { type: 'text/csv' }),
      );

      expect(
        await within(getSearchSection()).findByText('Malformed CSV file'),
      ).toBeInTheDocument();
    });

    it('disables the import button while preview is loading', async () => {
      const user = userEvent.setup();
      let resolvePreview: ((value: unknown) => void) | undefined;
      previewLeadImport.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePreview = resolve;
          }),
      );

      renderLeadTracker();
      await screen.findByText('Jane Doe');

      const importButton = getImportButton();
      void user.upload(
        getImportFileInput(),
        new File([importCsv], 'leads.csv', { type: 'text/csv' }),
      );

      await waitFor(() => {
        expect(importButton).toBeDisabled();
      });

      resolvePreview?.({
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        errors: [],
        validLeads: [
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
        ],
      });
    });
  });
});
