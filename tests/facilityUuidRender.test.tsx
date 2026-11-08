import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getFacilityUuid } from '../astro-src/lib/facilityUuidMap';
import FamilyJourneyActions from '../astro-src/components/senior/FamilyJourneyActions';
import FacilityQASection from '../astro-src/components/senior/FacilityQASection';

const HOPE = 'assisted-living/minnesota/minneapolis/hope-wellness-center-inc-1127636603';
const HOPE_UUID = 'f67a0c7c-7c29-4e06-8346-59e492080864';
const TIED = 'nursing-homes/alabama/altoona/altoona-health-rehab-41';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('build-time UUID lookup', () => {
  it('returns the reviewed UUID for a uniquely mapped identity', () => {
    expect(getFacilityUuid(HOPE)).toBe(HOPE_UUID);
  });

  it('returns null, never a guess, for an unresolved identity', () => {
    expect(getFacilityUuid(TIED)).toBeNull();
  });

  it('renders an identity with no mapping row as unavailable (null), so a new listing cannot break the build', () => {
    expect(getFacilityUuid('no/such/identity')).toBeNull();
  });
});

describe('family components render an explicit state for both cases', () => {
  it('resolved: save control is shown', () => {
    const html = renderToStaticMarkup(createElement(FamilyJourneyActions, { facilityId: 'x', facilityName: 'Hope', facilityUuid: HOPE_UUID }));
    expect(text(html)).toContain('Save to Dashboard');
    expect(text(html)).not.toContain('not available for this listing');
  });

  it('unresolved: no save control, and an explicit message instead of silence', () => {
    const html = renderToStaticMarkup(createElement(FamilyJourneyActions, { facilityId: 'x', facilityName: 'Altoona', facilityUuid: null }));
    expect(text(html)).not.toContain('Save to Dashboard');
    expect(text(html)).toContain('Saving Altoona to a dashboard is not available for this listing yet.');
    expect(html).toContain('href="/family/dashboard"');
  });

  it('unresolved Q&A: explicit message and the sign-up call to action remain', () => {
    const html = renderToStaticMarkup(createElement(FacilityQASection, { facilityId: 'x', facilityName: 'Altoona', facilityUuid: null }));
    expect(text(html)).toContain('Community questions for Altoona are not available yet.');
    expect(text(html)).toContain('Ask a Question');
  });
});
