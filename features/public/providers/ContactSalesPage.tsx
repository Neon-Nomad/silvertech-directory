import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Helmet } from 'react-helmet-async';

export const ContactSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    communityName: '',
    beds: '',
    challenges: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('sales_inquiries')
        .insert([
          {
            user_id: user?.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            community_name: formData.communityName,
            beds: formData.beds,
            challenges: formData.challenges
          }
        ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Helmet>
          <title>Contact Sales | SilverTech Directory</title>
          <meta name="description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
          <link rel="canonical" href="https://silvertechdirectory.com/providers/contact-sales" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="SilverTech Directory" />
          <meta property="og:title" content="Contact Sales | SilverTech Directory" />
          <meta property="og:description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
          <meta property="og:url" content="https://silvertechdirectory.com/providers/contact-sales" />
          <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Contact Sales | SilverTech Directory" />
          <meta name="twitter:description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
          <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
        </Helmet>
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Received!</h2>
          <p className="text-slate-600 mb-8">
            Thanks for your interest in the Lead Capture Suite. Our team will review your information and reach out within 24 hours to schedule a demo.
          </p>
          <Button onClick={() => navigate(user ? '/dashboard' : '/for-facilities')} className="w-full">
            {user ? 'Return to Dashboard' : 'Return to Provider Overview'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Contact Sales | SilverTech Directory</title>
        <meta name="description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
        <link rel="canonical" href="https://silvertechdirectory.com/providers/contact-sales" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Contact Sales | SilverTech Directory" />
        <meta property="og:description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
        <meta property="og:url" content="https://silvertechdirectory.com/providers/contact-sales" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Sales | SilverTech Directory" />
        <meta name="twitter:description" content="Contact SilverTech sales to learn about Lead Capture Suite and provider tools." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Upgrade to Lead Capture Suite</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get 10x more leads with AI-powered tools, missed call protection, and priority placement.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Benefits Column */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">What's Included in the Suite</h3>
              <ul className="space-y-4">
                {[
                  "Missed Call Protection (AI Receptionist)",
                  "Real-time Lead Scoring & Qualification",
                  "Monthly Performance & ROI Reports",
                  "Priority Placement in Search Results",
                  "Dedicated Account Manager",
                  "Virtual Tour Embeds",
                  "Competitor Analysis"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-primary-900">Prefer to talk now?</h4>
                  <p className="text-primary-700 text-sm mb-2">Call our sales team directly.</p>
                  <a href="tel:+15551234567" className="text-primary-800 font-bold hover:underline">
                    (555) 123-4567
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Sales</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Beds</label>
                  <select
                    name="beds"
                    value={formData.beds}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select...</option>
                    <option value="1-10">1-10 beds</option>
                    <option value="11-50">11-50 beds</option>
                    <option value="51-100">51-100 beds</option>
                    <option value="100+">100+ beds</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Community Name</label>
                <input
                  type="text"
                  name="communityName"
                  required
                  value={formData.communityName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Sunrise Senior Living"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What are your biggest challenges?</label>
                <textarea
                  name="challenges"
                  rows={3}
                  value={formData.challenges}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Low occupancy, missed calls, lead quality..."
                />
              </div>

              <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 text-lg">
                Request Demo & Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-slate-500">
                By submitting this form, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
