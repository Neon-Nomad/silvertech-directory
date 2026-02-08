import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, ArrowRight, DollarSign, Zap } from 'lucide-react';

export const AdvertiseWithUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Helmet>
        <title>Advertise With Us | SilverTech Directory</title>
        <meta name="description" content="Stop paying 100% commissions. SilverTech is the zero-commission alternative that puts control and revenue back in your hands." />
        <link rel="canonical" href="https://silvertechdirectory.com/advertise" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Advertise With Us | SilverTech Directory" />
        <meta property="og:description" content="Stop paying 100% commissions. SilverTech is the zero-commission alternative that puts control and revenue back in your hands." />
        <meta property="og:url" content="https://silvertechdirectory.com/advertise" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Advertise With Us | SilverTech Directory" />
        <meta name="twitter:description" content="Stop paying 100% commissions. SilverTech is the zero-commission alternative that puts control and revenue back in your hands." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Stop Paying <span className="text-red-500">100% Commissions</span>.
            <br />
            Stop Losing a Month’s Rent Every Single Move-In.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-10 leading-relaxed">
            Every other referral platform drains senior living like a leech: one resident equals one full month of rent gone forever.
            <br /><br />
            <span className="text-white font-bold">SilverTech doesn’t play that game.</span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-lg font-medium text-primary-400 mb-10">
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> We charge $0 commissions.</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Ever.</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Families connect directly to you.</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> No middleman.</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/claim-business" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-primary-900/50">
              Claim Your Free Profile
            </Link>
            <Link to="/login" className="bg-transparent border-2 border-slate-600 hover:border-white text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors">
              Operator Login
            </Link>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Our Mission</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            To dismantle the predatory commission model that siphons money from operators and hides information from families.
          </h3>
          <p className="text-xl text-slate-600">
            We exist for one reason: to put control, transparency, and revenue back where it belongs — with <span className="font-bold text-slate-900">YOU</span> and the families you serve.
          </p>
        </div>
      </div>

      {/* Why Operators Switch */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Why Operators Switch to SilverTech</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Zero Commissions</h3>
              <p className="text-slate-600 mb-4">
                Stop handing over <span className="font-bold text-red-600">$4,500–$9,000</span> per placement.
              </p>
              <p className="text-slate-600">
                Your first month’s rent stays in <span className="font-bold text-slate-900">YOUR</span> community — not in a referral agency’s pocket.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Direct, Unfiltered Leads</h3>
              <ul className="space-y-2 text-slate-600 mb-4">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-blue-500" /> You get the calls.</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-blue-500" /> You get the emails.</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-blue-500" /> You get the tours.</li>
              </ul>
              <p className="text-slate-600 font-medium">
                We do NOT intercept, gatekeep, redirect, or resell your leads — ever.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Verified Trust Badge</h3>
              <p className="text-slate-600 mb-4">
                Earn a “SilverTech Verified Provider” badge and stand out in the directory.
              </p>
              <p className="text-slate-600">
                Families want honesty. You get rewarded for providing it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">The SilverTech Difference</h2>
          
          <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-red-600 uppercase tracking-wider">Commission Agencies</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-primary-600 uppercase tracking-wider bg-primary-50">SilverTech Directory</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Cost per Move-In</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">1 full month’s rent ($4,500–$9,000)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 bg-primary-50">Flat monthly subscription</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Ownership of Leads</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">They own & gatekeep your leads</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 bg-primary-50">YOU own every lead</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Lead Routing</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Sold to multiple competitors</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 bg-primary-50">Sent only to your community</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Transparency</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Hidden fees & aggressive sales</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 bg-primary-50">Ethical, pressure-free model</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Family Experience</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Sales funnel, call center</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 bg-primary-50">Direct, honest information</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Keep Your Revenue Where It Belongs</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-800 p-8 rounded-2xl border border-red-900/50">
              <h3 className="text-xl font-bold text-red-400 mb-4">Every operator knows the pain:</h3>
              <div className="text-5xl font-bold text-white mb-2">10</div>
              <div className="text-lg text-slate-400 mb-6">move-ins</div>
              <div className="text-4xl font-bold text-red-500 mb-2">=$45,000</div>
              <div className="text-slate-300">gone to agencies that did nothing but intercept your calls.</div>
            </div>

            <div className="bg-primary-900 p-8 rounded-2xl border-2 border-primary-500 shadow-2xl shadow-primary-900/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">WINNER</div>
              <h3 className="text-xl font-bold text-primary-300 mb-4">With SilverTech?</h3>
              <div className="text-5xl font-bold text-white mb-2">10</div>
              <div className="text-lg text-primary-200 mb-6">move-ins</div>
              <div className="text-4xl font-bold text-green-400 mb-2">=$2,400/yr</div>
              <div className="text-primary-100">for the Pro plan — and you keep your first month’s rent every time.</div>
            </div>
          </div>
          
          <div className="mt-12 text-2xl font-bold text-white">
            That’s more than a <span className="text-green-400">400% ROI</span>.
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Take Back Control?</h2>
          <p className="text-xl text-slate-600 mb-10">
            Thousands of operators are switching to the fair, transparent, family-first model.
          </p>
          <Link to="/claim-business" className="inline-flex items-center bg-primary-600 text-white px-10 py-5 rounded-lg text-xl font-bold hover:bg-primary-700 transition-colors shadow-lg">
            Claim Your Free Profile Today <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  );
};
