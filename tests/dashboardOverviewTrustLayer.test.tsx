// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DashboardOverview } from '@/features/operator/dashboard/DashboardOverview';
import * as activationSnapshotModule from '@/src/utils/activationSnapshot';

const baseSnapshot: ReturnType<typeof activationSnapshotModule.buildActivationSnapshot> = {
  asOf: '2026-02-16T00:00:00.000Z',
  checklist: {
    completionPct: 20,
    completedCount: 1,
    totalCount: 5,
    steps: [
      { id: 'photos', complete: false },
      { id: 'pricing', complete: false },
      { id: 'contact_info', complete: true },
      { id: 'amenities', complete: false },
      { id: 'answer_question', complete: false },
    ],
  },
  quickWins: {
    items: ['photos_missing', 'pricing_missing', 'qa_pending'],
  },
  benchmark: {
    ready: false,
    confidenceLabel: 'Low confidence',
    yourConversion: 0.125,
    marketMedianConversion: 0.19,
    gapPct: 0.065,
    remainingViews: 0,
    remainingInquiries: 1,
  },
  roi: {
    ready: false,
    confidenceLabel: 'Low confidence',
    low: 1,
    mid: 2,
    remainingInquiries: 1,
    assumptionsVersion: 'v1',
  },
  score: {
    value: 15,
    breakdown: {
      photos: 0,
      pricing: 0,
      contact: 15,
      amenities: 0,
      qna: 0,
    },
  },
  funnel: {
    stages: [],
    minimumFunnelSessions: 5,
    topDrop: null,
  },
  nextFix: {
    fixId: 'pricing',
    source: 'score_component',
    targetSection: 'guided-setup',
    line: 'Next best fix: Add pricing range (worth +20 score).',
    ctaLabel: 'Update pricing',
    action: 'open_pricing',
  },
  showPremiumCta: false,
};

describe('DashboardOverview trust-layer contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders trust metadata and placeholder states while gating CTA off when conditions fail', () => {
    vi.spyOn(activationSnapshotModule, 'buildActivationSnapshot').mockReturnValue(baseSnapshot);

    render(
      <DashboardOverview
        userProfile={{ plan: 'free' }}
        onGoToListings={vi.fn()}
        onGoToLeads={vi.fn()}
        onViewPublicProfile={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Insights'));
    expect(screen.getAllByText(/Data as of/i).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Low confidence').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Methodology').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Gathering Data').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gathering Insights')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start Premium Trial/i })).not.toBeInTheDocument();
  });
});
