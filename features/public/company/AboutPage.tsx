import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Heart, Search, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans">
            <Helmet>
                <title>About Us | SilverTech Directory</title>
                <meta name="description" content="Learn how SilverTech Directory provides transparent, commission-free senior care listings to help families find trustworthy care." />
                <link rel="canonical" href="https://silvertechdirectory.com/about" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content="About Us | SilverTech Directory" />
                <meta property="og:description" content="Learn how SilverTech Directory provides transparent, commission-free senior care listings to help families find trustworthy care." />
                <meta property="og:url" content="https://silvertechdirectory.com/about" />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About Us | SilverTech Directory" />
                <meta name="twitter:description" content="Learn how SilverTech Directory provides transparent, commission-free senior care listings to help families find trustworthy care." />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary-50 via-purple-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-6">
                        <Heart className="w-16 h-16 text-primary-600" />
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 mb-6">
                        The SilverTech Difference: Finding Care You Can Trust
                    </h1>
                    <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
                        The journey to find Memory Care or Assisted Living is often stressful, confusing, and happens during a crisis moment.
                        We know because our founder experienced it firsthand. That's why we built SilverTech Directory—to replace the confusion
                        with <strong className="text-primary-700">radical transparency</strong> and give your family the clear, unbiased information you deserve.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

                {/* Why Trust Us Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-primary-100 rounded-xl">
                            <Shield className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Why You Can Trust Our Listings</h2>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl mb-8">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-red-900 mb-2">The Broken System</h3>
                                <p className="text-red-800 mb-3">
                                    Most online directories are referral agencies. Their main goal is to charge care homes a massive commission—often
                                    <strong className="text-red-900"> $6,000 to $12,000 </strong> for finding one resident.
                                </p>
                                <p className="text-red-800">This creates serious problems:</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <DollarSign className="w-6 h-6 text-slate-600" />
                                <h4 className="font-semibold text-slate-900">Conflict of Interest</h4>
                            </div>
                            <p className="text-slate-700">
                                You don't know if a facility is recommended because it's the best fit, or because it's the one paying the highest commission.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="w-6 h-6 text-slate-600" />
                                <h4 className="font-semibold text-slate-900">Hidden Costs</h4>
                            </div>
                            <p className="text-slate-700">
                                That $7,000 fee is simply passed on to you through higher monthly rates.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-8 rounded-2xl border-2 border-primary-200">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <CheckCircle className="w-8 h-8 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">We Are Different</h3>
                                <p className="text-lg text-slate-700 mb-4">
                                    SilverTech Directory is a <strong className="text-primary-700">commission-free directory</strong>—we charge a simple,
                                    flat subscription fee to facilities instead.
                                </p>
                                <p className="text-lg text-slate-700 font-medium">
                                    This means our incentives are aligned with your safety and well-being, not a commission check.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Full Spectrum Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-purple-100 rounded-xl">
                            <Search className="w-8 h-8 text-purple-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">The Full Spectrum of Care, Clearly Presented</h2>
                    </div>

                    <p className="text-lg text-slate-700 mb-8">
                        We are committed to showing you <strong>all licensed facilities</strong>—from the small, dedicated 6-bed communities
                        to the largest regional operators. We believe you should have access to the entire market, regardless of a facility's marketing budget.
                    </p>

                    <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-slate-900 text-white p-6">
                            <h3 className="text-xl font-bold">When you search our site, you get transparency that others hide:</h3>
                        </div>

                        <div className="divide-y divide-slate-200">
                            <div className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Verified Data</h4>
                                    <p className="text-slate-700">
                                        We show license numbers and provide direct links to official State Inspection Reports and violation history.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Objective Rankings</h4>
                                    <p className="text-slate-700">
                                        Our search results are ranked by distance and quality, and our rankings are <strong>never for sale</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Heart className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Direct Contact</h4>
                                    <p className="text-slate-700">
                                        We provide the facility's direct phone number and website link, so you can connect with them immediately without going through a call center.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How We Keep It Free Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-blue-100 rounded-xl">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">How We Keep the Site Free For You</h2>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
                        <p className="text-lg text-slate-700 mb-4">
                            We utilize modest advertising and partnerships to keep the directory running and commission-free for you.
                            We partner with companies offering essential items like Medical Alert Systems and GPS Trackers.
                        </p>
                        <p className="text-lg text-slate-700 font-medium">
                            However, we <strong className="text-blue-900">never shove ads in your face</strong>, and they do not influence
                            the integrity or objective ranking of your search results.
                        </p>
                    </div>
                </section>

                {/* Closing Statement */}
                <section className="text-center py-12">
                    <div className="inline-block p-6 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl shadow-xl mb-6">
                        <Heart className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                        We are rebuilding the system we wish our own families had.
                    </h2>
                    <p className="text-2xl text-primary-700 font-medium">
                        We are here to help you find care you can trust.
                    </p>
                </section>

            </div>
        </div>
    );
};
