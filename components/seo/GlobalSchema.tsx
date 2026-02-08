import React from 'react';
import { useJsonLd } from '@/src/hooks/useJsonLd';

export const GlobalSchema: React.FC = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SilverTech Directory",
    "url": "https://silvertechdirectory.com/",
    "logo": "https://silvertechdirectory.com/logo.png"
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SilverTech Directory",
    "url": "https://silvertechdirectory.com/",
    "publisher": {
      "@type": "Organization",
      "name": "SilverTech Directory",
      "url": "https://silvertechdirectory.com/",
      "logo": "https://silvertechdirectory.com/logo.png"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://silvertechdirectory.com/search?location={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  useJsonLd(organizationSchema);
  useJsonLd(websiteSchema);

  return null;
};
