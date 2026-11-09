// @vitest-environment jsdom
import React from 'react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(jestDomMatchers);
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

  it('explains the free-plan limit and points assignment rows to View plans', () => {
    const onAssignFacility = vi.fn(async () => undefined);
    const scrollSpy = vi.fn();
    const plans = document.createElement('div');
    plans.id = 'upgrade-plans';
    plans.scrollIntoView = scrollSpy;
    document.body.appendChild(plans);

    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'free', billing_status: 'none' }}
        facilities={[{ id: 'f-1', name: 'Sunrise Senior Living', assigned_plan_owner_id: null }]}
        billingUiError={null}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={onAssignFacility}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getAllByText(/Free listings include no plan slots/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^Assign Plan$/ })).not.toBeInTheDocument();
    const viewPlans = screen.getAllByRole('button', { name: /^View plans$/ });
    expect(viewPlans.length).toBeGreaterThan(0);
    viewPlans.forEach((button) => expect(button).toBeEnabled());

    fireEvent.click(viewPlans[0]);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(onAssignFacility).not.toHaveBeenCalled();
    plans.remove();
  });

  it('pauses new assignments on a paid plan whose billing is not active', () => {
    render(
      <BillingPlansView
        userId="u-1"
        userProfile={{ plan: 'featured', billing_status: 'past_due' }}
        facilities={[{ id: 'f-1', name: 'Sunrise Senior Living', assigned_plan_owner_id: null }]}
        billingUiError={null}
        onManageBilling={vi.fn()}
        onBillingErrorCta={vi.fn()}
        onUpgrade={vi.fn()}
        onAssignFacility={vi.fn(async () => undefined)}
        onUnassignFacility={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getAllByText(/New assignments are paused while billing needs attention/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paused until billing is active').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^Assign Plan$/ })).not.toBeInTheDocument();
  });
});
