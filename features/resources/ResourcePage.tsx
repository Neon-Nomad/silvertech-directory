import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

export const ResourcePage: React.FC = () => {
    const { type } = useParams<{ type: string }>();

    const titles: Record<string, string> = {
        medicaid: 'Medicaid Guides',
        veterans: 'Veterans Benefits'
    };

    const title = titles[type || ''] || 'Resource Guide';

    return (
        <>
            <Helmet>
                <title>{title} | SilverTech Directory</title>
                <meta name="description" content={`National ${title.toLowerCase()} resources with guidance for families seeking senior care.`} />
                <link rel="canonical" href={`https://silvertechdirectory.com/resources/${type || ''}`.replace(/\/$/, '')} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content={`${title} | SilverTech Directory`} />
                <meta property="og:description" content={`National ${title.toLowerCase()} resources with guidance for families seeking senior care.`} />
                <meta property="og:url" content={`https://silvertechdirectory.com/resources/${type || ''}`.replace(/\/$/, '')} />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${title} | SilverTech Directory`} />
                <meta name="twitter:description" content={`National ${title.toLowerCase()} resources with guidance for families seeking senior care.`} />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-light text-slate-900 mb-6">{title}</h1>
                <p className="text-xl text-slate-600 mb-8">
                    This is a national guide. For state-specific information, please visit our Regulatory Library.
                </p>
                <Link to="/regulations/" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors">
                    Go to Regulations
                </Link>
            </div>
        </>
    );
};
