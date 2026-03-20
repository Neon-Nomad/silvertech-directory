import React from 'react';

type BadgeDefinition = {
  id: string;
  label: string;
  note: string;
  asset: string;
};

type Props = {
  isClaimed: boolean;
  hasPricing: boolean;
  hasTourScheduling: boolean;
  operatorAnswerCount: number;
  onlinePresenceUpdatedAt?: string | null;
  lastVerifiedDate?: string | null;
  hasVerifiedIdentifiers?: boolean;
};

const BADGES = {
  new_to_silvertech: {
    id: 'new_to_silvertech',
    label: 'New to SilverTech',
    note: 'New to this platform, not new to care.',
    asset: '/badge_system/badge_1_new_to_silvertech.svg',
  },
  verified_member: {
    id: 'verified_member',
    label: 'SilverTech Member',
    note: 'Claimed and operator-managed profile.',
    asset: '/badge_system/badge_2_verified_member.svg',
  },
  qa_contributor: {
    id: 'qa_contributor',
    label: 'Q&A Contributor',
    note: 'Actively answers family questions.',
    asset: '/badge_system/badge_3_qa_contributor.svg',
  },
  availability_pricing: {
    id: 'availability_pricing',
    label: 'Availability & Pricing',
    note: 'Pricing and booking path are live.',
    asset: '/badge_system/badge_4_availability_pricing.svg',
  },
  trusted_provider: {
    id: 'trusted_provider',
    label: 'Trusted Provider',
    note: 'Sustained profile quality and responsiveness.',
    asset: '/badge_system/badge_5_trusted_provider.svg',
  },
} as const satisfies Record<string, BadgeDefinition>;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinDays = (value: Date | null, days: number): boolean => {
  if (!value) return false;
  const diffMs = Date.now() - value.getTime();
  if (diffMs < 0) return true;
  return diffMs <= days * 24 * 60 * 60 * 1000;
};

const deriveEarnedBadges = ({
  isClaimed,
  hasPricing,
  hasTourScheduling,
  operatorAnswerCount,
  onlinePresenceUpdatedAt,
  lastVerifiedDate,
  hasVerifiedIdentifiers,
}: Props): BadgeDefinition[] => {
  if (!isClaimed) return [];

  const lastPresence = parseDate(onlinePresenceUpdatedAt);
  const lastVerified = parseDate(lastVerifiedDate);
  const qaContributor = operatorAnswerCount >= 3;
  const availabilityPricing = hasPricing && hasTourScheduling;
  const freshPresence = isWithinDays(lastPresence, 120);
  const freshVerification = isWithinDays(lastVerified, 365);

  // Fallback keeps the "new" anchor in place when timestamp history is sparse.
  const newToSilverTech = freshPresence || (!qaContributor && !availabilityPricing);

  const trustedProvider =
    qaContributor &&
    availabilityPricing &&
    Boolean(hasVerifiedIdentifiers) &&
    (freshPresence || freshVerification);

  const earned: BadgeDefinition[] = [];
  if (newToSilverTech) earned.push(BADGES.new_to_silvertech);
  earned.push(BADGES.verified_member);
  if (qaContributor) earned.push(BADGES.qa_contributor);
  if (availabilityPricing) earned.push(BADGES.availability_pricing);
  if (trustedProvider) earned.push(BADGES.trusted_provider);
  return earned;
};

export default function FacilityBadgeStrip(props: Props) {
  const earnedBadges = deriveEarnedBadges(props);
  if (earnedBadges.length === 0) return null;

  return (
    <section className="fp-badges" aria-label="SilverTech badges">
      <p className="fp-badges-title">SilverTech Badges</p>
      <div className="fp-badges-grid">
        {earnedBadges.map((badge) => (
          <article key={badge.id} className="fp-badge-card">
            <img
              src={badge.asset}
              alt=""
              aria-hidden="true"
              className="fp-badge-icon"
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="fp-badge-name">{badge.label}</p>
              <p className="fp-badge-note">{badge.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
