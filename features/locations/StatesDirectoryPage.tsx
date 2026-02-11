import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const StatesDirectoryPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-warm-gray">
            <Helmet>
                <title>Browse Senior Living by State | SilverTech Directory</title>
                <meta name="description" content="Find senior living and assisted care facilities across all 50 states. Browse our comprehensive directory to find care near you." />
                <link rel="canonical" href="https://silvertechdirectory.com/states" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content="Browse Senior Living by State | SilverTech Directory" />
                <meta property="og:description" content="Find senior living and assisted care facilities across all 50 states. Browse our comprehensive directory to find care near you." />
                <meta property="og:url" content="https://silvertechdirectory.com/states" />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Browse Senior Living by State | SilverTech Directory" />
                <meta name="twitter:description" content="Find senior living and assisted care facilities across all 50 states. Browse our comprehensive directory to find care near you." />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>

            {/* Hero Section */}
            <div className="bg-white text-slate-900 py-20 px-4 border-b border-slate-200">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-warm-gray rounded-xl mb-6 border border-slate-200">
                        <MapPin className="w-8 h-8 text-slate-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Browse by State</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Explore senior living options, regulatory information, and care resources across the United States.
                    </p>
                </div>
            </div>

            {/* States Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {US_STATES.map((state) => (
                        <Link
                            key={state}
                            to={`/states/${state.toLowerCase().replace(/ /g, '-')}`}
                            className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-slate-600 transition-colors"></div>
                                <span className="font-medium text-slate-700 group-hover:text-slate-900 text-lg">{state}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transform group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
