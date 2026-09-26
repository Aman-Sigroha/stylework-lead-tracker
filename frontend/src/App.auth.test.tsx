import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from './lib/api-errors.js';
import { renderWithProviders } from './test/render-lead-tracker.tsx';
import App from './App.tsx';

const { fetchCurrentUser, login, logout, fetchLeads } = vi.hoisted(() => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  fetchLeads: vi.fn(),
}));

vi.mock('./features/auth/api/auth-api.js', () => ({
  fetchCurrentUser,
  login,
  logout,
}));

vi.mock('./features/leads/api/leads-api.js', () => ({
  fetchLeads,
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

vi.mock('./lib/api-client.js', async () => {
  const actual = await vi.importActual<typeof import('./lib/api-client.js')>(
    './lib/api-client.js',
  );

  return {
    ...actual,
    apiRequest: vi.fn(actual.apiRequest),
  };
});

import { apiRequest } from './lib/api-client.js';
import { createFetchLeadsResult } from './features/leads/lib/leads-query-response.js';
import { mockLead, mockLeadTwo } from './test/fixtures/leads.js';

const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
};

describe('App authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCurrentUser.mockResolvedValue(null);
    fetchLeads.mockResolvedValue(
      createFetchLeadsResult([mockLead, mockLeadTwo], { total: 2 }),
    );
    login.mockResolvedValue(mockUser);
    logout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the login screen when unauthenticated', async () => {
    renderWithProviders(<App />);

    expect(await screen.findByText('Sign in to manage leads.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation errors for empty login submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText('Sign in to manage leads.');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows invalid credentials message', async () => {
    login.mockRejectedValue(
      new ApiRequestError('Invalid email or password', 401, {
        success: false,
        error: { message: 'Invalid email or password' },
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText('Sign in to manage leads.');

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('renders the authenticated app after successful login', async () => {
    fetchCurrentUser
      .mockResolvedValueOnce(null)
      .mockResolvedValue(mockUser);

    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText('Sign in to manage leads.');

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('renders the lead tracker when already authenticated', async () => {
    fetchCurrentUser.mockResolvedValue(mockUser);
    renderWithProviders(<App />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });

  it('returns to login after logout', async () => {
    fetchCurrentUser.mockResolvedValue(mockUser);
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText('Jane Doe');

    fetchCurrentUser.mockResolvedValue(null);
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('Sign in to manage leads.')).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });

  it('shows a loading state while auth is being checked', () => {
    fetchCurrentUser.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<App />);

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('shows an auth failure retry state', async () => {
    fetchCurrentUser.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<App />);

    expect(
      await screen.findByText('Unable to verify your session. Please try again.'),
    ).toBeInTheDocument();
  });

  it('disables the login button while login is pending', async () => {
    login.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText('Sign in to manage leads.');

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    });
  });

  it('sends credentials on API requests', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { user: mockUser } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    await apiRequest('/auth/me');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' }),
    );

    fetchSpy.mockRestore();
  });
});
