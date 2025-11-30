import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEEDS_DIR = path.join(__dirname, '../src/data/seeds');

/**
 * Flattens Medicare-style JSON files with nested county structure
 * Input format: { state, counties: { [county]: { facilities: [...] } } }
 * Output format: { state, state_code, facilities: [...] }
 */
function flattenMedicareFile(filePath: string): void {
    console.log(`Processing ${path.basename(filePath)}...`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Check if it's already in the correct format
    if (Array.isArray(data) || data.facilities) {
        console.log(`  ✓ Already in correct format, skipping`);
        return;
    }

    // Check if it's Medicare format with counties
    if (!data.counties) {
        console.log(`  ✗ Unknown format, skipping`);
        return;
    }

    const facilities: any[] = [];

    // Extract facilities from all counties
    for (const [countyName, countyData] of Object.entries(data.counties)) {
        const countyFacilities = (countyData as any).facilities;
        if (Array.isArray(countyFacilities)) {
            // Add county info to each facility
            countyFacilities.forEach(f => {
                facilities.push({
                    ...f,
                    // Normalize the structure
                    name: f.name,
                    address_line1: f.address?.street || f.address,
                    city: f.address?.city || f.city,
                    state: f.address?.state || f.state || data.state_code,
                    postal_code: f.address?.zip || f.zip,
                    phone: f.contact?.phone || f.phone,
                    latitude: f.location?.latitude || f.latitude,
                    longitude: f.location?.longitude || f.longitude,
                    license_number: f.federal_provider_number || f.provider_number,
                    capacity: f.facility_details?.certified_beds || f.certified_beds,
                    county: countyName
                });
            });
        }
    }

    console.log(`  → Extracted ${facilities.length} facilities from ${Object.keys(data.counties).length} counties`);

    // Create output object
    const output = {
        state: data.state,
        state_code: data.state_code,
        search_date: data.search_date,
        summary: data.summary,
        facilities: facilities
    };

    // Write back to the same file
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log(`  ✓ Flattened and saved ${path.basename(filePath)}`);
}

function main() {
    const targetFiles = process.argv.slice(2);

    if (targetFiles.length === 0) {
        console.log('Usage: npm run flatten-medicare <file1.json> [file2.json] ...');
        console.log('Example: npm run flatten-medicare iowa_facilities.json kansas_facilities.json');
        process.exit(1);
    }

    console.log('Flattening Medicare data files...\n');

    for (const filename of targetFiles) {
        const filePath = path.join(SEEDS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            console.error(`✗ File not found: ${filename}`);
            continue;
        }

        try {
            flattenMedicareFile(filePath);
        } catch (error) {
            console.error(`✗ Error processing ${filename}:`, error);
        }
    }

    console.log('\nDone!');
}

main();
