import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Moved Supabase init to main execution block to allow testing


const dataFile = path.join(__dirname, '../src/data/facilities.json');

export function parseAddress(addressStr) {
    // Format: "34400 MISSION BLVD., UNION CITY, CA 94587"
    // Regex to capture: (Address), (City), (State) (Zip)
    // Note: Sometimes address has commas.
    // Strategy: Split by comma. Last part is usually "State Zip". Second to last is City. Rest is Address.

    if (!addressStr) return { address_line1: null, city: null, state: 'CA', postal_code: null };

    const parts = addressStr.split(',').map(p => p.trim());

    if (parts.length < 2) {
        return { address_line1: addressStr, city: null, state: 'CA', postal_code: null };
    }

    // Last part: "CA 94587"
    const stateZipPart = parts[parts.length - 1];
    const stateZipMatch = stateZipPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);

    let state = 'CA';
    let postal_code = null;

    if (stateZipMatch) {
        state = stateZipMatch[1];
        postal_code = stateZipMatch[2];
    }

    // Second to last part: City
    const city = parts[parts.length - 2];

    // Everything else: Address Line 1
    const address_line1 = parts.slice(0, parts.length - 2).join(', ');

    return { address_line1, city, state, postal_code };
}

async function uploadData(supabase) {
    try {
        if (!fs.existsSync(dataFile)) {
            console.error('Data file not found:', dataFile);
            process.exit(1);
        }
        const rawData = fs.readFileSync(dataFile, 'utf8');
        const facilities = JSON.parse(rawData);

        console.log(`Processing ${facilities.length} California facilities...`);

        // Process in batches to avoid overwhelming connections, but we need sequential logic for upserts
        // We'll do sequential for safety and clarity as requested.

        let count = 0;
        for (const f of facilities) {
            count++;
            if (count % 100 === 0) console.log(`Processed ${count}/${facilities.length}...`);

            // Map to strict structure
            const addr = parseAddress(f.address);

            const strictData = {
                name: f.name,
                address_line1: addr.address_line1,
                address_line2: null,
                city: addr.city,
                state: addr.state,
                postal_code: addr.postal_code,
                phone: f.phone,
                license: {
                    number: f.id, // Assuming ID is license number
                    expiration: null, // Not available in source
                    beds: f.capacity || 0
                }
            };

            // 1. Check if license exists
            const { data: existingLicense, error: licenseError } = await supabase
                .from('facility_licensing')
                .select('facility_id, id')
                .eq('license_number', strictData.license.number)
                .single();

            if (licenseError && licenseError.code !== 'PGRST116') {
                console.error(`Error checking license ${strictData.license.number}:`, licenseError);
                continue;
            }

            let facilityId;

            if (existingLicense) {
                // UPDATE existing
                facilityId = existingLicense.facility_id;

                await supabase.from('facilities').update({
                    name: strictData.name,
                    address_line1: strictData.address_line1,
                    address_line2: strictData.address_line2,
                    city: strictData.city,
                    state: strictData.state,
                    postal_code: strictData.postal_code,
                    phone: strictData.phone,
                }).eq('id', facilityId);

                await supabase.from('facility_licensing').update({
                    bed_capacity: strictData.license.beds,
                    updated_at: new Date().toISOString()
                }).eq('id', existingLicense.id);

            } else {
                // INSERT new
                const { data: newFacility, error: insertError } = await supabase
                    .from('facilities')
                    .insert({
                        name: strictData.name,
                        address_line1: strictData.address_line1,
                        address_line2: strictData.address_line2,
                        city: strictData.city,
                        state: strictData.state,
                        postal_code: strictData.postal_code,
                        phone: strictData.phone
                    })
                    .select('id')
                    .single();

                if (insertError) {
                    console.error(`Error inserting facility ${strictData.name}:`, insertError);
                    continue;
                }

                facilityId = newFacility.id;

                const { error: licenseInsertError } = await supabase
                    .from('facility_licensing')
                    .insert({
                        facility_id: facilityId,
                        license_number: strictData.license.number,
                        bed_capacity: strictData.license.beds,
                        authority: 'California Department of Social Services' // Override default
                    });

                if (licenseInsertError) {
                    console.error(`Error inserting license for ${strictData.name}:`, licenseInsertError);
                }
            }
        }

        console.log('California Upload complete!');

    } catch (err) {
        console.error('Error:', err);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Read .env file manually
    const envPath = path.join(__dirname, '../.env');
    let env = {};
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                env[key] = value;
            }
        });
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
        console.log('NOTE: You must use the SERVICE_KEY for this script to bypass RLS and perform admin writes.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pass supabase client to uploadData
    uploadData(supabase);
}
