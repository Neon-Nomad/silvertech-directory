import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { buildFacilityDetailPath } from '@/src/utils/facilityPath';
import {
  ActionResult,
  AttributionType,
  FamilyDashboardCard,
  FamilyDashboardFacilityRow,
  FamilyDashboardSnapshotRow,
  FamilyJourneyStatus,
  PendingFamilyAction,
} from './types';

const PENDING_FAMILY_ACTIONS_STORAGE_KEY = 'std_family_pending_actions_v1';
const FAMILY_ACTION_SESSION_ID_STORAGE_KEY = 'std_family_action_session_id_v1';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NO_ROW_ERROR_CODE = 'PGRST116';
const UNIQUE_VIOLATION_CODE = '23505';

type IdempotentActionType = 'save' | 'status' | 'move_in' | 'attribution';

type SaveFacilityOptions = {
  sourcePath?: string;
  idempotencyKey?: string;
  queueIfUnauthed?: boolean;
};

type ReplayResult = {
  replayed: number;
  failed: number;
  remaining: number;
};

const isPostgrestError = (value: unknown): value is PostgrestError =>
  Boolean(value && typeof value === 'object' && 'code' in (value as Record<string, unknown>));

const isUniqueViolation = (error: unknown): boolean =>
  isPostgrestError(error) && error.code === UNIQUE_VIOLATION_CODE;

const normalizeUuid = (value: string): string => value.trim().toLowerCase();

const ensureUuid = (value: string): string | null => {
  const normalized = normalizeUuid(value);
  return UUID_PATTERN.test(normalized) ? normalized : null;
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const randomNibble = Math.floor(Math.random() * 16);
    const value = char === 'x' ? randomNibble : ((randomNibble & 0x3) | 0x8);
    return value.toString(16);
  });
};

const getLocalSequence = (): number => {
  const raw = Date.now() % 1_000_000_000;
  return Number.isFinite(raw) ? raw : 0;
};

const getFamilyActionSessionId = (): string => {
  if (typeof window === 'undefined') return generateUuid();
  const existing = window.localStorage.getItem(FAMILY_ACTION_SESSION_ID_STORAGE_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const created = generateUuid();
  window.localStorage.setItem(FAMILY_ACTION_SESSION_ID_STORAGE_KEY, created);
  return created;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
};

const registerIdempotencyKey = async (
  userId: string,
  actionType: IdempotentActionType,
  idempotencyKey: string,
) => {
  const normalizedKey = ensureUuid(idempotencyKey) || generateUuid();
  const { error } = await supabase
    .from('idempotency_keys')
    .upsert(
      {
        user_id: userId,
        action_type: actionType,
        idempotency_key: normalizedKey,
        response: {},
      },
      {
        onConflict: 'user_id,action_type,idempotency_key',
        ignoreDuplicates: true,
      },
    );

  if (error && !isUniqueViolation(error)) throw error;
  return normalizedKey;
};

const getPendingFamilyActions = (): PendingFamilyAction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PENDING_FAMILY_ACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingFamilyAction[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        item.actionType === 'save' &&
        typeof item.facilityId === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.localSequence === 'number',
    );
  } catch {
    return [];
  }
};

const setPendingFamilyActions = (actions: PendingFamilyAction[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_FAMILY_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
};

export const getQueuedFamilySaveFacilityIds = (): Set<string> =>
  new Set(getPendingFamilyActions().map((action) => action.facilityId));

export const queuePendingSave = (facilityId: string, sourcePath: string): PendingFamilyAction => {
  const pending = getPendingFamilyActions();
  const existing = pending.find((action) => action.actionType === 'save' && action.facilityId === facilityId);
  if (existing) return existing;

  const action: PendingFamilyAction = {
    id: generateUuid(),
    actionType: 'save',
    facilityId,
    createdAt: new Date().toISOString(),
    localSequence: getLocalSequence(),
    sourcePath,
  };
  pending.push(action);
  setPendingFamilyActions(pending);
  return action;
};

export const clearPendingSaveForFacility = (facilityId: string) => {
  const pending = getPendingFamilyActions();
  const next = pending.filter((action) => !(action.actionType === 'save' && action.facilityId === facilityId));
  if (next.length === pending.length) return;
  setPendingFamilyActions(next);
};

export const replayPendingFamilyActions = async (): Promise<ReplayResult> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const remaining = getPendingFamilyActions().length;
    return { replayed: 0, failed: remaining, remaining };
  }

  const pending = getPendingFamilyActions()
    .slice()
    .sort((a, b) => {
      const timeDelta = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (timeDelta !== 0) return timeDelta;
      return a.localSequence - b.localSequence;
    });

  let replayed = 0;
  let failed = 0;
  const remaining: PendingFamilyAction[] = [];

  for (const action of pending) {
    try {
      const result = await saveFacilityForCurrentUser(action.facilityId, {
        sourcePath: action.sourcePath,
        idempotencyKey: ensureUuid(action.id) || generateUuid(),
        queueIfUnauthed: false,
      });
      if (result.status === 'success' || result.status === 'already_exists') {
        replayed += 1;
      } else {
        failed += 1;
        remaining.push(action);
      }
    } catch {
      failed += 1;
      remaining.push(action);
    }
  }

  setPendingFamilyActions(remaining);
  return { replayed, failed, remaining: remaining.length };
};

const fetchCurrentStatus = async (
  userId: string,
  facilityId: string,
): Promise<FamilyJourneyStatus | null> => {
  const { data, error } = await supabase
    .from('current_facility_status')
    .select('status')
    .eq('user_id', userId)
    .eq('facility_id', facilityId)
    .maybeSingle();

  if (error && error.code !== NO_ROW_ERROR_CODE) throw error;
  return (data?.status as FamilyJourneyStatus | null) || null;
};

export const saveFacilityForCurrentUser = async (
  facilityId: string,
  options?: SaveFacilityOptions,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) {
    return { status: 'error', message: 'Facility ID is not a UUID.' };
  }

  const sourcePath = options?.sourcePath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const userId = await getCurrentUserId();
  if (!userId) {
    if (options?.queueIfUnauthed === false) {
      return { status: 'error', message: 'User is not authenticated.' };
    }
    queuePendingSave(normalizedFacilityId, sourcePath);
    return { status: 'queued' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('saved_facilities')
    .select('facility_id')
    .eq('user_id', userId)
    .eq('facility_id', normalizedFacilityId)
    .maybeSingle();
  if (existingError && existingError.code !== NO_ROW_ERROR_CODE) throw existingError;
  if (existing?.facility_id) return { status: 'already_exists' };

  const idempotencyKey = await registerIdempotencyKey(
    userId,
    'save',
    options?.idempotencyKey || generateUuid(),
  );

  const { error } = await supabase.from('saved_facilities').insert({
    user_id: userId,
    facility_id: normalizedFacilityId,
    action_type: 'save',
    idempotency_key: idempotencyKey,
    source: 'web',
    session_id: getFamilyActionSessionId(),
    local_sequence: getLocalSequence(),
  });

  if (error) {
    if (isUniqueViolation(error)) return { status: 'already_exists' };
    throw error;
  }

  clearPendingSaveForFacility(normalizedFacilityId);
  return { status: 'success' };
};

export const fetchSavedFacilityIds = async (): Promise<Set<string>> => {
  const userId = await getCurrentUserId();
  if (!userId) return new Set<string>();
  const { data, error } = await supabase
    .from('saved_facilities')
    .select('facility_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data || []).map((row) => row.facility_id).filter(Boolean));
};

export const upsertFacilityNote = async (
  facilityId: string,
  content: string,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return { status: 'error', message: 'Facility ID is not a UUID.' };

  const trimmed = content.trim();
  if (!trimmed) return { status: 'error', message: 'Note cannot be empty.' };

  const userId = await getCurrentUserId();
  if (!userId) return { status: 'error', message: 'User is not authenticated.' };

  const { error } = await supabase.from('facility_notes').upsert(
    {
      user_id: userId,
      facility_id: normalizedFacilityId,
      content: trimmed,
      source: 'web',
      session_id: getFamilyActionSessionId(),
      local_sequence: getLocalSequence(),
    },
    {
      onConflict: 'user_id,facility_id',
    },
  );

  if (error) throw error;
  return { status: 'success' };
};

export const addTourLog = async (
  facilityId: string,
  tourAtIso: string,
  note?: string,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return { status: 'error', message: 'Facility ID is not a UUID.' };

  const parsedDate = new Date(tourAtIso);
  if (Number.isNaN(parsedDate.getTime())) {
    return { status: 'error', message: 'Tour date is invalid.' };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { status: 'error', message: 'User is not authenticated.' };

  const { error } = await supabase.from('tour_logs').insert({
    user_id: userId,
    facility_id: normalizedFacilityId,
    tour_at: parsedDate.toISOString(),
    note: (note || '').trim() || null,
    source: 'web',
    session_id: getFamilyActionSessionId(),
    local_sequence: getLocalSequence(),
  });

  if (error) throw error;
  return { status: 'success' };
};

const resolveNextStatusOptions = (
  currentStatus: FamilyJourneyStatus | null,
): FamilyJourneyStatus[] => {
  if (currentStatus === 'moved_in') return [];
  if (currentStatus === 'selected') return ['moved_in', 'declined'];
  if (currentStatus === 'shortlist') return ['selected', 'declined'];
  if (currentStatus === 'touring') return ['shortlist', 'selected', 'declined'];
  if (currentStatus === 'researching') return ['touring', 'shortlist', 'selected', 'declined'];
  return ['researching', 'touring', 'shortlist', 'selected', 'declined'];
};

export const getAllowedNextStatuses = async (facilityId: string): Promise<FamilyJourneyStatus[]> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const currentStatus = await fetchCurrentStatus(userId, normalizedFacilityId);
  return resolveNextStatusOptions(currentStatus);
};

export const updateFacilityStatus = async (
  facilityId: string,
  nextStatus: FamilyJourneyStatus,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return { status: 'error', message: 'Facility ID is not a UUID.' };

  const userId = await getCurrentUserId();
  if (!userId) return { status: 'error', message: 'User is not authenticated.' };

  const currentStatus = await fetchCurrentStatus(userId, normalizedFacilityId);
  if (currentStatus === nextStatus) return { status: 'already_exists' };

  const allowed = resolveNextStatusOptions(currentStatus);
  if (!allowed.includes(nextStatus)) {
    return { status: 'error', message: `Invalid status transition from ${currentStatus || 'none'} to ${nextStatus}.` };
  }

  const idempotencyKey = await registerIdempotencyKey(userId, 'status', generateUuid());

  const { error } = await supabase.from('facility_status_history').insert({
    user_id: userId,
    facility_id: normalizedFacilityId,
    status: nextStatus,
    previous_status: currentStatus,
    action_type: 'status',
    idempotency_key: idempotencyKey,
    source: 'web',
    session_id: getFamilyActionSessionId(),
    local_sequence: getLocalSequence(),
  });

  if (error) {
    if (isUniqueViolation(error)) return { status: 'already_exists' };
    throw error;
  }
  return { status: 'success' };
};

const toMonthDate = (value?: string | null): string => {
  if (value && /^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const markFacilityMovedIn = async (
  facilityId: string,
  moveInMonth?: string,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return { status: 'error', message: 'Facility ID is not a UUID.' };

  const userId = await getCurrentUserId();
  if (!userId) return { status: 'error', message: 'User is not authenticated.' };

  const monthDate = toMonthDate(moveInMonth);

  const { data: existingMoveIn, error: existingMoveInError } = await supabase
    .from('move_ins')
    .select('facility_id')
    .eq('user_id', userId)
    .eq('facility_id', normalizedFacilityId)
    .maybeSingle();
  if (existingMoveInError && existingMoveInError.code !== NO_ROW_ERROR_CODE) throw existingMoveInError;
  if (existingMoveIn?.facility_id) return { status: 'already_exists' };

  const moveInIdempotency = await registerIdempotencyKey(userId, 'move_in', generateUuid());
  const { error: moveInError } = await supabase.from('move_ins').insert({
    user_id: userId,
    facility_id: normalizedFacilityId,
    move_in_month: monthDate,
    action_type: 'move_in',
    idempotency_key: moveInIdempotency,
    source: 'web',
    session_id: getFamilyActionSessionId(),
    local_sequence: getLocalSequence(),
  });

  if (moveInError) {
    if (isUniqueViolation(moveInError)) return { status: 'already_exists' };
    throw moveInError;
  }

  const statusResult = await updateFacilityStatus(normalizedFacilityId, 'moved_in');
  if (statusResult.status === 'error') return statusResult;
  return { status: 'success' };
};

export const upsertAttribution = async (
  facilityId: string,
  attributionType: AttributionType,
): Promise<ActionResult> => {
  const normalizedFacilityId = ensureUuid(facilityId);
  if (!normalizedFacilityId) return { status: 'error', message: 'Facility ID is not a UUID.' };

  const userId = await getCurrentUserId();
  if (!userId) return { status: 'error', message: 'User is not authenticated.' };

  const idempotencyKey = await registerIdempotencyKey(userId, 'attribution', generateUuid());

  const { error } = await supabase.from('attribution').upsert(
    {
      user_id: userId,
      facility_id: normalizedFacilityId,
      attribution_type: attributionType,
      action_type: 'attribution',
      idempotency_key: idempotencyKey,
      source: 'web',
      session_id: getFamilyActionSessionId(),
      local_sequence: getLocalSequence(),
    },
    {
      onConflict: 'user_id,facility_id',
    },
  );

  if (error) {
    if (isUniqueViolation(error)) return { status: 'already_exists' };
    throw error;
  }
  return { status: 'success' };
};

export const fetchFamilyDashboardCards = async (): Promise<FamilyDashboardCard[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from('family_dashboard_snapshot')
    .select('facility_id,status,latest_note,next_tour')
    .eq('user_id', userId);
  if (snapshotError) throw snapshotError;

  const snapshot = (snapshotRows || []) as FamilyDashboardSnapshotRow[];
  if (snapshot.length === 0) return [];

  const facilityIds = snapshot.map((row) => row.facility_id);

  const [{ data: facilityRows, error: facilityError }, { data: moveInRows, error: moveInError }, { data: attributionRows, error: attributionError }] =
    await Promise.all([
      supabase
        .from('facilities')
        .select('id,name,city,state,public_slug,public_route_id,primary_care_type_slug')
        .in('id', facilityIds),
      supabase.from('move_ins').select('facility_id,move_in_month').eq('user_id', userId).in('facility_id', facilityIds),
      supabase.from('attribution').select('facility_id,attribution_type').eq('user_id', userId).in('facility_id', facilityIds),
    ]);

  if (facilityError) throw facilityError;
  if (moveInError) throw moveInError;
  if (attributionError) throw attributionError;

  const facilityById = new Map<string, FamilyDashboardFacilityRow>(
    ((facilityRows || []) as FamilyDashboardFacilityRow[]).map((row) => [row.id, row]),
  );
  const moveInById = new Map<string, string | null>(
    ((moveInRows || []) as Array<{ facility_id: string; move_in_month: string | null }>).map((row) => [
      row.facility_id,
      row.move_in_month,
    ]),
  );
  const attributionById = new Map<string, AttributionType | null>(
    ((attributionRows || []) as Array<{ facility_id: string; attribution_type: AttributionType | null }>).map(
      (row) => [row.facility_id, row.attribution_type],
    ),
  );

  return snapshot
    .map((row) => {
      const facility = facilityById.get(row.facility_id);
      return {
        facilityId: row.facility_id,
        facilityName: facility?.name || 'Facility',
        city: facility?.city || null,
        state: facility?.state || null,
        publicSlug: facility?.public_slug || null,
        publicRouteId: facility?.public_route_id || null,
        primaryCareTypeSlug: facility?.primary_care_type_slug || null,
        status: row.status,
        latestNote: row.latest_note,
        nextTour: row.next_tour,
        moveInMonth: moveInById.get(row.facility_id) || null,
        attributionType: attributionById.get(row.facility_id) || null,
      } as FamilyDashboardCard;
    })
    .sort((a, b) => a.facilityName.localeCompare(b.facilityName));
};

export const getFamilyDashboardFacilityPath = (card: FamilyDashboardCard): string =>
  buildFacilityDetailPath({
    id: card.facilityId,
    publicSlug: card.publicSlug,
    publicRouteId: card.publicRouteId,
    careType: card.primaryCareTypeSlug,
    state: card.state,
    city: card.city,
  });
