import { useEffect, useState } from 'react';
import {
  fetchSavedFacilityIds,
  getQueuedFamilySaveFacilityIds,
  saveFacilityForCurrentUser,
} from '../../../src/features/family/journey/client';
import { trackEvent } from '../../../src/utils/analytics';

type Props = {
  facilityId: string;
  facilityName: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function FamilyJourneyActions({ facilityId, facilityName }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!UUID_PATTERN.test((facilityId || '').trim())) return;

    const queuedIds = getQueuedFamilySaveFacilityIds();
    if (queuedIds.has(facilityId)) {
      setQueued(true);
      setSaved(true);
    }

    let cancelled = false;
    void (async () => {
      try {
        const savedIds = await fetchSavedFacilityIds();
        if (!cancelled && savedIds.has(facilityId)) {
          setSaved(true);
          setQueued(false);
        }
      } catch {
        // Ignore load failures; action button still works on click.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  const onSave = async () => {
    if (saving || saved) return;
    if (!UUID_PATTERN.test((facilityId || '').trim())) return;

    setSaving(true);
    setError(null);
    setSaved(true);
    trackEvent('family_save_clicked', {
      facility_id: facilityId,
      source_surface: 'facility_profile',
    });

    try {
      const result = await saveFacilityForCurrentUser(facilityId, {
        sourcePath: window.location.pathname,
      });
      if (result.status === 'queued') {
        trackEvent('family_save_queued_for_auth', {
          facility_id: facilityId,
          source_surface: 'facility_profile',
        });
        setQueued(true);
        const redirectTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
        window.location.assign(`/login?redirect_to=${redirectTo}`);
        return;
      }

      if (result.status === 'error') {
        setSaved(false);
        setError(result.message || 'Unable to save this facility.');
        trackEvent('family_save_failed', {
          facility_id: facilityId,
          source_surface: 'facility_profile',
        });
      } else {
        setQueued(false);
        trackEvent('family_save_success', {
          facility_id: facilityId,
          source_surface: 'facility_profile',
          result: result.status,
        });
      }
    } catch {
      setSaved(false);
      setError('Unable to save this facility. Please try again.');
      trackEvent('family_save_failed', {
        facility_id: facilityId,
        source_surface: 'facility_profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!UUID_PATTERN.test((facilityId || '').trim())) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="fp-btn fp-btn-ghost"
          style={{ opacity: saving ? 0.8 : 1 }}
        >
          {saving ? 'Saving...' : saved ? 'Saved to Dashboard' : 'Save to Dashboard'}
        </button>
        <a className="fp-btn fp-btn-ghost" href="/family/dashboard">
          Open Family Dashboard
        </a>
      </div>
      {queued && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
          Sign in to finalize saving {facilityName} in your dashboard.
        </p>
      )}
      {error && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  );
}
