import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../hospitals_by_state_city.json');
const outputDir = path.join(__dirname, '../public/data/hospitals');

async function splitHospitals() {
    try {
        console.log('Reading input file...');
        if (!fs.existsSync(inputFile)) {
            console.error(`Input file not found: ${inputFile}`);
            process.exit(1);
        }

        // Using stream-json is overkill if we can just load it once since we are running this locally
        // and the user said "The JSON you uploaded is PERFECT as-is".
        // However, if it's truly massive, we might want to stream.
        // Given the file size seen earlier (~2.3MB), fs.readFileSync is perfectly fine.
        // Wait, the user said "the new json is to large for you to ingest" initially, but 2.3MB is tiny.
        // Maybe they meant "too large to paste into the chat context" or "too large for a single DB insert query".
        // 2.3MB is trivial for Node.js memory.

        const rawData = fs.readFileSync(inputFile, 'utf8');
        const data = JSON.parse(rawData);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`Processing ${Object.keys(data).length} states...`);

        for (const [state, cities] of Object.entries(data)) {
            const stateFile = path.join(outputDir, `${state}.json`);
            // We want to keep the structure: { "CITY": [ ...hospitals ] }
            // The input is { "AK": { "ANCHORAGE": [...] }, ... }
            // So 'cities' is exactly what we want to save.

            fs.writeFileSync(stateFile, JSON.stringify(cities, null, 2));
            console.log(`Created ${state}.json`);
        }

        console.log('Done! All states split successfully.');

    } catch (err) {
        console.error('Error:', err);
    }
}

splitHospitals();
