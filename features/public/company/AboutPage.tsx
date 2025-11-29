import React from 'react';
import { Helmet } from 'react-helmet-async';

export const AboutPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>About Us | SilverTech Directory</title>
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-light text-slate-900 mb-6">About SilverTech Directory</h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                    SilverTech Directory is the authoritative vertical operating system for the senior living industry.
                    We connect families with verified care providers and help operators manage their digital presence.
                </p>
            </div>
        </>
    );
};
