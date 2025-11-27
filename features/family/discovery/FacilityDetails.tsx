import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Star, DollarSign, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import facilitiesData from '../../../src/data/facilities.json';

export const FacilityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facility = facilitiesData.find(f => f.id === id);

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Facility Not Found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  // Mock amenities since they aren't in the JSON yet
  const amenities = [
    "24/7 Nursing Staff",
    "Medication Management",
    "Housekeeping & Laundry",
    "Scheduled Transportation",
    "Restaurant-Style Dining",
    "Social Activities",
    "Emergency Call System",
    "Wi-Fi in Common Areas"
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Image */}
      <div className="h-[400px] w-full relative">
        <img 
          src={facility.image} 
          alt={facility.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <Button 
            variant="outline" 
            className="mb-6 text-white border-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{facility.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <MapPin className="h-5 w-5" /> {facility.address}
            </span>
            <span className="flex items-center gap-1 bg-primary-600/90 px-3 py-1 rounded-full text-sm font-medium">
              {facility.type}
            </span>
            {facility.verified && (
              <span className="flex items-center gap-1 bg-green-500/90 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Verified Partner
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About this Community</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Experience exceptional senior living at {facility.name}. Our community is dedicated to providing 
                a safe, engaging, and supportive environment for all residents. With a focus on personalized care 
                and vibrant lifestyle programs, we ensure that every individual receives the attention and respect 
                they deserve.
              </p>
              
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 font-medium">Capacity</p>
                  <p className="text-lg font-semibold text-slate-900">{facility.capacity} Residents</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 font-medium">Care Level</p>
                  <p className="text-lg font-semibold text-slate-900">{facility.type}</p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Amenities & Services</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Starting at</p>
                  <div className="flex items-center gap-1 text-primary-600">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-3xl font-bold">{facility.price === "Call for Pricing" ? "Call" : facility.price.replace(/[^0-9,]/g, '')}</span>
                    {facility.price !== "Call for Pricing" && <span className="text-sm text-slate-500 font-normal">/mo</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-slate-900 font-bold text-lg">4.8</span>
                  </div>
                  <span className="text-xs text-slate-500">Based on 24 reviews</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="primary" className="w-full py-4 text-lg">
                  Schedule a Tour
                </Button>
                <Button variant="outline" className="w-full py-4 text-lg">
                  Request Info
                </Button>
              </div>

              {/* @ts-ignore */}
              {facility.phone && (
                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-500 mb-2">Questions? Call us directly</p>
                  <a href={`tel:${facility.phone}`} className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900 hover:text-primary-600 transition-colors">
                    <Phone className="h-5 w-5" />
                    {facility.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
