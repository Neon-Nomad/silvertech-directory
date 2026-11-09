import { useEffect, useState } from 'react';
import {
  fetchSavedFacilityIds,
  getQueuedFamilySaveFacilityIds,
  saveFacilityForCurrentUser,
  unsaveFacilityForCurrentUser,
} from '../../../src/features/family/journey/client';
import { trackEvent } from '../../../src/utils/analytics';

type Props = {
  facilityId: string;
  facilityName: string;
  // Database UUID from the reviewed build-time map. Null when this listing is unresolved.
  facilityUuid: string | null;
};

export default function FamilyJourneyActions({ facilityId, facilityName, facilityUuid }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityUuid) return;
    let cancelled = false;
    void (async () => {
      try {
        if (getQueuedFamilySaveFacilityIds().has(facilityUuid)) {
          setQueued(true);
          setSaved(true);
        }
        const savedIds = await fetchSavedFacilityIds();
        if (!cancelled && savedIds.has(facilityUuid)) {
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
  }, [facilityUuid]);

  const onRemove = async () => {
    if (saving || !saved || !facilityUuid) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    trackEvent('family_unsave_clicked', {
      facility_id: facilityId,
      source_surface: 'facility_profile',
    });

    try {
      const result = await unsaveFacilityForCurrentUser(facilityUuid);
      if (result.status === 'error') {
        setSaved(true);
        setError(result.message || 'Unable to remove this facility.');
      }
    } catch {
      setSaved(true);
      setError('Unable to remove this facility. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (saving || saved || !facilityUuid) return;

    setSaving(true);
    setError(null);
    setSaved(true);
    trackEvent('family_save_clicked', {
      facility_id: facilityId,
      source_surface: 'facility_profile',
    });

    try {
      const result = await saveFacilityForCurrentUser(facilityUuid, {
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

  if (!facilityId) return null;

  if (!facilityUuid) {
    // Explicit state, not a silent hide: families see why saving is unavailable here.
    return (
      <div style={{ marginTop: '0.75rem' }}>
        <p style={{ fontSize: '0.82rem', color: '#475569' }}>
          Saving {facilityName} to a dashboard is not available for this listing yet.
        </p>
        <a className="fp-btn fp-btn-ghost" href="/family/dashboard">
          Open Family Dashboard
        </a>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={saved ? onRemove : onSave}
          aria-pressed={saved}
          disabled={saving}
          className="fp-btn fp-btn-ghost"
          style={{ opacity: saving ? 0.8 : 1 }}
        >
          {saving
            ? saved
              ? 'Removing...'
              : 'Saving...'
            : saved
              ? 'Remove from Dashboard'
              : 'Save to Dashboard'}
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
