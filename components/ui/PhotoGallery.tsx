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

  const samplePhotos: Photo[] = [
    { id: 'sample-1', url: '/images/hero_image.png', caption: 'Sample common area' },
    { id: 'sample-2', url: '/images/hero_image.png', caption: 'Sample dining space' },
    { id: 'sample-3', url: '/images/hero_image.png', caption: 'Sample resident lounge' },
    { id: 'sample-4', url: '/images/hero_image.png', caption: 'Sample outdoor courtyard' },
  ];

  const isSampleGallery = !photos || photos.length === 0;
  const galleryPhotos = isSampleGallery ? samplePhotos : photos;

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
  
  const displayPhotos = galleryPhotos.slice(0, 5);
  const remainingCount = galleryPhotos.length - 5;

  return (
    <>
      {isSampleGallery && (
        <div className="mb-3 rounded-lg border border-warm-gray bg-warm-white px-4 py-3 text-xs text-charcoal/70">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-charcoal/40" />
            <span>
              Sample gallery only — official photos have not been provided by {facilityName}.
            </span>
          </div>
        </div>
      )}
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] rounded-xl overflow-hidden">
        {/* Main Hero Image */}
        <div 
          className={`relative cursor-pointer group ${galleryPhotos.length === 1 ? 'md:col-span-4' : 'md:col-span-2 row-span-2'}`}
          onClick={() => openLightbox(0)}
        >
          <img 
            src={displayPhotos[0].url} 
            alt={displayPhotos[0].caption || `${facilityName} - Main View`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {isSampleGallery && (
            <div className="absolute left-3 top-3 bg-charcoal/80 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded">
              Sample
            </div>
          )}
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
      {galleryPhotos.length > 1 && (
        <div className="md:hidden mt-2">
           <Button variant="outline" className="w-full" onClick={() => openLightbox(0)}>
             View All {galleryPhotos.length} Photos
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
              src={galleryPhotos[currentIndex].url} 
              alt={galleryPhotos[currentIndex].caption || facilityName} 
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            {galleryPhotos[currentIndex].caption && (
              <p className="text-white/90 mt-4 text-lg font-medium">
                {galleryPhotos[currentIndex].caption}
              </p>
            )}
            <p className="text-white/50 mt-2 text-sm">
              {currentIndex + 1} / {galleryPhotos.length}
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
