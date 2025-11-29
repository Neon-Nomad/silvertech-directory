import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DOCS_DIR = path.join(process.cwd(), 'rugulatory_docs');
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'generated', 'regulations');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface RegulatoryData {
    state_slug: string;
    medicaid_content: string;
    licensing_content: string;
    ombudsman_content: string;
    complaints_content: string;
    veterans_content: string;
    contacts_json: any;
}

// Helper to read file content safely
const readFile = (dir: string, filename: string): string => {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
};

// Helper to parse contacts from markdown table
// This is a basic parser assuming the specific format of verified_authority_contacts.md
const parseContacts = (markdown: string) => {
    const contacts: any = {
        licensing: { name: '', phone: '' },
        ombudsman: { name: '', phone: '' },
        medicaid: { name: '', phone: '' },
        elderAbuse: { name: '', phone: '' }
    };

    // Simple regex-based extraction for now. 
    // In a real scenario, a more robust markdown parser might be better, 
    // but given the standardized input, this should work.

    // Licensing
    const licensingMatch = markdown.match(/\| \*\*Agency Name\*\* \| (.*?) \|/);
    const licensingPhoneMatch = markdown.match(/\| \*\*Licensing\/General Phone\*\* \| (.*?) \|/);
    const licensingWebMatch = markdown.match(/\| \*\*Website\*\* \| \[(.*?)\]/);

    if (licensingMatch) contacts.licensing.name = licensingMatch[1].trim();
    if (licensingPhoneMatch) contacts.licensing.phone = licensingPhoneMatch[1].trim();
    if (licensingWebMatch) contacts.licensing.website = licensingWebMatch[1].trim();

    // Ombudsman (Usually section 3)
    // We need to look for the Ombudsman section specifically or search globally if unique
    const ombudsmanMatch = markdown.match(/\| \*\*Agency Name\*\* \| .*?Long-Term Care Ombudsman.*? \|/);
    // This is tricky with regex global search. Let's try to find by context.

    // Alternative: Split by "##" sections
    const sections = markdown.split('## ');

    sections.forEach(section => {
        if (section.includes('Licensing, Certification')) {
            const name = section.match(/\| \*\*Agency Name\*\* \| (.*?) \|/)?.[1];
            const phone = section.match(/\| \*\*Licensing\/General Phone\*\* \| (.*?) \|/)?.[1];
            const website = section.match(/\| \*\*Website\*\* \| \[(.*?)\]/)?.[1];
            if (name) contacts.licensing.name = name.trim();
            if (phone) contacts.licensing.phone = phone.trim();
            if (website) contacts.licensing.website = website.trim();
        }

        if (section.includes('Ombudsman')) {
            const name = section.match(/\| \*\*Program Name\*\* \| (.*?) \|/)?.[1] || section.match(/\| \*\*Agency Name\*\* \| (.*?) \|/)?.[1];
            const phone = section.match(/\| \*\*Toll-Free Phone\*\* \| (.*?) \|/)?.[1] || section.match(/\| \*\*General Phone\*\* \| (.*?) \|/)?.[1];
            const website = section.match(/\| \*\*Website\*\* \| \[(.*?)\]/)?.[1];
            if (name) contacts.ombudsman.name = name.trim();
            if (phone) contacts.ombudsman.phone = phone.trim();
            if (website) contacts.ombudsman.website = website.trim();
        }

        if (section.includes('Medicaid')) {
            const name = section.match(/\| \*\*Agency Name\*\* \| (.*?) \|/)?.[1];
            const phone = section.match(/\| \*\*General Phone\*\* \| (.*?) \|/)?.[1];
            const website = section.match(/\| \*\*Website\*\* \| \[(.*?)\]/)?.[1];
            if (name) contacts.medicaid.name = name.trim();
            if (phone) contacts.medicaid.phone = phone.trim();
            if (website) contacts.medicaid.website = website.trim();
        }

        if (section.includes('Adult Protective Services')) {
            const name = section.match(/\| \*\*Agency Name\*\* \| (.*?) \|/)?.[1];
            const phone = section.match(/\| \*\*APS Reporting Line\*\* \| (.*?) \|/)?.[1];
            if (name) contacts.elderAbuse.name = name.trim();
            if (phone) contacts.elderAbuse.phone = phone.trim();
        }
    });

    return contacts;
};

async function ingest() {
    console.log('Starting regulatory data ingestion...');

    if (!fs.existsSync(DOCS_DIR)) {
        console.error(`Directory not found: ${DOCS_DIR}`);
        return;
    }

    const states = fs.readdirSync(DOCS_DIR).filter(file => fs.statSync(path.join(DOCS_DIR, file)).isDirectory());

    for (const state of states) {
        console.log(`Processing ${state}...`);
        const stateDir = path.join(DOCS_DIR, state);

        const medicaid = readFile(stateDir, 'medicaid_programs.md');
        const licensing = readFile(stateDir, 'licensing_authority.md');
        const ombudsman = readFile(stateDir, 'ombudsman_advocacy.md');
        const complaints = readFile(stateDir, 'complaint_process.md');
        const veterans = readFile(stateDir, 'veterans_benefits.md');
        const contactsMd = readFile(stateDir, 'verified_authority_contacts.md');

        const contactsJson = parseContacts(contactsMd);

        const data: RegulatoryData = {
            state_slug: state,
            medicaid_content: medicaid,
            licensing_content: licensing,
            ombudsman_content: ombudsman,
            complaints_content: complaints,
            veterans_content: veterans,
            contacts_json: contactsJson
        };

        // 1. Write to local JSON
        fs.writeFileSync(path.join(OUTPUT_DIR, `${state}.json`), JSON.stringify(data, null, 2));
        console.log(`  -> Generated JSON`);

        // 2. Upload to Supabase
        const { error } = await supabase
            .from('regulatory_content')
            .upsert(data, { onConflict: 'state_slug' });

        if (error) {
            console.error(`  -> Error uploading to Supabase: ${error.message}`);
        } else {
            console.log(`  -> Uploaded to Supabase`);
        }
    }

    console.log('Ingestion complete!');
}

ingest().catch(console.error);
