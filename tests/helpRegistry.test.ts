import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHelpRegistryCache, getHelpRouteContent } from '@/src/config/helpRegistry';

describe('helpRegistry', () => {
  beforeEach(() => {
    clearHelpRegistryCache();
    vi.restoreAllMocks();
  });

  it('loads route content from help registry json', async () => {
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
              article_ids: ['help-a'],
              contextual_tip: 'tip',
            },
          },
          articles: {
            'help-a': {
              id: 'help-a',
              slug: 'help-a',
              title: 'Article A',
              content_md: 'Hello',
            },
          },
        }),
      })
    );

    const result = await getHelpRouteContent('dashboard_help');

    expect(result.route.title).toBe('Help Center');
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toBe('Article A');
  });

  it('loads non-help route content with route-specific article ids', async () => {
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
              article_ids: ['help-a'],
              contextual_tip: 'tip',
            },
            dashboard_leads: {
              title: 'Leads',
              article_ids: ['lead-a'],
              contextual_tip: 'lead tip',
            },
          },
          articles: {
            'help-a': {
              id: 'help-a',
              slug: 'help-a',
              title: 'Article A',
              content_md: 'Hello',
            },
            'lead-a': {
              id: 'lead-a',
              slug: 'lead-a',
              title: 'Lead Article',
              content_md: 'Lead body',
            },
          },
        }),
      })
    );

    const result = await getHelpRouteContent('dashboard_leads');
    expect(result.route.title).toBe('Leads');
    expect(result.route.contextual_tip).toBe('lead tip');
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toBe('Lead Article');
  });

  it('falls back to default help content when registry load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await getHelpRouteContent('dashboard_help');

    expect(result.route.title).toBe('Help Center');
    expect(result.articles.length).toBeGreaterThan(0);
  });
});
