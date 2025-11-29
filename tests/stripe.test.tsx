// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../src/lib/stripe';
import React from 'react';

// Define mockStripe inside the mock factory or use a variable that is not accessed before initialization.
// However, since we want to assert on it, we should define it outside but ensure the mock factory can access it.
// The issue is that vi.mock is hoisted above imports and variable declarations.
// We can use vi.hoisted() to create the mock object.

const { mockStripe } = vi.hoisted(() => {
  return {
    mockStripe: {
      elements: vi.fn(() => ({
        create: vi.fn(),
      })),
      createToken: vi.fn(),
      createSource: vi.fn(),
      createPaymentMethod: vi.fn(),
      confirmCardPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      paymentRequest: vi.fn(),
      registerAppInfo: vi.fn(),
      _registerWrapper: vi.fn(),
    }
  };
});

// Mock loadStripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

const TestComponent = () => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div>
      <div data-testid="stripe-status">{stripe ? 'loaded' : 'loading'}</div>
      <div data-testid="elements-status">{elements ? 'loaded' : 'loading'}</div>
    </div>
  );
};

describe('Stripe Integration', () => {
  it('should initialize stripePromise', async () => {
    const stripe = await stripePromise;
    expect(stripe).toBeDefined();
    expect(stripe).toEqual(mockStripe);
  });

  it('should provide Stripe context via Elements provider', async () => {
    render(
      <Elements stripe={stripePromise}>
        <TestComponent />
      </Elements>
    );

    const stripeStatus = await screen.findByTestId('stripe-status');
    const elementsStatus = await screen.findByTestId('elements-status');

    expect(stripeStatus.textContent).toBe('loaded');
    expect(elementsStatus.textContent).toBe('loaded');
  });
});
