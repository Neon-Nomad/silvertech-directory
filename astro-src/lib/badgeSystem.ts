export type BadgeId =
  | 'new_to_silvertech'
  | 'verified_member'
  | 'qa_contributor'
  | 'availability_pricing'
  | 'trusted_provider';

export type BadgeDefinition = {
  id: BadgeId;
  label: string;
  note: string;
  asset: string;
  slug: string;
  schemaName: string;
  schemaDescription: string;
};

export type BadgeDerivationInput = {
  isClaimed: boolean;
  hasPricing: boolean;
  hasTourScheduling: boolean;
  operatorAnswerCount: number;
  onlinePresenceUpdatedAt?: string | null;
  lastVerifiedDate?: string | null;
  hasVerifiedIdentifiers?: boolean;
};

export const BADGE_SET_URL = 'https://silvertechdirectory.com/badges/';
export const SILVERTECH_ORG_URL = 'https://silvertechdirectory.com';
export const SILVERTECH_ORG_NAME = 'SilverTech Directory';

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: 'new_to_silvertech',
    label: 'New to SilverTech',
    note: 'New to this platform, not new to care.',
    asset: '/badge_system/badge_1_new_to_silvertech.svg',
    slug: 'new-to-silvertech',
    schemaName: 'New to SilverTech',
    schemaDescription:
      'Awarded to senior care facilities within their first 60 days on SilverTech Directory. Signals a new but actively onboarding member.',
  },
  {
    id: 'verified_member',
    label: 'SilverTech Member',
    note: 'Claimed and operator-managed profile.',
    asset: '/badge_system/badge_2_verified_member.svg',
    slug: 'verified-member',
    schemaName: 'SilverTech Verified Member',
    schemaDescription:
      'Awarded to senior care facilities with an active SilverTech Directory subscription and verified profile information.',
  },
  {
    id: 'qa_contributor',
    label: 'Q&A Contributor',
    note: 'Actively answers family questions.',
    asset: '/badge_system/badge_3_qa_contributor.svg',
    slug: 'verified-qa-contributor',
    schemaName: 'Verified Q&A Contributor',
    schemaDescription:
      'Awarded to senior care facilities that have answered family questions on SilverTech Directory, demonstrating active community engagement.',
  },
  {
    id: 'availability_pricing',
    label: 'Availability & Pricing',
    note: 'Pricing and booking path are live.',
    asset: '/badge_system/badge_4_availability_pricing.svg',
    slug: 'availability-pricing-verified',
    schemaName: 'Availability & Pricing Verified',
    schemaDescription:
      'Awarded to senior care facilities that publish live bed availability and current pricing on SilverTech Directory, giving families actionable information.',
  },
  {
    id: 'trusted_provider',
    label: 'Trusted Provider',
    note: 'Sustained profile quality and responsiveness.',
    asset: '/badge_system/badge_5_trusted_provider.svg',
    slug: 'trusted-provider',
    schemaName: 'SilverTech Trusted Provider',
    schemaDescription:
      'Awarded to senior care facilities maintaining active membership, strong family trust signals, and consistent profile upkeep on SilverTech Directory.',
  },
] as const;

const BADGE_BY_ID = new Map<BadgeId, BadgeDefinition>(
  BADGE_DEFINITIONS.map((badge) => [badge.id, badge]),
);

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

export const deriveEarnedBadges = ({
  isClaimed,
  hasPricing,
  hasTourScheduling,
  operatorAnswerCount,
  onlinePresenceUpdatedAt,
  lastVerifiedDate,
  hasVerifiedIdentifiers,
}: BadgeDerivationInput): BadgeDefinition[] => {
  if (!isClaimed) return [];

  const lastPresence = parseDate(onlinePresenceUpdatedAt);
  const lastVerified = parseDate(lastVerifiedDate);
  const qaContributor = operatorAnswerCount >= 3;
  const availabilityPricing = hasPricing && hasTourScheduling;
  const freshPresence = isWithinDays(lastPresence, 120);
  const freshVerification = isWithinDays(lastVerified, 365);

  // Keeps the "new member" anchor visible when history is sparse.
  const newToSilverTech = freshPresence || (!qaContributor && !availabilityPricing);

  const trustedProvider =
    qaContributor &&
    availabilityPricing &&
    Boolean(hasVerifiedIdentifiers) &&
    (freshPresence || freshVerification);

  const earnedIds: BadgeId[] = [];
  if (newToSilverTech) earnedIds.push('new_to_silvertech');
  earnedIds.push('verified_member');
  if (qaContributor) earnedIds.push('qa_contributor');
  if (availabilityPricing) earnedIds.push('availability_pricing');
  if (trustedProvider) earnedIds.push('trusted_provider');

  return earnedIds
    .map((id) => BADGE_BY_ID.get(id))
    .filter((badge): badge is BadgeDefinition => Boolean(badge));
};

export const buildBadgeDefinitionSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'SilverTech Directory Badge System',
  description:
    'A five-tier credentialing system for senior care facilities listed on SilverTech Directory, recognizing verified membership, engagement, transparency, and sustained excellence.',
  url: BADGE_SET_URL,
  hasDefinedTerm: BADGE_DEFINITIONS.map((badge) => ({
    '@type': 'DefinedTerm',
    name: badge.schemaName,
    description: badge.schemaDescription,
    url: `${BADGE_SET_URL}#${badge.slug}`,
    inDefinedTermSet: BADGE_SET_URL,
  })),
});

export const buildFacilityBadgeCredentialSchema = ({
  facilityName,
  facilityUrl,
  facilitySchemaId,
  earnedBadges,
}: {
  facilityName: string;
  facilityUrl: string;
  facilitySchemaId: string;
  earnedBadges: BadgeDefinition[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': facilitySchemaId,
  name: facilityName,
  url: facilityUrl,
  hasCredential: earnedBadges.map((badge) => ({
    '@type': 'Certification',
    name: badge.schemaName,
    url: `${BADGE_SET_URL}#${badge.slug}`,
    issuedBy: {
      '@type': 'Organization',
      name: SILVERTECH_ORG_NAME,
      url: SILVERTECH_ORG_URL,
    },
    about: {
      '@type': 'MedicalBusiness',
      name: facilityName,
      url: facilityUrl,
    },
  })),
});
