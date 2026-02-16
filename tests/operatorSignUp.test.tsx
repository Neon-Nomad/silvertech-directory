// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import OperatorSignUp from '@/features/auth/OperatorSignUp';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const navigateMock = vi.fn();

const { signUpMock } = vi.hoisted(() => ({
  signUpMock: vi.fn(),
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
  },
}));

describe('OperatorSignUp', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    signUpMock.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('submits signUp with operator role metadata', async () => {
    signUpMock.mockResolvedValue({ error: null });

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

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'admin@facility.com',
      password: 'password123',
      options: {
        data: {
          role: 'operator',
        },
      },
    });
  });

  it('redirects to operator login with preserved redirect target after success', async () => {
    signUpMock.mockResolvedValue({ error: null });

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
});
