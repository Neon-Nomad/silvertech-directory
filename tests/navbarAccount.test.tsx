// @vitest-environment jsdom
import React from 'react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(jestDomMatchers);
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

const authState = {
  user: null as null | { id: string; email: string },
  isOperator: false,
  signOut: vi.fn(async () => {}),
  loading: false,
};

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => authState,
}));

const renderNav = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
    </MemoryRouter>,
  );

describe('Navbar account menu', () => {
  beforeEach(() => {
    authState.user = null;
    authState.isOperator = false;
    authState.signOut.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('offers sign-in when nobody is signed in', () => {
    renderNav();

    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    expect(screen.getAllByRole('link', { name: 'Family Sign In' })[0]).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('shows the account menu, not "Sign In", for a signed-in family account', () => {
    authState.user = { id: 'user-1', email: 'family@example.com' };
    renderNav();

    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'My account' })[0]);
    expect(screen.getAllByRole('link', { name: 'Family Dashboard' })[0]).toHaveAttribute('href', '/family/dashboard');
    expect(screen.getAllByRole('button', { name: 'Sign out' })[0]).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Family Sign In' })).not.toBeInTheDocument();
  });

  it('signs out when Sign out is chosen', async () => {
    authState.user = { id: 'user-1', email: 'family@example.com' };
    renderNav();

    fireEvent.click(screen.getAllByRole('button', { name: 'My account' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign out' })[0]);

    await waitFor(() => expect(authState.signOut).toHaveBeenCalledTimes(1));
  });

  it('offers the operator dashboard only to operator accounts', () => {
    authState.user = { id: 'op-1', email: 'operator@example.com' };
    authState.isOperator = true;
    renderNav();

    fireEvent.click(screen.getAllByRole('button', { name: 'My account' })[0]);
    expect(screen.getAllByRole('link', { name: 'Operator Dashboard' })[0]).toHaveAttribute('href', '/dashboard');
  });
});
