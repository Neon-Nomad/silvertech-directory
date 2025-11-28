import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Photo {
  id: string;
  url: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  facilityName: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, facilityName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center rounded-xl border border-slate-200">
        <div className="text-center text-slate-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No photos available</p>
        </div>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Grid Layout Logic
  // 1 photo: Full width
  // 2 photos: 50/50 split
  // 3 photos: 1 large (66%), 2 stacked small (33%)
  // 4 photos: 1 large (66%), 3 stacked small (33%) - wait, 3 stacked is weird. 
  // Let's stick to a standard "Hero + Thumbnails" or "Grid" layout.
  // Standard Real Estate Layout: 1 Large Main, 4 Small Side (if 5+).
  
  const displayPhotos = photos.slice(0, 5);
  const remainingCount = photos.length - 5;

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] rounded-xl overflow-hidden">
        {/* Main Hero Image */}
        <div 
          className={`relative cursor-pointer group ${photos.length === 1 ? 'md:col-span-4' : 'md:col-span-2 row-span-2'}`}
          onClick={() => openLightbox(0)}
        >
          <img 
            src={displayPhotos[0].url} 
            alt={displayPhotos[0].caption || `${facilityName} - Main View`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Side Images */}
        {displayPhotos.slice(1).map((photo, idx) => (
          <div 
            key={photo.id} 
            className="relative cursor-pointer group hidden md:block h-full"
            onClick={() => openLightbox(idx + 1)}
          >
            <img 
              src={photo.url} 
              alt={photo.caption || `${facilityName} - View ${idx + 2}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* "View All" Overlay on the last item if there are more photos */}
            {idx === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{remainingCount} more</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile "View All" Button (if more than 1 photo) */}
      {photos.length > 1 && (
        <div className="md:hidden mt-2">
           <Button variant="outline" className="w-full" onClick={() => openLightbox(0)}>
             View All {photos.length} Photos
           </Button>
        </div>
      )}

      {/* Lightbox Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button 
            onClick={prevPhoto}
            className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="max-w-5xl max-h-[85vh] w-full px-4 flex flex-col items-center">
            <img 
              src={photos[currentIndex].url} 
              alt={photos[currentIndex].caption || facilityName} 
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            {photos[currentIndex].caption && (
              <p className="text-white/90 mt-4 text-lg font-medium">
                {photos[currentIndex].caption}
              </p>
            )}
            <p className="text-white/50 mt-2 text-sm">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>

          <button 
            onClick={nextPhoto}
            className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </>
  );
};
