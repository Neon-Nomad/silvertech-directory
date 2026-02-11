import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { FacilityPhotoManager } from './FacilityPhotoManager';
import { FacilityAmenitiesEditor } from './FacilityAmenitiesEditor';
import { FacilityCareTypesEditor } from './FacilityCareTypesEditor';
import { ProfileCompleteness } from './ProfileCompleteness';

export const EditFacility: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    plan: 'basic'
  });

  const [counts, setCounts] = useState({
    photos: 0,
    amenities: 0,
    careTypes: 0
  });

  const fetchCounts = async () => {
    if (!id) return;
    try {
      const [photos, amenities, careTypes] = await Promise.all([
        supabase.from('facility_photos').select('id', { count: 'exact' }).eq('facility_id', id),
        supabase.from('facility_amenities').select('id', { count: 'exact' }).eq('facility_id', id),
        supabase.from('facility_care_types').select('id', { count: 'exact' }).eq('facility_id', id)
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

        setFormData({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          website: data.website || '',
          email: data.email || '',
          address_line1: data.address_line1 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          min_price: data.min_price?.toString() || '',
          max_price: data.max_price?.toString() || '',
          plan: data.plan || 'basic'
        });

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
  };

  const handleSubmit = async () => {
    if (!id || !user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          website: formData.website,
          email: formData.email,
          min_price: formData.min_price ? parseFloat(formData.min_price) : null,
          max_price: formData.max_price ? parseFloat(formData.max_price) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating facility:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await handleSubmit();
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Edit Facility</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.open(`/facility/${id}`, '_blank')}>
              View Public Page
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 animate-fade-in">
            <Save className="h-5 w-5" />
            Changes saved successfully!
          </div>
        )}

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

            {/* Photos */}
            <div onClick={fetchCounts} className="relative">
              {formData.plan === 'basic' && (
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
                      onClick={() => navigate('/dashboard')}
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
            <div onClick={fetchCounts}>
              <FacilityAmenitiesEditor facilityId={id} />
            </div>

            {/* Care Types */}
            <div onClick={fetchCounts}>
              <FacilityCareTypesEditor facilityId={id} />
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* Profile Completeness */}
            <ProfileCompleteness
              data={{
                ...formData,
                min_price: formData.min_price ? parseFloat(formData.min_price) : null,
                max_price: formData.max_price ? parseFloat(formData.max_price) : null
              }}
              counts={counts}
            />

            {/* Publish Action */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Publish Profile</h2>
              <p className="text-sm text-slate-600 mb-4">
                Make sure your profile is up to date. Publishing will mark your facility as recently updated, improving your visibility.
              </p>
              <Button variant="outline" className="w-full" onClick={handlePublish} disabled={saving}>
                <Globe className="w-4 h-4 mr-2" />
                Publish Updates
              </Button>
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
    </div>
  );
};
