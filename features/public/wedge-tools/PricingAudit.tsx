import React, { useState } from 'react';
import { LineChart, DollarSign, MapPin, TrendingUp, Download } from 'lucide-react';

const PricingAudit: React.FC = () => {
  const [facilityName, setFacilityName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [careType, setCareType] = useState('Assisted Living');
  const [currentRate, setCurrentRate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock Market Data
  const marketRates: Record<string, number> = {
    'Assisted Living': 5850,
    'Memory Care': 7200,
    'Independent Living': 4500,
    'Nursing Home': 9500,
    'CCRC': 6000
  };

  const getAnalysis = () => {
    const userRate = parseInt(currentRate) || 0;
    const marketRate = marketRates[careType] || 5500;
    const diff = marketRate - userRate;
    const percentDiff = Math.round((Math.abs(diff) / marketRate) * 100);
    const isBelowMarket = diff > 0;
    
    return { userRate, marketRate, diff, percentDiff, isBelowMarket };
  };

  const analysis = getAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Free Pricing Competitive Analysis
          </h1>
          <p className="text-xl text-white/90 mb-8">
            See how your pricing compares to competitors in your market. Get actionable insights in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Your Pricing Report</h2>
                <p className="text-slate-600">Enter your facility details below to receive a comprehensive pricing analysis</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Facility Name
                    </label>
                    <input
                      type="text"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      placeholder="Your Facility Name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ZIP Code
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="94103"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Care Type
                    </label>
                    <select 
                      value={careType}
                      onChange={(e) => setCareType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option>Assisted Living</option>
                      <option>Memory Care</option>
                      <option>Independent Living</option>
                      <option>Nursing Home</option>
                      <option>CCRC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      placeholder="operator@example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Units
                    </label>
                    <input
                      type="number"
                      placeholder="120"
                      className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Average Rate
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="number"
                        value={currentRate}
                        onChange={(e) => setCurrentRate(e.target.value)}
                        placeholder="5200"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    'Analyzing Market Data...'
                  ) : (
                    <>
                      <TrendingUp size={24} />
                      Generate Free Pricing Report
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Audit Complete</h2>
                <p className="text-slate-600">Based on real-time data from {zipCode || 'your area'} for <strong>{careType}</strong></p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Your Average Rate</h3>
                  <p className="text-3xl font-bold text-slate-900">${analysis.userRate.toLocaleString()}</p>
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-1000" 
                      style={{ width: `${Math.min((analysis.userRate / (analysis.marketRate * 1.2)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Market Average</h3>
                  <p className="text-3xl font-bold text-slate-900">${analysis.marketRate.toLocaleString()}</p>
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 transition-all duration-1000" 
                      style={{ width: `${Math.min((analysis.marketRate / (analysis.marketRate * 1.2)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={`border rounded-xl p-6 mb-8 ${analysis.isBelowMarket ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
                <h3 className={`text-lg font-bold mb-2 ${analysis.isBelowMarket ? 'text-primary-900' : 'text-orange-900'}`}>
                  {analysis.isBelowMarket ? 'Recommendation: Opportunity to Increase Rates' : 'Recommendation: Focus on Value & Occupancy'}
                </h3>
                <p className={analysis.isBelowMarket ? 'text-primary-700' : 'text-orange-700'}>
                  {analysis.isBelowMarket ? (
                    <>
                      Your facility is priced <strong>{analysis.percentDiff}% below market average</strong> for {careType} in this area. 
                      You could potentially increase revenue by <strong>${(analysis.diff * 100 * 12).toLocaleString()}/year</strong> (based on 100 units) without losing competitiveness.
                    </>
                  ) : (
                    <>
                      Your facility is priced <strong>{analysis.percentDiff}% above market average</strong>. 
                      To maintain high occupancy, focus your marketing on your premium amenities, higher caregiver ratios, and unique value propositions.
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => alert("Downloading report... (This is a demo feature)")}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Full PDF Report
                </button>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-white border border-slate-300 text-slate-600 py-3 rounded-md font-medium hover:bg-slate-50 transition-colors"
                >
                  Run Another Audit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          What You'll Get in Your Report
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LineChart className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Market Comparison</h3>
            <p className="text-slate-600">
              See how your pricing stacks up against 10+ competitors in your area
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pricing Recommendations</h3>
            <p className="text-slate-600">
              Data-driven suggestions to optimize your rates and increase occupancy
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Downloadable PDF</h3>
            <p className="text-slate-600">
              Professional report you can share with your team and stakeholders
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Optimize Your Pricing?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join 500+ operators who use SilverTech Directory to stay competitive
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-md font-bold text-lg transition-colors"
          >
            Get Started - It's Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingAudit;
