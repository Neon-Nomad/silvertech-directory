import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const batchSize = Number(process.env.GEOCODE_BATCH || 50);
const maxUpdates = Number(process.env.GEOCODE_MAX || 0);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple delay function to respect API rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        // Using OpenStreetMap Nominatim API (Free, requires User-Agent)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SilverTechDirectory/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error(`Geocoding error for "${address}":`, error);
    }
    return null;
}

async function geocodeFacilities() {
    console.log('Starting bulk geocoding process...');
    let processed = 0;

    while (true) {
        // 1. Get facilities with NULL lat/lng
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, address_line1, city, state, postal_code')
            .is('latitude', null)
            .limit(batchSize); // Process in small batches

        if (error) {
            console.error('Error fetching facilities:', error);
            break;
        }

        if (!facilities || facilities.length === 0) {
            console.log('No more facilities found needing geocoding. Done!');
            break;
        }

        console.log(`Processing batch of ${facilities.length} facilities...`);

        for (const facility of facilities) {
            if (maxUpdates && processed >= maxUpdates) {
                console.log('\nReached GEOCODE_MAX limit. Stopping.');
                return;
            }
            const fullAddress = `${facility.address_line1}, ${facility.city}, ${facility.state} ${facility.postal_code}`;
            // console.log(`Geocoding: ${fullAddress}`);

            const coords = await geocodeAddress(fullAddress);

            if (coords) {
                process.stdout.write('.'); // Progress indicator
                const { error: updateError } = await supabase
                    .from('facilities')
                    .update({ latitude: coords.lat, longitude: coords.lng })
                    .eq('id', facility.id);

                if (updateError) {
                    console.error(`\nError updating DB for ${facility.id}:`, updateError);
                }
                processed += 1;
            } else {
                process.stdout.write('x'); // Failure indicator
            }

            // Respect Nominatim rate limit (1 request per second)
            await delay(1100);
        }
        console.log('\nBatch complete. Moving to next batch...');
    }
}

geocodeFacilities();
