import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to format strings (e.g., "San Francisco" -> "san-francisco")
const formatSlug = (name) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
};

const BASE_URL = 'https://silvertechdirectory.com'; // Replace with actual domain

const generateSitemap = async () => {
    try {
        const facilitiesPath = path.join(__dirname, '../src/data/facilities.json');
        const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

        const staticRoutes = [
            '/',
            '/search',
            '/login',
            '/tools/pricing-audit',
            '/claim-business',
            '/survey'
        ];

        const sitemapEntries = [];

        // Add static routes
        staticRoutes.forEach(route => {
            sitemapEntries.push(`
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        });

        // Add facility pages
        facilitiesData.forEach(facility => {
            sitemapEntries.push(`
  <url>
    <loc>${BASE_URL}/facility/${facility.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
        });

        // Add state pages
        const states = new Set();
        facilitiesData.forEach(facility => {
            const parts = facility.address.split(', ');
            if (parts.length > 2) {
                const stateZip = parts[parts.length - 1];
                const state = stateZip.split(' ')[0].toLowerCase();
                if (state && state.length === 2) {
                    states.add(state);
                }
            }
        });

        states.forEach(state => {
            sitemapEntries.push(`
  <url>
    <loc>${BASE_URL}/assisted-living/${state}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
        });

        // Add city pages
        const cities = new Set();
        facilitiesData.forEach(facility => {
            const parts = facility.address.split(', ');
            if (parts.length > 2) {
                const city = parts[1];
                const stateZip = parts[parts.length - 1];
                const state = stateZip.split(' ')[0].toLowerCase();
                if (city && state && state.length === 2) {
                    cities.add(`${state}/${formatSlug(city)}`);
                }
            }
        });

        cities.forEach(cityPath => {
            sitemapEntries.push(`
  <url>
    <loc>${BASE_URL}/assisted-living/${cityPath}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        });

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('')}
</urlset>`;

        const outputPath = path.join(__dirname, '../public/sitemap.xml');
        fs.writeFileSync(outputPath, sitemap);
        console.log(`Sitemap generated at ${outputPath} with ${sitemapEntries.length} URLs`);

    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
};

generateSitemap();
