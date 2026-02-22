// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import OperatorSignUp from '@/features/auth/OperatorSignUp';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const navigateMock = vi.fn();

const { signUpMock, invokeMock } = vi.hoisted(() => ({
  signUpMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
    },
    functions: {
      invoke: invokeMock,
    },
  },
}));

describe('OperatorSignUp', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    signUpMock.mockReset();
    invokeMock.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('submits signUp with operator role metadata', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { identities: [{}], email_confirmed_at: null }, session: null },
      error: null,
    });
    invokeMock.mockResolvedValue({ error: null });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/operator/signup?redirect_to=/claim-business']}>
          <OperatorSignUp />
        </MemoryRouter>
      </HelmetProvider>,
    );

    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'admin@facility.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create operator account/i }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalledTimes(1));

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@facility.com',
        password: 'password123',
        options: expect.objectContaining({
          data: {
            role: 'operator',
          },
          emailRedirectTo: expect.stringContaining('/operator/login?redirect_to=%2Fclaim-business'),
        }),
      }),
    );
  });

  it('redirects to operator login with preserved redirect target after success', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { identities: [{}], email_confirmed_at: null }, session: null },
      error: null,
    });
    invokeMock.mockResolvedValue({ error: null });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/operator/signup?redirect_to=/claim-business']}>
          <OperatorSignUp />
        </MemoryRouter>
      </HelmetProvider>,
    );

    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'admin@facility.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create operator account/i }));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/operator/login?redirect_to=%2Fclaim-business',
        { replace: true },
      ),
    );
  });

  it('shows an explicit error for existing-email collisions and does not navigate', async () => {
    signUpMock.mockResolvedValue({
      data: { user: { identities: [], email_confirmed_at: null }, session: null },
      error: null,
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/operator/signup?redirect_to=/claim-business']}>
          <OperatorSignUp />
        </MemoryRouter>
      </HelmetProvider>,
    );

    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'existing@facility.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create operator account/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/This email already has an account\. Use a different email for operator access/i),
      ).toBeTruthy(),
    );

    expect(invokeMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
