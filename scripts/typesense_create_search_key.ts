import 'dotenv/config';
import Typesense from 'typesense';

const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = Number(process.env.TYPESENSE_PORT || 443);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY;

if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
  console.error('Missing Typesense credentials. Set TYPESENSE_HOST and TYPESENSE_ADMIN_API_KEY.');
  process.exit(1);
}

const typesense = new Typesense.Client({
  nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: TYPESENSE_PROTOCOL }],
  apiKey: TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 10
});

const run = async () => {
  const key = await typesense.keys().create({
    description: 'Search-only key for facilities search',
    actions: ['documents:search'],
    collections: ['facilities']
  });
  console.log('SEARCH_ONLY_API_KEY=', key.value);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
