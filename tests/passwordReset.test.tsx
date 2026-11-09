// @vitest-environment jsdom
import React from 'react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(jestDomMatchers);
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = vi.hoisted(() => ({
  hash: '',
  session: null as null | { access_token: string },
  resetPasswordForEmail: vi.fn(async () => ({ error: null as null | { code?: string; message?: string } })),
  updateUser: vi.fn(async () => ({ error: null as null | { code?: string; message?: string } })),
  signOut: vi.fn(async () => ({ error: null })),
  listeners: [] as Array<(event: string) => void>,
}));

vi.mock('@/src/lib/supabase', () => ({
  get authRedirectHash() {
    return auth.hash;
  },
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: auth.session } }),
      onAuthStateChange: (callback: (event: string) => void) => {
        auth.listeners.push(callback);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      resetPasswordForEmail: auth.resetPasswordForEmail,
      updateUser: auth.updateUser,
      signOut: auth.signOut,
    },
  },
}));

import { ForgotPasswordPage, ResetPasswordPage, isRecoveryToken } from '@/features/auth/PasswordResetPages';

// A JWT-shaped token whose payload carries the recovery method, as Supabase issues for a reset link.
const recoveryToken = (method: string) => {
  const payload = Buffer.from(JSON.stringify({ amr: [{ method }] })).toString('base64');
  return `header.${payload}.signature`;
};

const renderAt = (entry: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<p>LOGIN PAGE</p>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('password reset', () => {
  beforeEach(() => {
    auth.hash = '';
    auth.session = null;
    auth.listeners.length = 0;
    auth.resetPasswordForEmail.mockClear();
    auth.resetPasswordForEmail.mockImplementation(async () => ({ error: null }));
    auth.updateUser.mockClear();
    auth.updateUser.mockImplementation(async () => ({ error: null }));
    auth.signOut.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('recognises a recovery token and rejects a normal sign-in token', () => {
    expect(isRecoveryToken(recoveryToken('recovery'))).toBe(true);
    expect(isRecoveryToken(recoveryToken('password'))).toBe(false);
    expect(isRecoveryToken('not-a-token')).toBe(false);
  });

  it('tells the visitor when the link has expired or was already used', async () => {
    auth.hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    renderAt('/reset-password');

    expect(await screen.findByText(/expired or has already been used/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('treats a missing or invalid link as invalid, not as expired', async () => {
    renderAt('/reset-password');

    expect(await screen.findByText(/not valid/i)).toBeInTheDocument();
    expect(screen.queryByText(/expired or has already been used/i)).not.toBeInTheDocument();
  });

  it('shows the new-password form for a recovery session', async () => {
    auth.hash = '#access_token=x&type=recovery';
    auth.session = { access_token: recoveryToken('recovery') };
    renderAt('/reset-password');

    expect(await screen.findByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('will not change the password of a signed-in account that did not come from a reset link', async () => {
    auth.session = { access_token: recoveryToken('password') };
    renderAt('/reset-password');

    expect(await screen.findByText(/not valid/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('checks the two passwords match before sending anything', async () => {
    auth.hash = '#access_token=x&type=recovery';
    auth.session = { access_token: recoveryToken('recovery') };
    renderAt('/reset-password');

    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-horse-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('rejects a password that is too short', async () => {
    auth.hash = '#access_token=x&type=recovery';
    auth.session = { access_token: recoveryToken('recovery') };
    renderAt('/reset-password');

    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('saves the new password, ends the recovery session, and sends the visitor to sign in', async () => {
    auth.hash = '#access_token=x&type=recovery';
    auth.session = { access_token: recoveryToken('recovery') };
    renderAt('/reset-password');

    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'correct-horse-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

    await waitFor(() => expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument());
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'correct-horse-1' });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('explains a password that was used before', async () => {
    auth.hash = '#access_token=x&type=recovery';
    auth.session = { access_token: recoveryToken('recovery') };
    auth.updateUser.mockImplementation(async () => ({ error: { code: 'same_password', message: 'same' } }));
    renderAt('/reset-password');

    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'correct-horse-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));

    expect(await screen.findByText('Choose a password you have not used before.')).toBeInTheDocument();
  });

  it('sends a reset link back to this site, with the same message whether or not the account exists', async () => {
    renderAt('/forgot-password');

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'family@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText(/If an account exists for that email/i)).toBeInTheDocument();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'family@example.com',
      expect.objectContaining({ redirectTo: expect.stringMatching(/\/reset-password$/) }),
    );
  });

  it('asks for a short wait when the send is rate limited', async () => {
    auth.resetPasswordForEmail.mockImplementation(async () => ({ error: { code: 'over_email_send_rate_limit', message: 'slow down' } }));
    renderAt('/forgot-password');

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'family@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Please wait a minute before requesting another link.')).toBeInTheDocument();
  });
});
