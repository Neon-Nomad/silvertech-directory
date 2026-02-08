import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, DollarSign, Heart, Info, Search, XCircle } from 'lucide-react';
import { useJsonLd } from '@/src/hooks/useJsonLd';

export const HonestCarePage: React.FC = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do senior placement referral services make money?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Many referral services charge senior living communities a commission of up to 100% of the first month's rent for every resident they place. This financial incentive can influence which facilities they recommend to families."
        }
      },
      {
        "@type": "Question",
        "name": "Why does commission-based placement matter?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "When a service is paid by commission, they may prioritize partners that pay the highest fees, hide budget-friendly options that don't pay, and pressure families to make quick decisions."
        }
      },
      {
        "@type": "Question",
        "name": "Is SilverTech Directory free for families?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, SilverTech Directory is completely free for families to use. We do not charge families any fees to search, compare, or contact facilities."
        }
      },
      {
        "@type": "Question",
        "name": "How does SilverTech Directory choose which facilities to list?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We list every licensed assisted living and memory care community we can find, regardless of whether they pay us. Our goal is to provide a complete and unbiased directory."
        }
      },
      {
        "@type": "Question",
        "name": "Can I contact facilities directly through SilverTech Directory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Unlike other platforms that hide contact info to act as middlemen, we provide direct phone numbers and website links so you can speak directly with the communities."
        }
      }
    ]
  };

  useJsonLd(faqSchema);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Helmet>
        <title>Why Transparency Matters | SilverTech Directory</title>
        <meta name="description" content="Learn how senior care referral services really work. SilverTech offers 100% transparency, zero commissions, and direct contact with communities." />
        <link rel="canonical" href="https://silvertechdirectory.com/honest-care" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Why Transparency Matters | SilverTech Directory" />
        <meta property="og:description" content="Learn how senior care referral services really work. SilverTech offers 100% transparency, zero commissions, and direct contact with communities." />
        <meta property="og:url" content="https://silvertechdirectory.com/honest-care" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Why Transparency Matters | SilverTech Directory" />
        <meta name="twitter:description" content="Learn how senior care referral services really work. SilverTech offers 100% transparency, zero commissions, and direct contact with communities." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Top Banner */}
      <div className="bg-primary-600 text-white py-3 px-4 text-center font-medium">
        <p>
          No commissions. No sales pressure. No hidden partners. 
          <span className="opacity-90 ml-1">Just unbiased senior care information — for families, not sales funnels.</span>
        </p>
      </div>

      {/* Hero Section */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Why Transparency Matters in Senior Care
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Choosing senior care is one of the hardest decisions a family will ever make. Unfortunately, many “free” senior placement services don’t clearly explain how they make money — or how those financial incentives influence the recommendations families receive.
          </p>
          <div className="mt-8 p-4 bg-primary-50 border border-primary-100 rounded-lg inline-block">
            <p className="text-primary-800 font-medium">
              This page exists for one purpose: to help you make informed decisions with no pressure and no hidden agendas.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* How Referral Services Work */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            How Referral Services Really Work
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-lg text-slate-700 mb-6">
              Many large placement companies advertise that their service is “free.” Technically, that’s true — but the fine print matters.
            </p>
            <p className="text-lg text-slate-700 mb-6 font-medium">
              These companies receive a commission of up to 100 percent of your loved one’s first month of rent from the facility they recommend.
            </p>
            
            <h3 className="font-bold text-slate-900 mb-4">This means:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                <span className="text-slate-700">They only recommend communities that pay them</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                <span className="text-slate-700">They may not show you options that don’t participate</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                <span className="text-slate-700">They earn more when you choose the most expensive facility</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                <span className="text-slate-700">Your “free” advice is tied to the commission structure, not always your needs</span>
              </li>
            </ul>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-slate-600 italic">
                This isn’t illegal. But families rarely know this is how it works.
              </p>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Why This Matters for Your Loved One</h2>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
            <p className="text-lg text-slate-700 mb-6">
              When a company only gets paid if you choose a participating community, their incentives shift:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Biased Recommendations</h3>
                <p className="text-slate-600">Recommendations favor “paying partners” over the best care fit.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Hidden Options</h3>
                <p className="text-slate-600">Budget-friendly or smaller homes may never be shown to you.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Harder Research</h3>
                <p className="text-slate-600">Independent research becomes harder when information is gatekept.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Incomplete Picture</h3>
                <p className="text-slate-600">You may never see all your real options. Families deserve the full picture.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SilverTech Difference */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary-600" />
            What Makes SilverTech Different
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            SilverTech Directory was created for families who want honesty, clarity, and control.
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">1</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Commissions</h3>
                <p className="text-slate-600">We do not receive a percentage of your loved one’s rent. This removes the pressure, the sales tactics, and the financial incentives.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">2</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Direct Contact</h3>
                <p className="text-slate-600">You contact communities directly. No middlemen. No phone trees. No rerouted calls.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">3</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Full Transparency</h3>
                <p className="text-slate-600">We list every licensed community — not just the ones who pay.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">4</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Clear Pricing Information</h3>
                <p className="text-slate-600">Whenever possible, we show price transparency so you can quickly compare options.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">5</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Sales Pressure</h3>
                <p className="text-slate-600">We never share, sell, or route your contact information to multiple facilities. Your family stays in control.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How We Compare</h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
            SilverTech Directory is built for families, not commissions.
          </p>
          
          <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">Referral Agencies</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-primary-600 uppercase tracking-wider bg-primary-50">SilverTech Directory</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Commission Fees</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">90 to 120 percent</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold bg-primary-50">0 percent</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Shows All Facilities</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600"><XCircle className="w-5 h-5 text-red-400 inline mr-1" /> No</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium bg-primary-50"><CheckCircle className="w-5 h-5 text-green-500 inline mr-1" /> Yes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Direct Contact</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600"><XCircle className="w-5 h-5 text-red-400 inline mr-1" /> No</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium bg-primary-50"><CheckCircle className="w-5 h-5 text-green-500 inline mr-1" /> Yes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Budget-Friendly Options</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Not guaranteed</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium bg-primary-50">Always included</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Sales Pressure</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">High</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold bg-primary-50">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* How We Make Money */}
        <section className="bg-slate-900 text-white p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">How We Make Money (So You Always Know the Truth)</h2>
          <p className="text-lg text-slate-300 mb-6">
            We charge communities a simple, flat monthly fee to enhance their listings.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-center mb-8">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <span className="block text-red-400 font-bold text-xl mb-1">No</span>
              <span className="text-slate-400">Commissions</span>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <span className="block text-red-400 font-bold text-xl mb-1">No</span>
              <span className="text-slate-400">Placement Fees</span>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <span className="block text-red-400 font-bold text-xl mb-1">No</span>
              <span className="text-slate-400">Hidden Contracts</span>
            </div>
          </div>
          <p className="text-center text-primary-300 font-medium text-lg">
            This keeps our incentives aligned with YOUR best interests — not theirs.
          </p>
        </section>

        {/* Conclusion / CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Your Loved One Deserves Honest Information</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Our mission is simple: Help families make confident decisions without pressure, confusion, or hidden financial motives.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 text-left">
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> State Guides</div>
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> City Pages</div>
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> Community Listings</div>
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> Pricing</div>
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> Inspection Info</div>
            <div className="flex items-center gap-2 text-slate-700"><CheckCircle className="w-5 h-5 text-primary-500" /> Memory Care Resources</div>
          </div>

          <div className="bg-primary-50 p-8 rounded-2xl border border-primary-100 mb-12">
            <h3 className="text-xl font-bold text-primary-900 mb-4">Find Senior Care Without Pressure</h3>
            <p className="text-primary-800 text-lg mb-6">
              Search your state to see every licensed assisted living, memory care, and retirement community — with no commissions, no shared leads, and no hidden filters.
            </p>
            <Link to="/search" className="inline-flex items-center bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-primary-700 transition-colors shadow-lg">
              Browse Your State <Heart className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
