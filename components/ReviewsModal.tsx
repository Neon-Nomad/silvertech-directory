import React from 'react';
import { X, Star, ThumbsUp } from 'lucide-react';
import { Review, getRatingDistribution, calculateAverageRating } from '../src/utils/reviewGenerator';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  reviews: Review[];
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose, facilityName, reviews }) => {
  if (!isOpen) return null;

  const avgRating = calculateAverageRating(reviews);
  const distribution = getRatingDistribution(reviews);

  // Render star rating
  const renderStars = (rating: number, size: 'small' | 'large' = 'small') => {
    const starSize = size === 'large' ? 24 : 16;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{facilityName}</h2>
                <p className="text-slate-600">{reviews.length} Reviews</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Average Rating Display */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-slate-900 mb-2">{avgRating}</div>
                {renderStars(Math.round(avgRating), 'large')}
              </div>
              
              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const data = distribution[rating as keyof typeof distribution];
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-12">
                        {data.percentage > 0 ? `${Math.round(data.percentage)}%` : '0%'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Reviews List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-slate-200 pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {review.reviewerName.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    {/* Reviewer Info */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                        <p className="text-sm text-slate-500">{review.date}</p>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    
                    {/* Review Text */}
                    <p className="text-slate-700 leading-relaxed mb-3">{review.text}</p>
                    
                    {/* Helpful Button */}
                    <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors">
                      <ThumbsUp size={16} />
                      <span>Helpful ({review.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-600 text-center">
              Reviews are from family members and visitors
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewsModal;
