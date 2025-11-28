import { useEffect } from 'react';

export const useJsonLd = (schema: object | null | undefined) => {
    useEffect(() => {
        if (!schema) return;

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        script.dataset.testid = 'json-ld'; // For easier testing/debugging

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [schema]);
};
