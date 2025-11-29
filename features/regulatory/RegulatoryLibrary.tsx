import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '@/src/data/states';

export const RegulatoryLibrary: React.FC = () => {
    // Group states by first letter
    const groupedStates = ALL_STATES.reduce((acc, state) => {
        const letter = state.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(state);
        return acc;
    }, {} as Record<string, typeof ALL_STATES>);

    const letters = Object.keys(groupedStates).sort();

    return (
        <>
            <Helmet>
                <title>Regulatory Library | SilverTech Directory</title>
                <meta
                    name="description"
                    content="The complete national database of senior living regulations, Medicaid programs, and licensing authorities for all 50 states."
                />
            </Helmet>

            <div className="bg-white min-h-screen pb-20">
                {/* Hero Section */}
                <div className="bg-slate-50 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                        <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
                            Regulatory Library
                        </h1>
                        <p className="text-xl text-slate-600 max-w-3xl font-light leading-relaxed">
                            The authoritative master index for all US senior living regulations,
                            Medicaid programs, and licensing authorities. Select a state to view
                            its consolidated regulatory hub.
                        </p>
                    </div>
                </div>

                {/* State Index */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                        {letters.map((letter) => (
                            <div key={letter} className="space-y-6">
                                <h2 className="text-2xl font-light text-slate-400 border-b border-slate-100 pb-2">
                                    {letter}
                                </h2>
                                <ul className="space-y-3">
                                    {groupedStates[letter].map((state) => (
                                        <li key={state.slug}>
                                            <Link
                                                to={`/states/${state.slug}/regulatory`}
                                                className="text-lg text-slate-900 hover:text-primary-600 transition-colors block py-1"
                                            >
                                                {state.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
