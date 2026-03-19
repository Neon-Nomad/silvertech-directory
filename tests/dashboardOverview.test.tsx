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
        userProfile={{ plan: 'free' }}
        onGoToListings={onGoToListings}
        onCompleteProfileSetup={vi.fn()}
        onGoToLeads={onGoToLeads}
        onViewPublicProfile={onViewPublicProfile}
      />
    );

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('Recent Leads')).toBeInTheDocument();
    expect(screen.getByText('Next best fix: Add pricing range (worth +20 score).')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Insights'));
    fireEvent.click(screen.getByRole('button', { name: /View Public Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /Edit Listing/i }));
    fireEvent.click(screen.getByRole('button', { name: /View all/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Update pricing$/ }));

    expect(onViewPublicProfile).toHaveBeenCalledTimes(1);
    expect(onGoToListings).toHaveBeenCalledTimes(2);
    expect(onGoToLeads).toHaveBeenCalledTimes(1);
  }, 15000);

  it('shows paid-plan profile readiness warning and routes to listings', () => {
    const onGoToListings = vi.fn();
    const onCompleteProfileSetup = vi.fn();

    render(
      <DashboardOverview
        userProfile={{ plan: 'lead_suite', billing_status: 'active' }}
        onGoToListings={onGoToListings}
        onCompleteProfileSetup={onCompleteProfileSetup}
        onGoToLeads={vi.fn()}
        onViewPublicProfile={vi.fn()}
      />
    );

    expect(screen.getByText(/Complete your profile to power your dashboard/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Complete profile setup/i }));
    expect(onGoToListings).toHaveBeenCalledTimes(0);
    expect(onCompleteProfileSetup).toHaveBeenCalledTimes(1);
  });
});
