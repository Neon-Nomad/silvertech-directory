// @vitest-environment jsdom
import React from 'react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(jestDomMatchers);
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardOverview } from '@/features/operator/dashboard/DashboardOverview';

describe('DashboardOverview', () => {
  afterEach(() => {
    cleanup();
  });

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

  it('routes the free-plan upgrade CTA to billing and hides it for paid plans', () => {
    const onGoToBilling = vi.fn();

    const { unmount } = render(
      <DashboardOverview
        userProfile={{ plan: 'free' }}
        onGoToListings={vi.fn()}
        onCompleteProfileSetup={vi.fn()}
        onGoToLeads={vi.fn()}
        onGoToBilling={onGoToBilling}
        onViewPublicProfile={vi.fn()}
      />
    );

    expect(screen.getAllByText('Upgrade your listing').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^View plans$/ }));
    expect(onGoToBilling).toHaveBeenCalledTimes(1);
    unmount();

    render(
      <DashboardOverview
        userProfile={{ plan: 'featured' }}
        onGoToListings={vi.fn()}
        onCompleteProfileSetup={vi.fn()}
        onGoToLeads={vi.fn()}
        onGoToBilling={vi.fn()}
        onViewPublicProfile={vi.fn()}
      />
    );

    expect(screen.queryByText('Upgrade your listing')).not.toBeInTheDocument();
  });

  it('shows honest empty states instead of sample inquiries or attribution figures', () => {
    render(
      <DashboardOverview
        userProfile={{ plan: 'free' }}
        onGoToListings={vi.fn()}
        onCompleteProfileSetup={vi.fn()}
        onGoToLeads={vi.fn()}
        onGoToBilling={vi.fn()}
        onViewPublicProfile={vi.fn()}
      />
    );

    expect(screen.getAllByText(/No family inquiries yet/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Attribution tracking is not connected yet/i).length).toBeGreaterThan(0);
  });

  it("does not show sample performance figures", () => {
    render(
      <DashboardOverview
        userProfile={{ plan: "featured" }}
        onGoToListings={vi.fn()}
        onCompleteProfileSetup={vi.fn()}
        onGoToLeads={vi.fn()}
        onGoToBilling={vi.fn()}
        onViewPublicProfile={vi.fn()}
      />
    );

    expect(screen.queryByText("1,250")).not.toBeInTheDocument();
    expect(screen.queryByText("$18,000")).not.toBeInTheDocument();
    expect(screen.queryByText(/better than 68% of homes/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Not tracked yet").length).toBeGreaterThan(0);
  });
});
