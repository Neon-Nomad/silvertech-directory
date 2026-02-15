// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DashboardOverview } from '@/features/operator/dashboard/DashboardOverview';

describe('DashboardOverview', () => {
  it('renders core sections and triggers quick action callbacks', () => {
    const onGoToListings = vi.fn();
    const onGoToLeads = vi.fn();
    const onViewPublicProfile = vi.fn();

    render(
      <DashboardOverview
        onGoToListings={onGoToListings}
        onGoToLeads={onGoToLeads}
        onViewPublicProfile={onViewPublicProfile}
      />
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('Recent Leads')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /View Public Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /Edit Listing/i }));
    fireEvent.click(screen.getByRole('button', { name: /View all/i }));

    expect(onViewPublicProfile).toHaveBeenCalledTimes(1);
    expect(onGoToListings).toHaveBeenCalledTimes(1);
    expect(onGoToLeads).toHaveBeenCalledTimes(1);
  });
});

