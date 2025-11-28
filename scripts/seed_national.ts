import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NATIONAL_FILE = path.join(__dirname, '../assisted_living_facilities_national.json');

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Authority Mapping
const AUTHORITIES: Record<string, string> = {
    'CO': 'Colorado Department of Public Health and Environment',
    'AZ': 'Arizona Department of Health Services',
    'FL': 'Florida Agency for Health Care Administration',
    'TX': 'Texas Health and Human Services',
    'PA': 'Pennsylvania Department of Human Services',
    'AK': 'Alaska Department of Health',
    'NC': 'NC Department of Health and Human Services',
    'IL': 'Illinois Department of Public Health',
    'NY': 'New York State Department of Health',
    'AL': 'Alabama Department of Public Health',
    'HI': 'Hawaii Department of Health',
    '': 'Florida Agency for Health Care Administration'
};

async function seedNational() {
    const args = process.argv.slice(2);
    const targetStates = args.length > 0 ? args.map(s => s.toUpperCase()) : null;

    if (!fs.existsSync(NATIONAL_FILE)) {
        console.error(`National data file not found at ${NATIONAL_FILE}`);
        process.exit(1);
    }

    console.log('Reading national data file...');
    const rawData = fs.readFileSync(NATIONAL_FILE, 'utf-8');
    const nationalData = JSON.parse(rawData);

    // Get states to process
    const availableStates = Object.keys(nationalData);
    const statesToProcess = targetStates
        ? availableStates.filter(s => targetStates.includes(s) || (targetStates.includes('FL') && s === ''))
        : availableStates;

    console.log(`Processing states: ${statesToProcess.join(', ')}`);

    for (const stateKey of statesToProcess) {
        const facilities = nationalData[stateKey];
        const stateCode = stateKey === '' ? 'FL' : stateKey;

        console.log(`Processing ${stateCode} (${facilities.length} facilities)...`);

        const batchSize = 50;
        for (let i = 0; i < facilities.length; i += batchSize) {
            const batch = facilities.slice(i, i + batchSize);
            const upsertBatch = [];
            const licensingBatch: any[] = [];

            for (const facility of batch) {
                if (!facility.name) continue;

                const dbFacility = {
                    name: facility.name,
                    address_line1: facility.address,
                    city: facility.city,
                    state: facility.state || stateCode,
                    postal_code: facility.zip,
                    phone: facility.phone,
                    latitude: facility.latitude ? parseFloat(facility.latitude) : null,
                    longitude: facility.longitude ? parseFloat(facility.longitude) : null
                };

                upsertBatch.push(dbFacility);
            }

            if (upsertBatch.length > 0) {
                for (const f of upsertBatch) {
                    // Try to find existing
                    const { data: existing } = await supabase
                        .from('facilities')
                        .select('id')
                        .eq('name', f.name)
                        .eq('address_line1', f.address_line1)
                        .eq('city', f.city)
                        .eq('state', f.state)
                        .maybeSingle();

                    let facilityId;

                    if (existing) {
                        facilityId = existing.id;
                        await supabase
                            .from('facilities')
                            .update(f)
                            .eq('id', facilityId);
                    } else {
                        const { data: inserted, error } = await supabase
                            .from('facilities')
                            .insert(f)
                            .select()
                            .single();

                        if (error) {
                            console.error(`Error inserting ${f.name}:`, error.message);
                            continue;
                        }
                        facilityId = inserted.id;
                    }

                    // Handle Licensing
                    const original = batch.find((o: any) => o.name === f.name && o.address === f.address_line1);
                    if (original && original.license_number) {
                        licensingBatch.push({
                            facility_id: facilityId,
                            license_number: original.license_number,
                            bed_capacity: original.capacity ? parseInt(original.capacity) : 0,
                            authority: AUTHORITIES[stateCode] || 'State Licensing Board'
                        });
                    }
                }
            }

            // Upsert Licensing
            if (licensingBatch.length > 0) {
                // Deduplicate by license_number
                const uniqueLicensing = Array.from(new Map(licensingBatch.map(item => [item.license_number, item])).values());

                const { error: licenseError } = await supabase
                    .from('facility_licensing')
                    .upsert(uniqueLicensing, { onConflict: 'license_number' });

                if (licenseError) {
                    console.error('Error upserting licenses:', licenseError.message);
                }
            }
        }
        console.log(`Finished ${stateCode}`);
    }
}

seedNational();
