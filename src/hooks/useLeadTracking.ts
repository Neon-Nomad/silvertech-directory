import { useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';

type LeadEventType =
  | 'phone_reveal'
  | 'directions_clicked'
  | 'comparison_added'
  | 'faq_viewed'
  | 'page_view'
  | 'schedule_tour';

const SESSION_STORAGE_KEY = 'std_session_id';

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
};

export const useLeadTracking = () => {
  const { user } = useAuth();

  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && isUuid(existing)) return existing;
    const created = createUuid();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  }, []);

  const trackLeadEvent = useCallback(
    async (
      facilityId: string,
      eventType: LeadEventType,
      metadata: Record<string, unknown> = {}
    ) => {
      if (!isUuid(facilityId)) return;
      const sessionId = getSessionId();
      if (!sessionId) return;

      const { error } = await supabase.from('lead_events').insert({
        facility_id: facilityId,
        session_id: sessionId,
        user_id: user?.id || null,
        event_type: eventType,
        metadata,
      });

      if (error) {
        console.error('Failed to insert lead event:', error);
      }
    },
    [getSessionId, user?.id]
  );

  return { getSessionId, trackLeadEvent };
};
