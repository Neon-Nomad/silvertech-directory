import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FacilityPhoto {
  id: string;
  url: string;
  caption: string | null;
  display_order: number;
}

interface FacilityPhotoManagerProps {
  facilityId: string;
}

export const FacilityPhotoManager: React.FC<FacilityPhotoManagerProps> = ({ facilityId }) => {
  const [photos, setPhotos] = useState<FacilityPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [facilityId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_photos')
        .select('*')
        .eq('facility_id', facilityId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(e.target.files) as File[];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${facilityId}/${Math.random()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('facility-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('facility-photos')
          .getPublicUrl(fileName);

        // 3. Insert into facility_photos table
        const { error: dbError } = await supabase
          .from('facility_photos')
          .insert({
            facility_id: facilityId,
            url: publicUrl,
            caption: file.name.split('.')[0] // Default caption to filename
          });

        if (dbError) throw dbError;
      }

      // Refresh photos
      await fetchPhotos();
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      alert('Failed to upload photos: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (photoId: string, url: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('facility_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      // 2. Try to delete from storage (optional, but good for cleanup)
      // Extract path from URL
      const path = url.split('/facility-photos/')[1];
      if (path) {
        await supabase.storage
          .from('facility-photos')
          .remove([path]);
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo');
    }
  };

  if (loading) return <div className="py-4 text-center">Loading photos...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Photo Gallery</h2>
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            name="gallery-upload"
            onChange={handleFileUpload}
            className="hidden"
            id="gallery-upload"
            disabled={uploading}
          />
          <label
            htmlFor="gallery-upload"
            className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              uploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add Photos
              </>
            )}
          </label>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No photos added yet</p>
          <p className="text-sm text-slate-400 mt-1">Upload photos to showcase your facility</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img 
                src={photo.url} 
                alt={photo.caption || 'Facility photo'} 
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleDelete(photo.id, photo.url)}
                  className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
