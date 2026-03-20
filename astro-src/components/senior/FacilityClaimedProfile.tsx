import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import FacilityBadgeStrip from './FacilityBadgeStrip';
import {
  buildFacilityBadgeCredentialSchema,
  deriveEarnedBadges,
} from '../../lib/badgeSystem';

type Photo = { url: string; caption: string | null };
type Amenity = { name: string; category: string; icon: string | null };

type EnrichedProfile = {
  is_claimed: boolean;
  description: string | null;
  min_price: number | null;
  max_price: number | null;
  virtual_tour_url: string | null;
  tour_scheduling_url: string | null;
  photos: Photo[];
  amenities: Amenity[];
};

interface Props {
  facilityId: string;
  facilityName: string;
  facilityUrl: string;
  facilitySchemaId: string;
  onlinePresenceUpdatedAt?: string | null;
  lastVerifiedDate?: string | null;
  hasVerifiedIdentifiers?: boolean;
}

const LOCKED_ROWS = [
  { label: 'Staff Profiles',  note: 'Claim this listing to add staff info' },
  { label: 'Amenities',       note: 'Claim this listing to add amenities' },
  { label: 'Photos',          note: 'Claim this listing to add photos' },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function groupByCategory(amenities: Amenity[]): Record<string, Amenity[]> {
  return amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});
}

export default function FacilityClaimedProfile({
  facilityId,
  facilityName,
  facilityUrl,
  facilitySchemaId,
  onlinePresenceUpdatedAt = null,
  lastVerifiedDate = null,
  hasVerifiedIdentifiers = false,
}: Props) {
  const [profile, setProfile] = useState<EnrichedProfile | null>(null);
  const [operatorAnswerCount, setOperatorAnswerCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    );

    const load = async () => {
      const [profileResult, qaResult] = await Promise.all([
        supabase.rpc('get_public_facility_enriched', { p_facility_id: facilityId }),
        supabase
          .from('approved_facility_qa')
          .select('answer_id', { head: true, count: 'exact' })
          .eq('facility_id', facilityId)
          .eq('is_operator', true),
      ]);

      if (profileResult.error || !profileResult.data) {
        setStatus('error');
        return;
      }

      if (!qaResult.error) {
        setOperatorAnswerCount(qaResult.count || 0);
      }

      setProfile(profileResult.data as EnrichedProfile);
      setStatus('done');
    };

    void load();
  }, [facilityId]);

  // While loading, render nothing — static Astro content shows
  if (status === 'loading') return null;

  // On error or empty response, fall back to locked placeholders
  if (status === 'error' || !profile) {
    return <LockedPlaceholders facilityName={facilityName} />;
  }

  const { is_claimed, description, min_price, max_price, virtual_tour_url, tour_scheduling_url, photos, amenities } = profile;

  // Unclaimed: show locked placeholders same as before
  if (!is_claimed) {
    return <LockedPlaceholders facilityName={facilityName} />;
  }

  const badgeInput = {
    isClaimed: is_claimed,
    hasPricing: typeof min_price === 'number' || typeof max_price === 'number',
    hasTourScheduling: Boolean(tour_scheduling_url),
    operatorAnswerCount,
    onlinePresenceUpdatedAt,
    lastVerifiedDate,
    hasVerifiedIdentifiers,
  };

  const earnedBadges = deriveEarnedBadges(badgeInput);
  const badgeCredentialSchema =
    earnedBadges.length > 0
      ? buildFacilityBadgeCredentialSchema({
          facilityName,
          facilityUrl,
          facilitySchemaId,
          earnedBadges,
        })
      : null;

  const hasEnrichedContent = description || min_price || photos.length > 0 || amenities.length > 0 || virtual_tour_url;

  return (
    <div className="fcp-root">
      {badgeCredentialSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(badgeCredentialSchema) }}
        />
      )}
      <FacilityBadgeStrip
        {...badgeInput}
      />
      {/* Operator description — replaces auto-generated copy when present */}
      {description && (
        <div className="fcp-description">
          <div className="fcp-claimed-badge">✓ Managed by operator</div>
          <p>{description}</p>
        </div>
      )}

      {/* Pricing range */}
      {(min_price || max_price) && (
        <div className="fcp-pricing">
          <p className="fcp-pricing-label">Monthly pricing range</p>
          <p className="fcp-pricing-value">
            {min_price && max_price
              ? `${formatCurrency(min_price)} – ${formatCurrency(max_price)}/mo`
              : min_price
                ? `From ${formatCurrency(min_price)}/mo`
                : `Up to ${formatCurrency(max_price!)}/mo`}
          </p>
          <p className="fcp-pricing-note">Base rate — contact for care level pricing</p>
        </div>
      )}

      {/* Virtual tour */}
      {virtual_tour_url && (
        <div className="fcp-virtual-tour">
          <p className="fcp-section-label">Virtual Tour</p>
          <a href={virtual_tour_url} target="_blank" rel="noopener noreferrer" className="fcp-tour-link">
            ▶ View virtual tour of {facilityName}
          </a>
        </div>
      )}

      {/* Tour scheduling link (in addition to TourScheduler component) */}
      {tour_scheduling_url && (
        <div className="fcp-tour-schedule">
          <a href={tour_scheduling_url} target="_blank" rel="noopener noreferrer" className="fcp-schedule-btn">
            📅 Schedule a tour directly
          </a>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="fcp-photos">
          <p className="fcp-section-label">Photos</p>
          <div className="fcp-photo-grid">
            {photos.slice(0, 6).map((photo, i) => (
              <div key={i} className="fcp-photo-item">
                <img
                  src={photo.url}
                  alt={photo.caption || `${facilityName} photo ${i + 1}`}
                  loading="lazy"
                  className="fcp-photo-img"
                />
                {photo.caption && <p className="fcp-photo-caption">{photo.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="fcp-amenities">
          <p className="fcp-section-label">Amenities &amp; Services</p>
          {Object.entries(groupByCategory(amenities)).map(([category, items]) => (
            <div key={category} className="fcp-amenity-group">
              <p className="fcp-amenity-category">{category}</p>
              <div className="fcp-amenity-pills">
                {items.map((a) => (
                  <span key={a.name} className="fcp-amenity-pill">{a.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* If claimed but nothing enriched yet */}
      {!hasEnrichedContent && (
        <div className="fcp-claimed-empty">
          <div className="fcp-claimed-badge">✓ Claimed listing</div>
          <p>This operator has claimed their listing. Enhanced profile content is being prepared.</p>
        </div>
      )}
    </div>
  );
}

function LockedPlaceholders({ facilityName }: { facilityName: string }) {
  return (
    <div className="fcp-locked-rows">
      {LOCKED_ROWS.map((row) => (
        <div key={row.label} className="fcp-locked-row">
          <span className="fcp-locked-label">{row.label}</span>
          <span className="fcp-locked-value">
            <span className="fp-locked">🔒 {row.note}</span>
          </span>
        </div>
      ))}
      <div className="fcp-claim-cta">
        <a href="/for-facilities/" className="fp-btn fp-btn-gold" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
          Claim {facilityName} →
        </a>
      </div>
    </div>
  );
}
