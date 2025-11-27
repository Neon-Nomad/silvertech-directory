import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseIndianaData(rawData) {
    const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const facilities = [];
    let buffer = [];

    function processBuffer(buf) {
        if (buf.length < 5) return;

        const facility = {
            name: "",
            address_line1: "",
            address_line2: null,
            city: "",
            state: "IN",
            postal_code: "",
            phone: "",
            latitude: null,
            longitude: null,
            license: {
                number: "",
                expiration: "",
                beds: 0
            }
        };

        // Name is usually the first line
        facility.name = buf[0];

        // Address is usually the second line
        facility.address_line1 = buf[1];

        // City, State Zip is third line
        const cityStateZip = buf[2];
        const cityMatch = cityStateZip.match(/^(.*),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)$/);
        if (cityMatch) {
            facility.city = cityMatch[1];
            facility.state = cityMatch[2];
            facility.postal_code = cityMatch[3];
        } else {
            const parts = cityStateZip.split(',');
            if (parts.length >= 2) {
                facility.city = parts[0].trim();
                const stateZip = parts[1].trim().split(' ');
                facility.state = stateZip[0];
                facility.postal_code = stateZip[1];
            }
        }

        // Extract other fields
        buf.forEach(l => {
            if (l.startsWith('Tel:')) facility.phone = l.replace('Tel:', '').trim();
            if (l.startsWith('License Number :')) facility.license.number = l.replace('License Number :', '').trim();
            if (l.startsWith('Lic Expire Date:')) {
                const dateStr = l.replace('Lic Expire Date:', '').trim();
                // Convert MM/DD/YYYY to YYYY-MM-DD
                const [month, day, year] = dateStr.split('/');
                if (month && day && year) {
                    facility.license.expiration = `${year}-${month}-${day}`;
                }
            }
            if (l.startsWith('Bed Capacity:')) facility.license.beds = parseInt(l.replace('Bed Capacity:', '').trim(), 10);
        });

        // Validate required fields (Name and License Number are critical for upsert)
        if (facility.name && facility.license.number) {
            facilities.push(facility);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.endsWith('RES')) {
            buffer.push(line);
            processBuffer(buffer);
            buffer = [];
        } else {
            buffer.push(line);
        }
    }

    return facilities;
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const inputFile = path.join(__dirname, '../indiana.json');
        const outputFile = path.join(__dirname, '../src/data/indiana_facilities.json');

        const rawData = fs.readFileSync(inputFile, 'utf8');
        const facilities = parseIndianaData(rawData);

        // Ensure directory exists
        const dir = path.dirname(outputFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputFile, JSON.stringify(facilities, null, 2));
        console.log(`Successfully parsed ${facilities.length} facilities to ${outputFile}`);

    } catch (err) {
        console.error('Error parsing file:', err);
    }
}
