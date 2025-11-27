import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, Users, ShieldCheck, XCircle, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

export const AdvertiseWithUs: React.FC = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate Graph Bars
    if (graphRef.current) {
      const bars = graphRef.current.querySelectorAll('.graph-bar');
      gsap.fromTo(bars, 
        { scaleY: 0 },
        { 
          scaleY: 1, 
          duration: 1.5, 
          stagger: 0.2, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: graphRef.current,
            start: "top 80%",
          }
        }
      );
    }

    // Animate Comparison Items
    if (comparisonRef.current) {
      const items = comparisonRef.current.querySelectorAll('.comparison-item');
      gsap.fromTo(items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: comparisonRef.current,
            start: "top 75%",
          }
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Advertise With Us | SilverTech Directory</title>
        <meta name="description" content="Join the ethical alternative to big referral agencies. Direct leads, zero commissions, and transparent pricing for senior living operators." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-32 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Stop Paying <span className="text-red-500">100%</span> Commissions
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12">
            Join the ethical revolution in senior care referrals. We believe in direct connections, transparent pricing, and keeping money in care—not in middleman pockets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/claim-business">
              <Button size="lg" className="text-lg px-8 py-4 bg-primary-600 hover:bg-primary-500">
                Claim Your Profile
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline-white" size="lg" className="text-lg px-8 py-4">
                Operator Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Our Mission</h2>
            <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
              To dismantle the predatory "Place for Mom" model that drains resources from care facilities. We empower operators with direct leads and fair, flat-fee pricing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Zero Commissions</h3>
              <p className="text-slate-600">
                Keep your first month's rent. We charge a simple, low monthly subscription. No hidden fees, ever.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Direct Connections</h3>
              <p className="text-slate-600">
                Families contact you directly. We don't gatekeep phone numbers or shadow-ban your website.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Verified Trust</h3>
              <p className="text-slate-600">
                Stand out with our "Verified Partner" badge. We vet facilities to ensure families find safe, quality care.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Us vs Them Comparison */}
      <div className="py-24 bg-white" ref={comparisonRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">The SilverTech Difference</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Them */}
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 comparison-item">
              <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                The "Big Guys"
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <span>Charge 100-120% of first month's rent</span>
                </li>
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <span>Gatekeep family contact info</span>
                </li>
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <span>Sell leads to 5+ competitors simultaneously</span>
                </li>
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <span>Aggressive sales tactics with families</span>
                </li>
              </ul>
            </div>

            {/* Us */}
            <div className="bg-green-50 rounded-3xl p-8 border border-green-100 comparison-item shadow-lg scale-105 transform">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                SilverTech Directory
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Flat monthly subscription ($0 commissions)</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Direct phone calls & website clicks</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Exclusive leads (families choose YOU)</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Empathetic, pressure-free family support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Graph */}
      <div className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">Maximize Your ROI</h2>
              <p className="text-xl text-slate-400 mb-8">
                See how your marketing budget performs with SilverTech compared to traditional referral agencies. Keep your revenue where it belongs—in your facility.
              </p>
              <div className="flex items-center gap-4 text-green-400 mb-8">
                <TrendingUp className="w-8 h-8" />
                <span className="text-2xl font-bold">+400% ROI vs Competitors</span>
              </div>
              <Link to="/claim-business">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Start Growing Today <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 w-full max-w-lg" ref={graphRef}>
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-medium mb-8 text-center">Annual Cost for 10 Move-ins</h3>
                <div className="flex items-end justify-around h-64 gap-8">
                  <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-red-400 font-bold">$45,000</span>
                    <div className="w-full bg-red-500/20 rounded-t-lg relative group h-full graph-bar" style={{ height: '100%' }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500 rounded-t-lg transition-all duration-1000 h-full opacity-80 group-hover:opacity-100"></div>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Referral Agencies</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-green-400 font-bold">$2,400</span>
                    <div className="w-full bg-green-500/20 rounded-t-lg relative group h-full graph-bar" style={{ height: '15%' }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg transition-all duration-1000 h-full opacity-80 group-hover:opacity-100"></div>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">SilverTech</span>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-6">
                  *Based on avg. rent of $4,500/mo and 100% commission fee vs. SilverTech Pro plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Take Control?</h2>
          <p className="text-xl text-primary-100 mb-10">
            Join thousands of operators who have switched to the fair, transparent way to grow their census.
          </p>
          <Link to="/claim-business">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-slate-100 text-lg px-12 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
              Claim Your Free Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
