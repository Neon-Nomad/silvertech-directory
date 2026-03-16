import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Globe, CheckCircle2, ShieldCheck, X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { FacilityPhotoManager } from './FacilityPhotoManager';
import { FacilityAmenitiesEditor } from './FacilityAmenitiesEditor';
import { FacilityCareTypesEditor } from './FacilityCareTypesEditor';
import { ProfileCompleteness, getProfileCompleteness } from './ProfileCompleteness';
import { trackActivationEvent } from '@/src/config/activationEvents';
import { getActivationSessionId } from '@/src/utils/activationSession';
import { useOperatorPlan } from '@/src/hooks/useOperatorPlan';
import { buildFacilityDetailPath } from '@/src/utils/facilityPath';

const getFirstSaveAckKey = (sessionId: string) => `std_operator_first_save_ack_${sessionId}`;

export const EditFacility: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: planLoading } = useOperatorPlan();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ title: string; body: string } | null>(null);
  const [showMobileHealth, setShowMobileHealth] = useState(false);
  const [versioningEnabled, setVersioningEnabled] = useState(false);
  const [draftVersionNo, setDraftVersionNo] = useState<number | null>(null);
  const [publishedVersionNo, setPublishedVersionNo] = useState<number | null>(null);
  const trackedFieldUpdatesRef = React.useRef<Set<string>>(new Set());
  const facilityColumnsRef = React.useRef<Set<string>>(new Set());
  const maybeAppendFirstSaveReinforcement = (body: string) => {
    if (typeof window === 'undefined') return body;
    const sessionId = getActivationSessionId();
    const key = getFirstSaveAckKey(sessionId);
    if (window.localStorage.getItem(key)) {
      return body;
    }
    window.localStorage.setItem(key, '1');
    return `${body} Nice. Your listing just improved.`;
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    website: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    min_price: '',
    max_price: '',
    plan: 'basic',
    virtual_tour_url: '',
    tour_scheduling_url: '',
  });

  const [counts, setCounts] = useState({
    photos: 0,
    amenities: 0,
    careTypes: 0
  });
  const [publicIdentity, setPublicIdentity] = useState<{ publicSlug: string | null; publicRouteId: number | null }>({
    publicSlug: null,
    publicRouteId: null,
  });

  const fetchCounts = async () => {
    if (!id) return;
    try {
      const [photos, amenities, careTypes] = await Promise.all([
        supabase.from('facility_photos').select('id', { count: 'exact', head: true }).eq('facility_id', id),
        supabase.from('facility_amenities').select('amenity_id', { count: 'exact', head: true }).eq('facility_id', id),
        supabase.from('facility_care_types').select('care_type_id', { count: 'exact', head: true }).eq('facility_id', id)
      ]);

      setCounts({
        photos: photos.count || 0,
        amenities: amenities.count || 0,
        careTypes: careTypes.count || 0
      });
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  useEffect(() => {
    const fetchFacility = async () => {
      // Wait for auth to load
      if (authLoading) return;

      if (!id || !user) {
        // If auth finished and no user, we let the render handle the redirect/error
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Verify ownership
        if (data.owner_id !== user.id) {
          setError("You do not have permission to edit this facility.");
          setLoading(false);
          return;
        }

        facilityColumnsRef.current = new Set(Object.keys(data || {}));
        const hasColumn = (column: string) => facilityColumnsRef.current.has(column);

        const nextFormData = {
          name: data.name || '',
          description: (data.description as string | undefined) || '',
          phone: data.phone || '',
          website: (data.website as string | undefined) || (data.website_url as string | undefined) || '',
          email: (data.email as string | undefined) || '',
          address_line1: data.address_line1 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          min_price: typeof data.min_price === 'number' ? data.min_price.toString() : '',
          max_price: typeof data.max_price === 'number' ? data.max_price.toString() : '',
          plan: (data.plan as string | undefined) || ((data.listing_tier as string | undefined) === 'free' ? 'basic' : (data.listing_tier as string | undefined)) || 'basic',
          virtual_tour_url: (data.virtual_tour_url as string | undefined) || '',
          tour_scheduling_url: (data.tour_scheduling_url as string | undefined) || '',
        };
        setFormData(nextFormData);
        setPublicIdentity({
          publicSlug: typeof data.public_slug === 'string' && data.public_slug.trim() ? data.public_slug.trim() : null,
          publicRouteId: typeof data.public_route_id === 'number' ? data.public_route_id : null,
        });

        // Older databases may not have profile version columns; avoid noisy 400s.
        const canUseProfileVersioning =
          hasColumn('description') &&
          hasColumn('website') &&
          hasColumn('email') &&
          hasColumn('min_price') &&
          hasColumn('max_price');

        if (canUseProfileVersioning) {
          const { data: profileState, error: profileStateError } = await supabase
            .rpc('get_operator_facility_profile_state', { p_facility_id: id });

          if (!profileStateError && Array.isArray(profileState) && profileState.length > 0) {
            const row = profileState[0] as any;
            const payload = (row?.payload || {}) as Record<string, any>;
            setVersioningEnabled(true);
            setDraftVersionNo(typeof row?.draft_version_no === 'number' ? row.draft_version_no : null);
            setPublishedVersionNo(typeof row?.published_version_no === 'number' ? row.published_version_no : null);

            setFormData({
              name: payload.name ?? nextFormData.name,
              description: payload.description ?? nextFormData.description,
              phone: payload.phone ?? nextFormData.phone,
              website: payload.website ?? nextFormData.website,
              email: payload.email ?? nextFormData.email,
              address_line1: payload.address_line1 ?? nextFormData.address_line1,
              city: payload.city ?? nextFormData.city,
              state: payload.state ?? nextFormData.state,
              postal_code: payload.postal_code ?? nextFormData.postal_code,
              min_price: payload.min_price !== null && payload.min_price !== undefined ? String(payload.min_price) : nextFormData.min_price,
              max_price: payload.max_price !== null && payload.max_price !== undefined ? String(payload.max_price) : nextFormData.max_price,
              plan: payload.plan ?? nextFormData.plan
            });
          }
        }

        await fetchCounts();
      } catch (err) {
        console.error('Error fetching facility:', err);
        setError('Failed to load facility details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id, user, authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (user && id && !trackedFieldUpdatesRef.current.has(name)) {
      trackedFieldUpdatesRef.current.add(name);
      trackActivationEvent(
        'field_updated',
        {
          operator_id: user.id,
          facility_id: id,
          session_id: getActivationSessionId(),
          plan_tier: isPremium ? 'premium' : 'free',
          activation_score: 0,
          source_screen: 'edit_facility',
        },
        { field_name: name },
      );
    }
  };

  const buildPayload = () => ({
    name: formData.name,
    description: formData.description,
    phone: formData.phone,
    website: formData.website,
    email: formData.email,
    address_line1: formData.address_line1,
    city: formData.city,
    state: formData.state,
    postal_code: formData.postal_code,
    min_price: formData.min_price,
    max_price: formData.max_price,
    plan: formData.plan,
    virtual_tour_url: formData.virtual_tour_url || null,
    tour_scheduling_url: formData.tour_scheduling_url || null,
  });

  const handleSaveLiveFallback = async () => {
    if (!id || !user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const hasColumn = (column: string) => facilityColumnsRef.current.has(column);
      const updatePayload: Record<string, any> = {
        name: formData.name,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      };

      if (hasColumn('description')) updatePayload.description = formData.description;
      if (hasColumn('website')) updatePayload.website = formData.website || null;
      if (hasColumn('website_url')) updatePayload.website_url = formData.website || null;
      if (hasColumn('email')) updatePayload.email = formData.email || null;
      if (hasColumn('min_price')) updatePayload.min_price = formData.min_price ? parseFloat(formData.min_price) : null;
      if (hasColumn('max_price')) updatePayload.max_price = formData.max_price ? parseFloat(formData.max_price) : null;
      if (hasColumn('virtual_tour_url')) updatePayload.virtual_tour_url = formData.virtual_tour_url || null;
      if (hasColumn('tour_scheduling_url')) updatePayload.tour_scheduling_url = formData.tour_scheduling_url || null;

      trackActivationEvent(
        'autosave_triggered',
        {
          operator_id: user.id,
          facility_id: id,
          session_id: getActivationSessionId(),
          plan_tier: isPremium ? 'premium' : 'free',
          activation_score: 0,
          source_screen: 'edit_facility',
        },
        { mode: 'save_live' },
      );
      const { error } = await supabase
        .from('facilities')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      setSuccess({
        title: 'Changes Saved & Live',
        body: maybeAppendFirstSaveReinforcement('Your facility profile has been updated across the directory.'),
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating facility:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!id || !user) return;
    if (!versioningEnabled) {
      await handleSaveLiveFallback();
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      trackActivationEvent(
        'autosave_triggered',
        {
          operator_id: user.id,
          facility_id: id,
          session_id: getActivationSessionId(),
          plan_tier: isPremium ? 'premium' : 'free',
          activation_score: 0,
          source_screen: 'edit_facility',
        },
        { mode: 'save_draft' },
      );
      const { data: draftData, error: draftError } = await supabase.rpc('save_operator_facility_profile_draft', {
        p_facility_id: id,
        p_payload: buildPayload(),
      });
      if (draftError) throw draftError;

      const row = Array.isArray(draftData) ? draftData[0] : null;
      if (row?.version_no) setDraftVersionNo(Number(row.version_no));

      setSuccess({
        title: 'Draft Saved',
        body: maybeAppendFirstSaveReinforcement('Your changes were saved as a draft. Publish when ready.'),
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id || !user) return;
    if (!versioningEnabled) {
      await handleSaveLiveFallback();
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      trackActivationEvent(
        'autosave_triggered',
        {
          operator_id: user.id,
          facility_id: id,
          session_id: getActivationSessionId(),
          plan_tier: isPremium ? 'premium' : 'free',
          activation_score: 0,
          source_screen: 'edit_facility',
        },
        { mode: 'publish_live' },
      );
      const { data: draftData, error: draftError } = await supabase.rpc('save_operator_facility_profile_draft', {
        p_facility_id: id,
        p_payload: buildPayload(),
      });
      if (draftError) throw draftError;
      const draftRow = Array.isArray(draftData) ? draftData[0] : null;
      if (draftRow?.version_no) setDraftVersionNo(Number(draftRow.version_no));

      const { data: publishData, error: publishError } = await supabase.rpc('publish_operator_facility_profile', {
        p_facility_id: id,
      });
      if (publishError) throw publishError;

      const publishRow = Array.isArray(publishData) ? publishData[0] : null;
      if (publishRow?.version_no) {
        setPublishedVersionNo(Number(publishRow.version_no));
        setDraftVersionNo(null);
      }

      setSuccess({
        title: 'Changes Published Live',
        body: maybeAppendFirstSaveReinforcement('Your facility profile is now live across the directory.'),
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error publishing profile:', err);
      setError('Failed to publish changes. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-600">Please log in to edit this facility.</p>
        </div>
      </div>
    );
  }

  if (!id) return <div className="text-center py-10 text-red-600">Facility ID missing</div>;

  const completenessData = {
    ...formData,
    min_price: formData.min_price ? parseFloat(formData.min_price) : null,
    max_price: formData.max_price ? parseFloat(formData.max_price) : null
  };
  const profileHealth = getProfileCompleteness(completenessData, counts);
  const publicFacilityPath = buildFacilityDetailPath({
    id,
    publicSlug: publicIdentity.publicSlug,
    publicRouteId: publicIdentity.publicRouteId,
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {success && (
        <div
          className="fixed top-20 right-4 z-50 max-w-sm rounded-lg border-l-4 border-green-500 bg-green-50 p-4 shadow-lg sm:right-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">{success.title}</p>
              <p className="text-xs text-green-700">{success.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="p-2 min-h-11 min-w-11">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Edit Facility</h1>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" onClick={() => window.open(publicFacilityPath, '_blank')}>
              View Public Page
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving || publishing}>
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button variant="primary" onClick={handlePublish} disabled={saving || publishing}>
              {publishing ? 'Publishing...' : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Publish Live
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 lg:hidden">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Profile Health</p>
              <p className="text-xl font-bold text-slate-900">{profileHealth.percentage}% complete</p>
              {versioningEnabled && (
                <p className="text-xs text-slate-500 mt-1">
                  {draftVersionNo ? `Draft v${draftVersionNo}` : 'No draft'}
                  {publishedVersionNo ? ` • Live v${publishedVersionNo}` : ''}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="min-h-11 px-4"
              onClick={() => setShowMobileHealth(true)}
            >
              View Checklist
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Basic Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Facility Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your facility, amenities, and what makes it special..."
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {formData.description.length} characters
                  </p>
                </div>
              </div>
            </div>

            {/* Tour Features */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Tour & Scheduling</h2>
              <p className="text-sm text-slate-500 mb-4">Help families take the next step. Both fields are optional.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="tour_scheduling_url" className="block text-sm font-medium text-slate-700 mb-1">
                    Tour Booking Link
                  </label>
                  <input
                    id="tour_scheduling_url"
                    type="url"
                    name="tour_scheduling_url"
                    value={formData.tour_scheduling_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="https://calendly.com/your-community"
                  />
                  <p className="text-xs text-slate-500 mt-1">Calendly, Acuity, or any booking page. Shown as a "Book a Tour" button on your profile.</p>
                </div>
                <div>
                  <label htmlFor="virtual_tour_url" className="block text-sm font-medium text-slate-700 mb-1">
                    Virtual Tour URL
                  </label>
                  <input
                    id="virtual_tour_url"
                    type="url"
                    name="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="https://my.matterport.com/show/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">YouTube, Matterport, Tourweaver, or any 360° tour link.</p>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div onClick={fetchCounts} onFocusCapture={fetchCounts} className="relative">
              {!planLoading && !isPremium && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center border border-slate-200 rounded-xl">
                  <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm border border-slate-100">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Unlock Photo Gallery</h3>
                    <p className="text-slate-600 mb-4 text-sm">
                      Upgrade to a Featured Listing to add photos, gain placement priority, and more.
                    </p>
                    <Button
                      onClick={() => navigate('/dashboard/billing?selected_plan=featured')}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Upgrade for $99/mo
                    </Button>
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800 border border-green-200">
                      Includes 15-day free trial
                    </div>
                  </div>
                </div>
              )}
              <FacilityPhotoManager facilityId={id} />
            </div>

            {/* Amenities */}
            <div onClick={fetchCounts} onFocusCapture={fetchCounts}>
              <FacilityAmenitiesEditor facilityId={id} />
            </div>

            {/* Care Types */}
            <div onClick={fetchCounts} onFocusCapture={fetchCounts}>
              <FacilityCareTypesEditor facilityId={id} />
            </div>

            {/* Mobile Contact Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone-mobile" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    id="phone-mobile"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="email-mobile" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    id="email-mobile"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="website-mobile" className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    id="website-mobile"
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Pricing */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Pricing</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="min_price_mobile" className="block text-sm font-medium text-slate-700 mb-1">Minimum Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="min_price_mobile"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      name="min_price"
                      value={formData.min_price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="max_price_mobile" className="block text-sm font-medium text-slate-700 mb-1">Maximum Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="max_price_mobile"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      name="max_price"
                      value={formData.max_price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Location (Read Only) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Location</h2>
              <p className="text-sm text-slate-500 mb-4">To update your address, please contact support.</p>
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Address</label>
                  <p className="text-slate-900">{formData.address_line1}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">City</label>
                  <p className="text-slate-900">{formData.city}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">State</label>
                  <p className="text-slate-900">{formData.state}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Zip Code</label>
                  <p className="text-slate-900">{formData.postal_code}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="hidden lg:block space-y-6">

            {/* Profile Completeness */}
            <ProfileCompleteness data={completenessData} counts={counts} />

            {/* Save Action */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Version Control</h2>
              <p className="text-sm text-slate-600 mb-4">
                {versioningEnabled
                  ? 'Save a draft anytime, then publish when you are ready for changes to go live.'
                  : 'Save updates to keep your listing accurate and visible to families.'}
              </p>
              {versioningEnabled && (
                <div className="mb-3 text-xs text-slate-500">
                  {draftVersionNo ? `Draft v${draftVersionNo}` : 'No draft'}
                  {publishedVersionNo ? ` • Live v${publishedVersionNo}` : ''}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="w-full min-h-11" onClick={handleSaveDraft} disabled={saving || publishing}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button variant="primary" className="w-full min-h-11" onClick={handlePublish} disabled={saving || publishing}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {publishing ? 'Publishing...' : 'Publish Live'}
                </Button>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    id="website"
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Pricing</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="min_price" className="block text-sm font-medium text-slate-700 mb-1">Minimum Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="min_price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      name="min_price"
                      value={formData.min_price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="max_price" className="block text-sm font-medium text-slate-700 mb-1">Maximum Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="max_price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      name="max_price"
                      value={formData.max_price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location (Read Only) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Location</h2>
              <p className="text-sm text-slate-500 mb-4">To update your address, please contact support.</p>
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Address</label>
                  <p className="text-slate-900">{formData.address_line1}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">City</label>
                  <p className="text-slate-900">{formData.city}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">State</label>
                  <p className="text-slate-900">{formData.state}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Zip Code</label>
                  <p className="text-slate-900">{formData.postal_code}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showMobileHealth && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Profile health details">
          <button
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setShowMobileHealth(false)}
            aria-label="Close profile health drawer"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Profile Health</h2>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => setShowMobileHealth(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProfileCompleteness data={completenessData} counts={counts} />
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-3">
                {versioningEnabled ? 'Save draft updates and publish when ready.' : 'Changes are saved live across your listing.'}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="w-full min-h-11 justify-center" onClick={handleSaveDraft} disabled={saving || publishing}>
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button variant="primary" className="w-full min-h-11 justify-center" onClick={handlePublish} disabled={saving || publishing}>
                  {publishing ? 'Publishing...' : 'Publish Live'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Button variant="outline" className="flex-1 justify-center min-h-11" onClick={() => window.open(publicFacilityPath, '_blank')}>
            View Public Page
          </Button>
          <Button variant="outline" className="flex-1 justify-center min-h-11" onClick={handleSaveDraft} disabled={saving || publishing}>
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button variant="primary" className="flex-1 justify-center min-h-11" onClick={handlePublish} disabled={saving || publishing}>
            {publishing ? 'Publishing...' : 'Publish Live'}
          </Button>
        </div>
      </div>
    </div>
  );
};
