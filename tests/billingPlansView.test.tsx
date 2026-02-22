// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BillingPlansView } from '@/features/operator/dashboard/BillingPlansView';

describe('BillingPlansView', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders entitlement error CTA and triggers mapped action callback', () => {
    const onBillingErrorCta = vi.fn();

    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'featured', status: 'active' }}
        facilities={[]}
        billingUiError={{
          code: 'ERR_SLOT_LIMIT',
          message: "You've reached your limit for the current plan.",
        }}
        onManageBilling={vi.fn()}
        onBillingErrorCta={onBillingErrorCta}
        onUpgrade={vi.fn()}
        onAssignFacility={vi.fn(async () => undefined)}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getByText(/Code: ERR_SLOT_LIMIT/i)).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Upgrade Plan/i });
    fireEvent.click(cta);
    expect(onBillingErrorCta).toHaveBeenCalledWith('ERR_SLOT_LIMIT');
  });

  it('renders View Plans CTA for ERR_PLAN_RESTRICTED', () => {
    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'free', status: 'active' }}
        facilities={[]}
        billingUiError={{
          code: 'ERR_PLAN_RESTRICTED',
          message: 'This feature requires a higher subscription plan.',
        }}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={vi.fn(async () => undefined)}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getByRole('button', { name: /View Plans/i })).toBeInTheDocument();
  });

  it('calls assign/unassign handlers from facility controls', () => {
    const onAssignFacility = vi.fn(async () => undefined);
    const onUnassignFacility = vi.fn(async () => undefined);

    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'priority', status: 'active' }}
        facilities={[
          { id: 'f-1', name: 'Sunrise Senior Living', assigned_plan_owner_id: null },
          { id: 'f-2', name: 'Golden Oaks', assigned_plan_owner_id: 'u-1' },
        ]}
        billingUiError={null}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={onAssignFacility}
        onUnassignFacility={onUnassignFacility}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Assign Plan/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Unassign/i })[0]);

    expect(onAssignFacility).toHaveBeenCalledWith('f-1');
    expect(onUnassignFacility).toHaveBeenCalledWith('f-2');
  });

  it('locks assignment and upgrade actions when payment is pending', () => {
    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'featured', status: 'active' }}
        facilities={[{ id: 'f-1', name: 'Sunrise Senior Living', assigned_plan_owner_id: null }]}
        billingUiError={{
          code: 'ERR_PENDING_PAYMENT',
          message: 'Action disabled due to an outstanding balance.',
        }}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={vi.fn(async () => undefined)}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getAllByRole('button', { name: /Assign Plan/i })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Upgrade/i })[0]).toBeDisabled();
  });

  it('disables lower tier plan actions when user is already on a higher plan', () => {
    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'lead_suite', billing_status: 'active' }}
        facilities={[]}
        billingUiError={null}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={vi.fn(async () => undefined)}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    const includedButtons = screen.getAllByRole('button', { name: /Included in your plan/i });
    expect(includedButtons.length).toBeGreaterThan(0);
    includedButtons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByRole('button', { name: /Current Plan/i })).toBeDisabled();
  });
});
