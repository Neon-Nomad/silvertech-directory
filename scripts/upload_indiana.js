import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const dataFile = path.join(__dirname, '../src/data/indiana_facilities.json');

async function uploadData() {
    try {
        if (!fs.existsSync(dataFile)) {
            console.error('Data file not found:', dataFile);
            process.exit(1);
        }
        const rawData = fs.readFileSync(dataFile, 'utf8');
        const facilities = JSON.parse(rawData);

        console.log(`Processing ${facilities.length} facilities...`);

        for (const f of facilities) {
            // 1. Check if license exists
            const { data: existingLicense, error: licenseError } = await supabase
                .from('facility_licensing')
                .select('facility_id, id')
                .eq('license_number', f.license.number)
                .single();

            if (licenseError && licenseError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error(`Error checking license ${f.license.number}:`, licenseError);
                continue;
            }

            let facilityId;

            if (existingLicense) {
                // UPDATE existing
                facilityId = existingLicense.facility_id;
                // console.log(`Updating facility ${f.name} (ID: ${facilityId})`);

                // Update Facility
                await supabase.from('facilities').update({
                    name: f.name,
                    address_line1: f.address_line1,
                    address_line2: f.address_line2,
                    city: f.city,
                    state: f.state,
                    postal_code: f.postal_code,
                    phone: f.phone,
                    // latitude/longitude would be updated here if we had them
                }).eq('id', facilityId);

                // Update License
                await supabase.from('facility_licensing').update({
                    license_expiration: f.license.expiration,
                    bed_capacity: f.license.beds,
                    updated_at: new Date().toISOString()
                }).eq('id', existingLicense.id);

            } else {
                // INSERT new
                // console.log(`Inserting new facility ${f.name}`);

                // Insert Facility
                const { data: newFacility, error: insertError } = await supabase
                    .from('facilities')
                    .insert({
                        name: f.name,
                        address_line1: f.address_line1,
                        address_line2: f.address_line2,
                        city: f.city,
                        state: f.state,
                        postal_code: f.postal_code,
                        phone: f.phone
                    })
                    .select('id')
                    .single();

                if (insertError) {
                    console.error(`Error inserting facility ${f.name}:`, insertError);
                    continue;
                }

                facilityId = newFacility.id;

                // Insert License
                const { error: licenseInsertError } = await supabase
                    .from('facility_licensing')
                    .insert({
                        facility_id: facilityId,
                        license_number: f.license.number,
                        license_expiration: f.license.expiration,
                        bed_capacity: f.license.beds
                    });

                if (licenseInsertError) {
                    console.error(`Error inserting license for ${f.name}:`, licenseInsertError);
                }
            }
        }

        console.log('Upload complete!');

    } catch (err) {
        console.error('Error:', err);
    }
}

uploadData();
