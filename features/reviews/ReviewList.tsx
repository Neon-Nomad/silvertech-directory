import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Star, User } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  user_id: string;
}

interface ReviewListProps {
  facilityId: string;
  refreshTrigger: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({ facilityId, refreshTrigger }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [facilityId, refreshTrigger]);

  if (loading) {
    return <div className="py-4 text-center text-slate-500">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
        <p className="text-slate-500">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Verified Resident / Family</p>
                <p className="text-xs text-slate-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">{review.content}</p>
        </div>
      ))}
    </div>
  );
};
