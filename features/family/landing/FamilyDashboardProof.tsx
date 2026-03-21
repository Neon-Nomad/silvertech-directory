import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchFamilyDashboardCards,
  getFamilyDashboardFacilityPath,
} from '@/src/features/family/journey/client';
import {
  FAMILY_JOURNEY_STATUS_LABELS,
  FamilyDashboardCard,
} from '@/src/features/family/journey/types';
import { useAuth } from '@/src/context/AuthProvider';
import { trackEvent } from '@/src/utils/analytics';

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

const notePreview = (value?: string | null): string => {
  const text = (value || '').trim();
  if (!text) return 'No note yet.';
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}...`;
};

export const FamilyDashboardProof: React.FC = () => {
  const { user, isOperator } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<FamilyDashboardCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isOperator) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextCards = await fetchFamilyDashboardCards();
        if (cancelled) return;
        setCards(nextCards);
        trackEvent('homepage_dashboard_proof_loaded', {
          saved_count: nextCards.length,
          moved_in_count: nextCards.filter((card) => card.status === 'moved_in').length,
        });
      } catch (loadError: any) {
        if (!cancelled) {
          setError(String(loadError?.message || 'Unable to load dashboard snapshot.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isOperator]);

  const statusSummary = useMemo(() => {
    const movedIn = cards.filter((card) => card.status === 'moved_in').length;
    const touring = cards.filter((card) => card.status === 'touring').length;
    return { movedIn, touring };
  }, [cards]);

  if (!user || isOperator) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/55">Family Dashboard</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-charcoal">Track every decision in one place</h3>
        <p className="mt-3 text-sm text-charcoal/70">
          Save facilities, track status changes, log tours, and confirm moved-in outcomes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/login?redirect_to=%2Ffamily%2Fdashboard"
            className="rounded-md bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Sign In to View
          </Link>
          <Link
            to="/search"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-charcoal hover:border-slate-900"
          >
            Browse Facilities
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/55">Family Dashboard</p>
        <div className="mt-4 h-4 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-16 animate-pulse rounded bg-slate-100" />
          <div className="h-16 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">Family Dashboard</p>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <Link
          to="/family/dashboard"
          className="mt-4 inline-flex rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          Open Dashboard
        </Link>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/55">Family Dashboard</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-charcoal">Start your shortlist</h3>
        <p className="mt-3 text-sm text-charcoal/70">
          Save your first facility to begin tracking notes, tours, and outcomes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/search"
            className="rounded-md bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Save Facilities
          </Link>
          <Link
            to="/family/dashboard"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-charcoal hover:border-slate-900"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/55">Family Dashboard</p>
          <h3 className="mt-2 font-serif text-2xl font-semibold text-charcoal">Live decision snapshot</h3>
        </div>
        <Link
          to="/family/dashboard"
          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal hover:border-slate-900"
        >
          Open Dashboard
        </Link>
      </div>

      <p className="mt-3 text-sm text-charcoal/70">
        Saved: <strong>{cards.length}</strong> | Touring: <strong>{statusSummary.touring}</strong> | Moved In:{' '}
        <strong>{statusSummary.movedIn}</strong>
      </p>

      <div className="mt-5 space-y-3">
        {cards.slice(0, 2).map((card) => (
          <article key={card.facilityId} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link to={getFamilyDashboardFacilityPath(card)} className="text-sm font-semibold text-charcoal hover:text-gold">
                {card.facilityName}
              </Link>
              <span className="inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-charcoal">
                {FAMILY_JOURNEY_STATUS_LABELS[card.status || 'researching']}
              </span>
            </div>
            <p className="mt-2 text-xs text-charcoal/60">Next tour: {formatTourDate(card.nextTour)}</p>
            <p className="mt-1 text-xs text-charcoal/75">Note: {notePreview(card.latestNote)}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default FamilyDashboardProof;
