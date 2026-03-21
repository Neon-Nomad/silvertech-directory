import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  addTourLog,
  fetchFamilyDashboardCards,
  getFamilyDashboardFacilityPath,
  markFacilityMovedIn,
  updateFacilityStatus,
  upsertAttribution,
  upsertFacilityNote,
} from '@/src/features/family/journey/client';
import { AttributionType, FamilyDashboardCard, FamilyJourneyStatus, FAMILY_JOURNEY_STATUS_LABELS } from '@/src/features/family/journey/types';
import { trackEvent } from '@/src/utils/analytics';

type DraftMap = Record<string, string>;
type RetryType = 'note' | 'status' | 'tour' | 'moved_in' | 'attribution';
type RetryContext = {
  type: RetryType;
  status?: FamilyJourneyStatus;
  attribution?: AttributionType;
  message: string;
};

const monthInputDefault = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatTourDate = (value?: string | null): string => {
  if (!value) return 'No tour scheduled';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No tour scheduled';
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMonth = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

const getAllowedStatuses = (current: FamilyJourneyStatus | null): FamilyJourneyStatus[] => {
  if (current === 'moved_in') return [];
  if (current === 'selected') return ['moved_in', 'declined'];
  if (current === 'shortlist') return ['selected', 'declined'];
  if (current === 'touring') return ['shortlist', 'selected', 'declined'];
  if (current === 'researching') return ['touring', 'shortlist', 'selected', 'declined'];
  return ['researching', 'touring', 'shortlist', 'selected', 'declined'];
};

const attributionLabels: Record<AttributionType, string> = {
  major: 'Yes, major role',
  somewhat: 'Somewhat helpful',
  none: 'No, found elsewhere',
};

export const FamilyDashboard: React.FC = () => {
  const [cards, setCards] = useState<FamilyDashboardCard[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<DraftMap>({});
  const [tourDrafts, setTourDrafts] = useState<DraftMap>({});
  const [moveInMonthDrafts, setMoveInMonthDrafts] = useState<DraftMap>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attributionPromptFacilityId, setAttributionPromptFacilityId] = useState<string | null>(null);
  const [retryContextByFacility, setRetryContextByFacility] = useState<Record<string, RetryContext | undefined>>({});
  const hasTrackedViewRef = useRef(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextCards = await fetchFamilyDashboardCards();
      setCards(nextCards);

      const nextNotes: DraftMap = {};
      const nextTours: DraftMap = {};
      const nextMonths: DraftMap = {};
      for (const card of nextCards) {
        nextNotes[card.facilityId] = card.latestNote || '';
        nextTours[card.facilityId] = '';
        nextMonths[card.facilityId] = card.moveInMonth ? card.moveInMonth.slice(0, 7) : monthInputDefault();
      }
      setNoteDrafts(nextNotes);
      setTourDrafts(nextTours);
      setMoveInMonthDrafts(nextMonths);
    } catch (loadError: any) {
      setError(String(loadError?.message || 'Unable to load your dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (loading || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    trackEvent('family_dashboard_viewed', {
      saved_count: cards.length,
      moved_in_count: cards.filter((card) => card.status === 'moved_in').length,
    });
  }, [loading, cards]);

  const savedCount = cards.length;
  const movedInCount = useMemo(
    () => cards.filter((card) => card.status === 'moved_in').length,
    [cards],
  );

  const setWorking = (facilityId: string, busy: boolean) => {
    setSavingMap((prev) => ({ ...prev, [facilityId]: busy }));
  };

  const withOptimisticCard = async (
    facilityId: string,
    updater: (card: FamilyDashboardCard) => FamilyDashboardCard,
    task: () => Promise<void>,
  ) => {
    const previous = cards;
    setCards((curr) => curr.map((card) => (card.facilityId === facilityId ? updater(card) : card)));
    try {
      await task();
    } catch (taskError: any) {
      setCards(previous);
      setError(String(taskError?.message || 'Unable to save changes.'));
      throw taskError;
    } finally {
      await reload();
    }
  };

  const onSaveNote = async (facilityId: string) => {
    const draft = (noteDrafts[facilityId] || '').trim();
    if (!draft) return;
    setWorking(facilityId, true);
    try {
      await withOptimisticCard(
        facilityId,
        (card) => ({ ...card, latestNote: draft }),
        async () => {
          const result = await upsertFacilityNote(facilityId, draft);
          if (result.status === 'error') {
            throw new Error(result.message || 'Unable to save note.');
          }
        },
      );
      trackEvent('family_note_saved', { facility_id: facilityId, note_length: draft.length });
      setRetryContextByFacility((prev) => ({ ...prev, [facilityId]: undefined }));
    } catch {
      trackEvent('family_note_save_failed', { facility_id: facilityId });
      setRetryContextByFacility((prev) => ({
        ...prev,
        [facilityId]: {
          type: 'note',
          message: 'Note save failed. Retry to persist this note.',
        },
      }));
    } finally {
      setWorking(facilityId, false);
    }
  };

  const onStatusChange = async (facilityId: string, nextStatus: FamilyJourneyStatus) => {
    setWorking(facilityId, true);
    try {
      await withOptimisticCard(
        facilityId,
        (card) => ({ ...card, status: nextStatus }),
        async () => {
          const result = await updateFacilityStatus(facilityId, nextStatus);
          if (result.status === 'error') {
            throw new Error(result.message || 'Unable to update status.');
          }
        },
      );
      trackEvent('family_status_updated', { facility_id: facilityId, status: nextStatus });
      setRetryContextByFacility((prev) => ({ ...prev, [facilityId]: undefined }));
    } catch {
      trackEvent('family_status_update_failed', { facility_id: facilityId, status: nextStatus });
      setRetryContextByFacility((prev) => ({
        ...prev,
        [facilityId]: {
          type: 'status',
          status: nextStatus,
          message: 'Status update failed. Retry to sync with server state.',
        },
      }));
    } finally {
      setWorking(facilityId, false);
    }
  };

  const onAddTour = async (facilityId: string) => {
    const draft = tourDrafts[facilityId];
    if (!draft) return;
    setWorking(facilityId, true);
    try {
      await withOptimisticCard(
        facilityId,
        (card) => ({ ...card, nextTour: new Date(draft).toISOString() }),
        async () => {
          const result = await addTourLog(facilityId, draft);
          if (result.status === 'error') {
            throw new Error(result.message || 'Unable to save tour log.');
          }
        },
      );
      trackEvent('family_tour_added', { facility_id: facilityId, tour_at: draft });
      setTourDrafts((prev) => ({ ...prev, [facilityId]: '' }));
      setRetryContextByFacility((prev) => ({ ...prev, [facilityId]: undefined }));
    } catch {
      trackEvent('family_tour_add_failed', { facility_id: facilityId });
      setRetryContextByFacility((prev) => ({
        ...prev,
        [facilityId]: {
          type: 'tour',
          message: 'Tour log failed to save. Retry to keep your timeline accurate.',
        },
      }));
    } finally {
      setWorking(facilityId, false);
    }
  };

  const onMarkMovedIn = async (facilityId: string) => {
    setWorking(facilityId, true);
    const month = moveInMonthDrafts[facilityId] || monthInputDefault();
    try {
      await withOptimisticCard(
        facilityId,
        (card) => ({ ...card, status: 'moved_in', moveInMonth: `${month}-01` }),
        async () => {
          const result = await markFacilityMovedIn(facilityId, month);
          if (result.status === 'error') {
            throw new Error(result.message || 'Unable to confirm moved-in status.');
          }
        },
      );
      trackEvent('family_moved_in_confirmed', { facility_id: facilityId, move_in_month: month });
      setAttributionPromptFacilityId(facilityId);
      setRetryContextByFacility((prev) => ({ ...prev, [facilityId]: undefined }));
    } catch {
      trackEvent('family_moved_in_failed', { facility_id: facilityId });
      setRetryContextByFacility((prev) => ({
        ...prev,
        [facilityId]: {
          type: 'moved_in',
          message: 'Move-in confirmation failed. Retry to lock final outcome.',
        },
      }));
    } finally {
      setWorking(facilityId, false);
    }
  };

  const onSubmitAttribution = async (facilityId: string, attributionType: AttributionType) => {
    setWorking(facilityId, true);
    try {
      await withOptimisticCard(
        facilityId,
        (card) => ({ ...card, attributionType }),
        async () => {
          const result = await upsertAttribution(facilityId, attributionType);
          if (result.status === 'error') {
            throw new Error(result.message || 'Unable to save attribution.');
          }
        },
      );
      trackEvent('family_attribution_submitted', { facility_id: facilityId, attribution_type: attributionType });
      setAttributionPromptFacilityId(null);
      setRetryContextByFacility((prev) => ({ ...prev, [facilityId]: undefined }));
    } catch {
      trackEvent('family_attribution_submit_failed', { facility_id: facilityId, attribution_type: attributionType });
      setRetryContextByFacility((prev) => ({
        ...prev,
        [facilityId]: {
          type: 'attribution',
          attribution: attributionType,
          message: 'Attribution response failed to save. Retry when ready.',
        },
      }));
    } finally {
      setWorking(facilityId, false);
    }
  };

  const onRetry = async (facilityId: string) => {
    const retryContext = retryContextByFacility[facilityId];
    if (!retryContext) return;
    trackEvent('family_retry_clicked', { facility_id: facilityId, retry_type: retryContext.type });

    if (retryContext.type === 'note') {
      await onSaveNote(facilityId);
      return;
    }
    if (retryContext.type === 'status' && retryContext.status) {
      await onStatusChange(facilityId, retryContext.status);
      return;
    }
    if (retryContext.type === 'tour') {
      await onAddTour(facilityId);
      return;
    }
    if (retryContext.type === 'moved_in') {
      await onMarkMovedIn(facilityId);
      return;
    }
    if (retryContext.type === 'attribution' && retryContext.attribution) {
      await onSubmitAttribution(facilityId, retryContext.attribution);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f2]">
      <Helmet>
        <title>Family Dashboard | SilverTech Directory</title>
        <meta name="description" content="Track your saved facilities, notes, tours, and moved-in outcomes in one place." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="font-serif text-3xl font-semibold text-charcoal">Family Dashboard</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Saved facilities: <strong>{savedCount}</strong> | Moved in: <strong>{movedInCount}</strong>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                trackEvent('family_dashboard_print_clicked', { saved_count: savedCount });
                window.print();
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-charcoal hover:border-slate-900"
            >
              Print Tour Prep Sheet
            </button>
            <Link
              to="/search"
              className="rounded-md bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Save More Facilities
            </Link>
          </div>
        </header>

        {cards.length > 0 && (
          <section className="mb-6 hidden rounded-xl border border-slate-300 bg-white p-6 print:block">
            <h2 className="font-serif text-2xl font-semibold text-charcoal">Tour Prep Sheet</h2>
            <p className="mt-1 text-sm text-charcoal/70">
              Use this sheet during tours. Keep status, notes, and next steps in one place.
            </p>
            <div className="mt-5 space-y-4">
              {cards.map((card) => {
                const currentStatus = card.status || 'researching';
                return (
                  <article key={`print-${card.facilityId}`} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-base font-semibold text-charcoal">{card.facilityName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/60">
                      Status: {FAMILY_JOURNEY_STATUS_LABELS[currentStatus]}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/70">Next tour: {formatTourDate(card.nextTour)}</p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      Note: {(card.latestNote || 'No note recorded yet.').slice(0, 220)}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-charcoal/80">
                      <p>[ ] Confirm monthly base pricing and care add-ons</p>
                      <p>[ ] Verify staffing coverage for evenings and weekends</p>
                      <p>[ ] Ask for latest inspection and correction records</p>
                      <p>[ ] Review medication and escalation protocols</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-charcoal">No saved facilities yet</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Save facilities from search results or facility profiles to start your decision tracker.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-flex rounded-md bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Browse Facilities
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {cards.map((card) => {
              const busy = Boolean(savingMap[card.facilityId]);
              const currentStatus = card.status || 'researching';
              const allowedStatuses = getAllowedStatuses(card.status);
              const isTerminal = currentStatus === 'moved_in';
              const showAttributionPrompt = attributionPromptFacilityId === card.facilityId;
              const facilityPath = getFamilyDashboardFacilityPath(card);
              const retryContext = retryContextByFacility[card.facilityId];

              return (
                <article key={card.facilityId} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-2xl font-semibold text-charcoal">
                        <Link className="hover:text-gold" to={facilityPath}>
                          {card.facilityName}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-charcoal/65">
                        {[card.city, card.state].filter(Boolean).join(', ') || 'Location unavailable'}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-charcoal">
                      {FAMILY_JOURNEY_STATUS_LABELS[currentStatus]}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/60">Latest Note</p>
                      <textarea
                        className="mt-3 min-h-[90px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                        value={noteDrafts[card.facilityId] || ''}
                        onChange={(event) =>
                          setNoteDrafts((prev) => ({ ...prev, [card.facilityId]: event.target.value.slice(0, 5000) }))
                        }
                        placeholder="Add what matters most to your decision."
                        disabled={busy}
                      />
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onSaveNote(card.facilityId)}
                          disabled={busy || !(noteDrafts[card.facilityId] || '').trim()}
                          className="rounded-md bg-charcoal px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
                        >
                          Save Note
                        </button>
                        <span className="text-xs text-charcoal/55">{card.latestNote ? 'Saved' : 'No note saved yet'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/60">Next Tour</p>
                      <p className="mt-2 text-sm text-charcoal/75">{formatTourDate(card.nextTour)}</p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="datetime-local"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                          value={tourDrafts[card.facilityId] || ''}
                          onChange={(event) =>
                            setTourDrafts((prev) => ({ ...prev, [card.facilityId]: event.target.value }))
                          }
                          disabled={busy || isTerminal}
                        />
                        <button
                          type="button"
                          onClick={() => onAddTour(card.facilityId)}
                          disabled={busy || isTerminal || !tourDrafts[card.facilityId]}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal disabled:opacity-60"
                        >
                          Add Tour
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/60">Status Updates</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {allowedStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            status === 'moved_in'
                              ? onMarkMovedIn(card.facilityId)
                              : onStatusChange(card.facilityId, status)
                          }
                          disabled={busy}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal hover:border-charcoal disabled:opacity-60"
                        >
                          {status === 'moved_in' ? 'I Have Moved In' : `Set ${FAMILY_JOURNEY_STATUS_LABELS[status]}`}
                        </button>
                      ))}
                    </div>

                    {allowedStatuses.includes('moved_in') && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/60">
                          Move-In Month
                        </label>
                        <input
                          type="month"
                          value={moveInMonthDrafts[card.facilityId] || monthInputDefault()}
                          onChange={(event) =>
                            setMoveInMonthDrafts((prev) => ({ ...prev, [card.facilityId]: event.target.value }))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          disabled={busy}
                        />
                      </div>
                    )}

                    {card.moveInMonth && (
                      <p className="mt-3 text-sm text-emerald-700">
                        Outcome confirmed: moved in during {formatMonth(card.moveInMonth)}.
                      </p>
                    )}
                  </div>

                  {currentStatus === 'moved_in' && !showAttributionPrompt && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setAttributionPromptFacilityId(card.facilityId)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal hover:border-charcoal"
                      >
                        {card.attributionType ? `Attribution: ${attributionLabels[card.attributionType]}` : 'Did SilverTech Help?'}
                      </button>
                    </div>
                  )}

                  {showAttributionPrompt && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-charcoal">Did SilverTech help you find this place?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(['major', 'somewhat', 'none'] as AttributionType[]).map((attributionType) => (
                          <button
                            key={attributionType}
                            type="button"
                            onClick={() => onSubmitAttribution(card.facilityId, attributionType)}
                            disabled={busy}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal disabled:opacity-60"
                          >
                            {attributionLabels[attributionType]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAttributionPromptFacilityId(null)}
                          className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/70"
                        >
                          Skip for now
                        </button>
                      </div>
                    </div>
                  )}

                  {retryContext && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{retryContext.message}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onRetry(card.facilityId)}
                          disabled={busy}
                          className="rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 disabled:opacity-60"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRetryContextByFacility((prev) => ({ ...prev, [card.facilityId]: undefined }))
                          }
                          className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700/80"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-dashed border-slate-200 pt-4 print:block">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/60">Printable Tour Checklist</p>
                    <ul className="mt-3 space-y-2 text-sm text-charcoal/80">
                      <li>[ ] Confirm monthly base pricing and care-level add-ons</li>
                      <li>[ ] Verify staffing coverage for evenings and weekends</li>
                      <li>[ ] Ask to review recent inspection and corrective actions</li>
                      <li>[ ] Review medication management and escalation protocols</li>
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyDashboard;

