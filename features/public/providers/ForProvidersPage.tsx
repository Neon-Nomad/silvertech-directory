import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, Users, Heart, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export const ForProvidersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Helmet>
        <title>For Providers | SilverTech Directory</title>
        <meta name="description" content="Join the ethical alternative to senior living referral agencies. Zero commissions, direct leads, and complete transparency." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            The Ethical Alternative to <br className="hidden md:block" />
            <span className="text-primary-400">Referral Agencies</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            Build trust. Keep control. Pay zero commissions.
            <br />
            We connect families directly to you—no middlemen, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/advertise" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-primary-900/50">
              View Plans & Pricing
            </Link>
            <Link to="/claim-business" className="bg-transparent border-2 border-slate-600 hover:border-white text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors">
              Claim Free Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Mission / Why We Exist */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why SilverTech Exists</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We believe eldercare should be transparent and searchable, without forcing families into sales funnels or commission-based systems. The current model is broken: families are sold as leads, and providers are forced to pay exorbitant commissions for placements. We're here to change that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                The "Other" Guys
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Charge 100-120% of first month's rent</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Gatekeep family contact info</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>"Speed to lead" wars that harass families</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Pay-to-play rankings hidden from users</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-primary-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary-500"></div>
              <h3 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                The SilverTech Way
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>Zero commissions. Ever.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>Direct connection to families</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>Transparent, merit-based search</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>Optional tools, not forced fees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">A Better Ecosystem for Everyone</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trust & Transparency</h3>
              <p className="text-slate-600">
                Families trust us because we don't hide data. When they see your listing, they know they're seeing the real picture, not a paid placement.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Relationships</h3>
              <p className="text-slate-600">
                You own the relationship from day one. We provide the introduction, then get out of the way. No interference, no "ownership" of leads.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mission Aligned</h3>
              <p className="text-slate-600">
                We align with your mission to provide care. Our optional tools help you operate better, not just market harder.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>

            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">1</div>
              <h3 className="text-xl font-bold text-center mb-2">Claim Profile</h3>
              <p className="text-slate-400 text-center text-sm">Find your community and claim ownership. It's completely free.</p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">2</div>
              <h3 className="text-xl font-bold text-center mb-2">Update Details</h3>
              <p className="text-slate-400 text-center text-sm">Add photos, pricing, and care details to stand out to families.</p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">3</div>
              <h3 className="text-xl font-bold text-center mb-2">Get Inquiries</h3>
              <p className="text-slate-400 text-center text-sm">Receive direct calls and emails from interested families.</p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">4</div>
              <h3 className="text-xl font-bold text-center mb-2">Optional Upgrade</h3>
              <p className="text-slate-400 text-center text-sm">Add lead capture or featured status only if you need it.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-primary-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take back control?</h2>
          <p className="text-xl text-primary-100 mb-10">
            Join thousands of providers who are saying no to commissions and yes to transparency.
          </p>
          <Link to="/advertise" className="inline-flex items-center bg-white text-primary-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-slate-50 transition-colors">
            See Our Plans <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
