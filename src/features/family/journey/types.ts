export const FAMILY_JOURNEY_STATUS_ORDER = [
  'researching',
  'touring',
  'shortlist',
  'selected',
  'moved_in',
  'declined',
] as const;

export type FamilyJourneyStatus = (typeof FAMILY_JOURNEY_STATUS_ORDER)[number];

export type AttributionType = 'major' | 'somewhat' | 'none';

export const FAMILY_JOURNEY_STATUS_LABELS: Record<FamilyJourneyStatus, string> = {
  researching: 'Researching',
  touring: 'Touring',
  shortlist: 'Shortlist',
  selected: 'Selected',
  moved_in: 'Moved In',
  declined: 'Declined',
};

export type FamilyDashboardSnapshotRow = {
  facility_id: string;
  status: FamilyJourneyStatus | null;
  latest_note: string | null;
  next_tour: string | null;
};

export type FamilyDashboardFacilityRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  public_slug: string | null;
  public_route_id: number | null;
  primary_care_type_slug: string | null;
};

export type FamilyDashboardCard = {
  facilityId: string;
  facilityName: string;
  city: string | null;
  state: string | null;
  publicSlug: string | null;
  publicRouteId: number | null;
  primaryCareTypeSlug: string | null;
  status: FamilyJourneyStatus | null;
  latestNote: string | null;
  nextTour: string | null;
  moveInMonth: string | null;
  attributionType: AttributionType | null;
};

export type PendingFamilyActionType = 'save';

export type PendingFamilyAction = {
  id: string;
  actionType: PendingFamilyActionType;
  facilityId: string;
  createdAt: string;
  localSequence: number;
  sourcePath: string;
};

export type ActionResultStatus = 'success' | 'already_exists' | 'queued' | 'error';

export type ActionResult = {
  status: ActionResultStatus;
  message?: string;
};
