import React from 'react';
import { Helmet } from 'react-helmet-async';

export const ContactPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Contact Us | SilverTech Directory</title>
                <meta name="description" content="Contact SilverTech Directory for general inquiries. Reach our team directly by email." />
                <link rel="canonical" href="https://silvertechdirectory.com/contact" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content="Contact Us | SilverTech Directory" />
                <meta property="og:description" content="Contact SilverTech Directory for general inquiries. Reach our team directly by email." />
                <meta property="og:url" content="https://silvertechdirectory.com/contact" />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Contact Us | SilverTech Directory" />
                <meta name="twitter:description" content="Contact SilverTech Directory for general inquiries. Reach our team directly by email." />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-light text-slate-900 mb-6">Contact Us</h1>
                <p className="text-xl text-slate-600 mb-8">
                    We'd love to hear from you. Please reach out to our team for any inquiries.
                </p>

                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200">
                    <h2 className="text-2xl font-light text-slate-900 mb-4">General Inquiries</h2>
                    <a href="mailto:andrew@silvertechdirectory.com" className="text-primary-600 hover:underline text-lg">
                        andrew@silvertechdirectory.com
                    </a>
                </div>
            </div>
        </>
    );
};
