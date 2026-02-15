// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelpCenter } from '@/features/operator/dashboard/HelpCenter';
import { clearHelpRegistryCache } from '@/src/config/helpRegistry';

describe('HelpCenter', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearHelpRegistryCache();
  });

  it('renders contextual tip and markdown article content', async () => {
    clearHelpRegistryCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          last_updated: '2026-02-15',
          routes: {
            dashboard_help: {
              title: 'Help Center',
              article_ids: ['article-1'],
              contextual_tip: 'Use search to find specific workflows.',
            },
          },
          articles: {
            'article-1': {
              id: 'article-1',
              slug: 'article-1',
              title: 'How to Use Help',
              content_md: '### Heading\nBody text',
            },
          },
        }),
      })
    );

    render(<HelpCenter routeKey="dashboard_help" />);

    await waitFor(() => {
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    expect(screen.getByText('Use search to find specific workflows.')).toBeInTheDocument();
    expect(screen.getAllByText('How to Use Help').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
  });

  it('generates and copies a support packet', async () => {
    clearHelpRegistryCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          last_updated: '2026-02-15',
          routes: {
            dashboard_help: {
              title: 'Help Center',
              article_ids: ['article-1'],
              contextual_tip: 'tip',
            },
          },
          articles: {
            'article-1': {
              id: 'article-1',
              slug: 'article-1',
              title: 'Article',
              content_md: 'Body',
            },
          },
        }),
      })
    );

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<HelpCenter routeKey="dashboard_help" />);

    await waitFor(() => {
      expect(screen.getAllByText('Support Packet Generator').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getAllByTestId('support-issue-summary')[0], { target: { value: 'Cannot assign slot' } });
    fireEvent.change(screen.getAllByTestId('support-error-code')[0], { target: { value: 'ERR_SLOT_LIMIT' } });
    fireEvent.change(screen.getAllByTestId('support-repro-steps')[0], { target: { value: '1) Open billing 2) Assign slot' } });

    fireEvent.click(screen.getAllByTestId('copy-support-packet')[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    expect(screen.getAllByTestId('support-packet-preview')[0]).toHaveTextContent('Cannot assign slot');
    expect(screen.getAllByTestId('support-packet-preview')[0]).toHaveTextContent('ERR_SLOT_LIMIT');
    const emailLink = screen.getAllByTestId('email-support-packet')[0] as HTMLAnchorElement;
    expect(emailLink.href).toContain('mailto:support@silvertechdirectory.com');
    expect(emailLink.href).toContain('subject=');
    expect(emailLink.href).toContain('body=');
  });

  it('downloads support packet as text file', async () => {
    clearHelpRegistryCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          last_updated: '2026-02-15',
          routes: {
            dashboard_help: {
              title: 'Help Center',
              article_ids: ['article-1'],
              contextual_tip: 'tip',
            },
          },
          articles: {
            'article-1': {
              id: 'article-1',
              slug: 'article-1',
              title: 'Article',
              content_md: 'Body',
            },
          },
        }),
      })
    );

    const createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    render(<HelpCenter routeKey="dashboard_help" />);

    await waitFor(() => {
      expect(screen.getAllByText('Support Packet Generator').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByTestId('download-support-packet')[0]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('highlights article targeted by URL hash', async () => {
    clearHelpRegistryCache();
    window.location.hash = '#roi-methodology';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          last_updated: '2026-02-15',
          routes: {
            dashboard_leads: {
              title: 'Lead Lifecycle',
              article_ids: ['roi-calculation-methodology'],
              contextual_tip: 'Track quality and impact.',
            },
          },
          articles: {
            'roi-calculation-methodology': {
              id: 'roi-calculation-methodology',
              slug: 'roi-methodology',
              title: 'ROI Methodology',
              content_md: 'How we calculate ROI.',
            },
          },
        }),
      })
    );

    render(<HelpCenter routeKey="dashboard_leads" />);

    await waitFor(() => {
      expect(screen.getByText('Lead Lifecycle')).toBeInTheDocument();
    });
    const article = screen.getByTestId('help-article-roi-methodology');
    expect(article.className).toContain('ring-2');
  });
});
