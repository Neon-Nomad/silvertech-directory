const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../src/data/products.json');
const outputPath = path.join(__dirname, '../supabase/seed_products.sql');

const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const getRecommendationReason = (name, category) => {
    const lowerName = name.toLowerCase();

    // Specific keyword matches
    if (lowerName.includes('grab bar')) return "Essential for stability and preventing common slips in wet areas.";
    if (lowerName.includes('toilet')) return "Improves bathroom safety and ease of use.";
    if (lowerName.includes('shower') || lowerName.includes('bath')) return "Reduces slip risks and makes bathing safer and more comfortable.";
    if (lowerName.includes('walker') || lowerName.includes('rollator')) return "Provides critical support and stability for maintaining mobility.";
    if (lowerName.includes('wheelchair') || lowerName.includes('chair')) return "Ensures comfortable and safe mobility for those with limited movement.";
    if (lowerName.includes('cane')) return "Offers extra balance support for safer walking.";
    if (lowerName.includes('bed')) return "Enhances comfort and safety during sleep and rest.";
    if (lowerName.includes('alarm') || lowerName.includes('sensor') || lowerName.includes('monitor')) return "Provides peace of mind by alerting caregivers to potential issues.";
    if (lowerName.includes('light')) return "Improves visibility to prevent trips and falls in dim areas.";
    if (lowerName.includes('utensil') || lowerName.includes('opener')) return "Makes dining and meal prep easier and more independent.";
    if (lowerName.includes('incontinence') || lowerName.includes('diaper')) return "Provides discreet protection and maintains dignity.";
    if (lowerName.includes('pill') || lowerName.includes('medication')) return "Helps manage medication schedules accurately and safely.";
    if (lowerName.includes('memory') || lowerName.includes('clock')) return "Aids orientation and helps manage daily routines.";
    if (lowerName.includes('shoe') || lowerName.includes('sock')) return "Makes dressing easier and safer.";
    if (lowerName.includes('ramp')) return "Improves accessibility for entering and exiting the home.";

    // Fallback category-based reasons
    switch (category) {
        case 'bathroom': return "Increases safety and independence in the bathroom.";
        case 'mobility': return "Supports safe movement and prevents falls.";
        case 'bedroom': return "Ensures a safe and comfortable sleeping environment.";
        case 'kitchen': return "Promotes independence in the kitchen.";
        case 'monitoring': return "Keeps loved ones connected and safe.";
        case 'hygiene': return "Essential for maintaining personal hygiene and comfort.";
        case 'medical': return "Critical for monitoring and managing health at home.";
        case 'dementia': return "Supports cognitive function and reduces anxiety.";
        case 'daily-living': return "Simplifies everyday tasks for better quality of life.";
        case 'outdoor': return "Enables safe and active outdoor experiences.";
        default: return "Highly recommended for senior safety and comfort.";
    }
};

const generateSQL = () => {
    let sql = `-- Seed Affiliate Products\n`;
    sql += `-- Generated on ${new Date().toISOString()}\n\n`;

    // Create table if not exists
    sql += `CREATE TABLE IF NOT EXISTS affiliate_products (\n`;
    sql += `  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  name text NOT NULL,\n`;
    sql += `  category text NOT NULL,\n`;
    sql += `  affiliate_url text,\n`;
    sql += `  image_url text,\n`;
    sql += `  recommendation_reason text,\n`;
    sql += `  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL\n`;
    sql += `);\n\n`;

    // Enable RLS
    sql += `ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;\n\n`;

    // Create policy
    sql += `CREATE POLICY "Public read access" ON affiliate_products FOR SELECT USING (true);\n\n`;

    let count = 0;

    for (const [category, products] of Object.entries(productsData)) {
        products.forEach(product => {
            const name = product.name.replace(/'/g, "''"); // Escape single quotes
            const reason = getRecommendationReason(product.name, category).replace(/'/g, "''");

            // Generate distinct placeholders
            const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const affiliateUrl = `https://affiliatelink.com/?product=${slug}`;
            const imageUrl = `https://images.silvertech.com/${slug}.jpg`;

            sql += `INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)\n`;
            sql += `VALUES ('${name}', '${category}', '${affiliateUrl}', '${imageUrl}', '${reason}');\n\n`;

            count++;
        });
    }

    fs.writeFileSync(outputPath, sql);
    console.log(`Generated SQL for ${count} products at ${outputPath}`);
};

generateSQL();
