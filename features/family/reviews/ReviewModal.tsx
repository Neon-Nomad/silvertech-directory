import React, { useState } from 'react';
import { Star, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, facilityName }) => {
  const [ratings, setRatings] = useState({
    responsiveness: 0,
    cleanliness: 0,
    careQuality: 0,
    activities: 0
  });
  const [comment, setComment] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Review Submitted:', { facilityName, ratings, comment, isVerified });
    onClose();
    alert('Thank you for your review! It is pending moderation.');
  };

  const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (n: number) => void }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-colors ${star <= value ? 'text-yellow-400' : 'text-slate-300'}`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">Review {facilityName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StarRating 
              label="Staff Responsiveness" 
              value={ratings.responsiveness} 
              onChange={(n) => setRatings({...ratings, responsiveness: n})} 
            />
            <StarRating 
              label="Cleanliness" 
              value={ratings.cleanliness} 
              onChange={(n) => setRatings({...ratings, cleanliness: n})} 
            />
            <StarRating 
              label="Quality of Care" 
              value={ratings.careQuality} 
              onChange={(n) => setRatings({...ratings, careQuality: n})} 
            />
            <StarRating 
              label="Activities & Social" 
              value={ratings.activities} 
              onChange={(n) => setRatings({...ratings, activities: n})} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Share your experience</label>
            <textarea 
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="What should other families know?"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                required
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">
                I certify that this review is based on my own first-hand experience (or that of a family member) and is not posted by a competitor or employee.
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={!isVerified}>
            Submit Verified Review
          </Button>
        </form>
      </div>
    </div>
  );
};
