import Typesense from 'typesense';

const host = import.meta.env.VITE_TYPESENSE_HOST;
const port = Number(import.meta.env.VITE_TYPESENSE_PORT || 443);
const protocol = import.meta.env.VITE_TYPESENSE_PROTOCOL || 'https';
const apiKey = import.meta.env.VITE_TYPESENSE_API_KEY;

export const hasTypesense = Boolean(host && apiKey);

export const typesenseClient = hasTypesense
  ? new Typesense.Client({
      nodes: [{ host, port, protocol }],
      apiKey,
      connectionTimeoutSeconds: 5
    })
  : null;
