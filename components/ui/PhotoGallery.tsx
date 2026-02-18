import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDialogFocusManagement } from '@/src/hooks/useDialogFocusManagement';

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
  const dialogRef = useDialogFocusManagement<HTMLDivElement>({
    isOpen,
    onClose: () => setIsOpen(false),
  });

  const sampleImageUrls = Array.from({ length: 30 }, (_, i) => `/gallery_images/${i + 1}.avif`);

  const fallbackToPng = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.src.endsWith('.avif')) return;
    img.onerror = null;
    img.src = img.src.replace(/\.avif$/, '.png');
  };

  const hashSeed = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
    }
    return hash;
  };

  const pickSamplePhotos = () => {
    const seed = hashSeed(facilityName || 'silvertech');
    const shuffled = [...sampleImageUrls];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = (seed + i * 17) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 6).map((url, idx) => ({
      id: `sample-${idx + 1}`,
      url,
      caption: 'Sample community photo',
    }));
  };

  const samplePhotos: Photo[] = pickSamplePhotos();

  const isSampleGallery = !photos || photos.length === 0;
  const galleryPhotos = isSampleGallery ? samplePhotos : photos;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % galleryPhotos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
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
        <div className="mb-3 rounded-lg border border-warm-gray bg-warm-white px-4 py-3 text-sm text-charcoal/70">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-charcoal/40" />
            <span>
              Sample gallery only -- official photos have not been provided by {facilityName}.
            </span>
          </div>
        </div>
      )}
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] rounded-xl overflow-hidden">
        {/* Main Hero Image */}
        <button
          type="button"
          className={`relative cursor-pointer group text-left ${galleryPhotos.length === 1 ? 'md:col-span-4' : 'md:col-span-2 row-span-2'}`}
          onClick={() => openLightbox(0)}
          aria-label={`Open photo 1 of ${galleryPhotos.length} for ${facilityName}`}
        >
          <img 
            src={displayPhotos[0].url} 
            alt={displayPhotos[0].caption || `${facilityName} - Main View`} 
            loading="lazy"
            decoding="async"
            onError={fallbackToPng}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {isSampleGallery && (
            <div className="absolute left-3 top-3 bg-charcoal/80 text-white text-xs uppercase tracking-widest px-2 py-1 rounded">
              Sample
            </div>
          )}
        </button>

        {/* Side Images */}
        {displayPhotos.slice(1).map((photo, idx) => (
          <button
            type="button"
            key={photo.id} 
            className="relative cursor-pointer group hidden md:block h-full text-left"
            onClick={() => openLightbox(idx + 1)}
            aria-label={`Open photo ${idx + 2} of ${galleryPhotos.length} for ${facilityName}`}
          >
            <img 
              src={photo.url} 
              alt={photo.caption || `${facilityName} - View ${idx + 2}`} 
              loading="lazy"
              decoding="async"
              onError={fallbackToPng}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* "View All" Overlay on the last item if there are more photos */}
            {idx === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{remainingCount} more</span>
              </div>
            )}
          </button>
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
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${facilityName} photo gallery`}
        >
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close photo gallery"
          >
            <X className="w-8 h-8" />
          </button>

          <button 
            onClick={prevPhoto}
            className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="max-w-5xl max-h-[85vh] w-full px-4 flex flex-col items-center">
            <img 
              src={galleryPhotos[currentIndex].url} 
              alt={galleryPhotos[currentIndex].caption || facilityName} 
              decoding="async"
              onError={fallbackToPng}
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
            aria-label="Next photo"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </>
  );
};
