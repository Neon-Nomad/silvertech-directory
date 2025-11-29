import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.join(__dirname, '../src/data/seeds');

async function seedFacilities() {
    console.log(`Scanning seeds directory: ${SEEDS_DIR}`);

    if (!fs.existsSync(SEEDS_DIR)) {
        console.error('Seeds directory not found!');
        return;
    }

    const targetState = process.argv[2];
    const files = fs.readdirSync(SEEDS_DIR).filter(file => file.endsWith('.json') && (!targetState || file.includes(targetState)));

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const filePath = path.join(SEEDS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        let facilities = [];

        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                facilities = parsed;
            } else if (parsed.facilities && Array.isArray(parsed.facilities)) {
                facilities = parsed.facilities;
            } else {
                console.error(`Invalid format in ${file}: Expected array or object with 'facilities' array`);
                continue;
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
            continue;
        }

        console.log(`Found ${facilities.length} facilities in ${file}. Upserting...`);

        // Process in batches
        const BATCH_SIZE = 50;
        for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
            const chunk = facilities.slice(i, i + BATCH_SIZE);
            const facilitiesBatch = [];
            const licenseMap = new Map(); // slug -> license data

            for (const f of chunk) {
                // Normalize fields
                let name = f.name;
                let address_line1 = f.address_line1 || f.address;
                let city = f.city;
                let state = f.state;
                let postal_code = f.postal_code || f.zip;
                let phone = f.phone;

                // Handle nested address object (common in some scrapers)
                if (typeof f.address === 'object' && f.address !== null) {
                    address_line1 = f.address.street || f.address.address_line1;
                    city = f.address.city || city;
                    state = f.address.state || state;
                    postal_code = f.address.zip || f.address.postal_code || postal_code;
                }

                // Handle nested contact object
                if (typeof f.contact === 'object' && f.contact !== null) {
                    phone = f.contact.phone || phone;
                }

                // Generate composite key for mapping
                const key = `${name}|${address_line1}|${city}`;

                // Handle license structure
                let license = f.license;
                if (!license && f.license_number) {
                    license = {
                        number: f.license_number,
                        status: f.license_status,
                        capacity: f.capacity ? parseInt(f.capacity) : undefined
                    };
                }

                if (license) {
                    licenseMap.set(key, license);
                }

                facilitiesBatch.push({
                    name,
                    address_line1,
                    address_line2: f.address_line2 || null,
                    city,
                    state,
                    postal_code,
                    phone,
                    latitude: f.latitude ? parseFloat(f.latitude) : null,
                    longitude: f.longitude ? parseFloat(f.longitude) : null
                });
            }

            // 1. Check and Insert/Update Facilities
            const insertedFacilities = [];

            for (const facility of facilitiesBatch) {
                // Try to find existing facility
                const { data: existing } = await supabase
                    .from('facilities')
                    .select('id')
                    .eq('name', facility.name)
                    .eq('address_line1', facility.address_line1)
                    .eq('city', facility.city)
                    .single();

                let facilityId;

                if (existing) {
                    // Update existing (optional, but good for refreshing data)
                    const { data: updated, error: updateError } = await supabase
                        .from('facilities')
                        .update(facility)
                        .eq('id', existing.id)
                        .select('id, name, address_line1, city, state')
                        .single();

                    if (updateError) {
                        console.error(`Error updating facility ${facility.name}:`, updateError);
                        continue;
                    }
                    facilityId = updated.id;
                    insertedFacilities.push(updated);
                } else {
                    // Insert new
                    const { data: inserted, error: insertError } = await supabase
                        .from('facilities')
                        .insert(facility)
                        .select('id, name, address_line1, city, state')
                        .single();

                    if (insertError) {
                        console.error(`Error inserting facility ${facility.name}:`, insertError);
                        continue;
                    }
                    facilityId = inserted.id;
                    insertedFacilities.push(inserted);
                }
            }

            // 2. Upsert Licensing
            if (insertedFacilities.length > 0) {
                const licensingBatch = [];

                for (const facility of insertedFacilities) {
                    const key = `${facility.name}|${facility.address_line1}|${facility.city}`;
                    const licenseData = licenseMap.get(key);
                    if (licenseData) {
                        licensingBatch.push({
                            facility_id: facility.id,
                            license_number: licenseData.number || licenseData.license_number,
                            bed_capacity: licenseData.capacity || licenseData.bed_capacity || 0,
                            authority: facility.state === 'CA' ? 'California Department of Social Services' :
                                facility.state === 'PA' ? 'Pennsylvania Department of Human Services' :
                                    facility.state === 'NY' ? 'New York State Department of Health' :
                                        facility.state === 'TX' ? 'Texas Health and Human Services' :
                                            facility.state === 'OH' ? 'Ohio Department of Health' :
                                                facility.state === 'HI' ? 'Hawaii Department of Health' :
                                                    facility.state === 'AK' ? 'Alaska Department of Health' :
                                                        facility.state === 'AL' ? 'Alabama Department of Public Health' :
                                                            facility.state === 'IL' ? 'Illinois Department of Public Health' :
                                                                facility.state === 'UT' ? 'Utah Department of Health and Human Services' : undefined
                        });
                    }
                }

                if (licensingBatch.length > 0) {
                    // Deduplicate by license_number
                    const uniqueLicensing = Array.from(new Map(licensingBatch.map(item => [item.license_number, item])).values());

                    const { error: licenseError } = await supabase
                        .from('facility_licensing')
                        .upsert(uniqueLicensing, { onConflict: 'license_number' });

                    if (licenseError) {
                        console.error(`Error upserting licensing for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, licenseError);
                    }
                }
            }

            // Log progress
            if ((i / BATCH_SIZE) % 10 === 0) {
                console.log(`  Processed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
            }
        }
    }

    console.log('Seeding complete!');
}

seedFacilities();
