import React, { useState } from 'react';
import { Lock, Star, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SurveyResults: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate lead capture
    console.log('Lead captured:', formData);
    setIsUnlocked(true);
  };

  // Mock top matches
  const topMatches = [
    { id: 1, name: "Sunrise of Beverly Hills", score: 98, type: "Assisted Living", price: "$5,500/mo" },
    { id: 2, name: "The Watermark", score: 95, type: "Memory Care", price: "$7,200/mo" },
    { id: 3, name: "Belmont Village", score: 92, type: "Independent Living", price: "$4,800/mo" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            We found 3 perfect matches.
          </h1>
          <p className="text-xl text-slate-600">
            Based on your needs, these facilities scored highest for quality and transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {topMatches.map((match, index) => (
            <div key={match.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 relative">
              <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" /> {match.score}% Match
              </div>
              <div className="h-48 bg-slate-200 animate-pulse">
                 {/* Placeholder for facility image */}
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Image
                 </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{match.name}</h3>
                <p className="text-slate-500 mb-4">{match.type}</p>
                
                {isUnlocked ? (
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>{match.price}</span>
                    </div>
                    <div className="flex items-center text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Verified License</span>
                    </div>
                    <Button className="w-full mt-4" variant="primary">View Details</Button>
                  </div>
                ) : (
                  <div className="space-y-3 filter blur-sm select-none">
                    <div className="flex items-center text-slate-700">
                      <CheckCircle className="w-4 h-4 text-slate-300 mr-2" />
                      <span>$X,XXX/mo</span>
                    </div>
                    <div className="flex items-center text-slate-700">
                      <CheckCircle className="w-4 h-4 text-slate-300 mr-2" />
                      <span>Verified License</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline" disabled>View Details</Button>
                  </div>
                )}
              </div>
              
              {!isUnlocked && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                  <Lock className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {!isUnlocked && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl mx-auto border border-primary-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock Full Details & Pricing</h2>
              <p className="text-slate-600">
                Get instant access to pricing, direct contact info, and our complete match report.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full text-lg">
                Unlock Matches <Lock className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-slate-400 mt-4">
                We respect your privacy. Your data is never sold to third-party agencies.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResults;
