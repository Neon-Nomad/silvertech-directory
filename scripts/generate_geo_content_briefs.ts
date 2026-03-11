import fs from 'node:fs';
import path from 'node:path';

type KeywordMapRow = {
  scope: 'city' | 'state';
  state_abbr: string;
  state_name: string;
  state_slug: string;
  city_name: string;
  city_slug: string;
  target_url: string;
  primary_keyword: string;
  secondary_keywords: string;
  intent_stages: string;
  priority_tiers: string;
};

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const parseCsv = (content: string): KeywordMapRow[] => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  const rows: KeywordMapRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length !== header.length) continue;

    const rowObj = Object.fromEntries(header.map((key, index) => [key, cells[index] || ''])) as KeywordMapRow;
    if (!rowObj.scope || !rowObj.target_url) continue;
    rows.push(rowObj);
  }

  return rows;
};

const csvEscape = (value: string): string => {
  const normalized = value.replace(/\r?\n/g, ' ').trim();
  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('|')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

const buildStateSectionPlan = (stateName: string): string =>
  [
    `Market overview for senior care in ${stateName}`,
    'Assisted living vs memory care vs nursing homes comparison',
    'Cost and payment pathways (private pay, Medicaid, veterans)',
    'Licensing, inspection, and complaint process',
    'How to shortlist cities and facilities'
  ].join(' | ');

const buildCitySectionPlan = (cityName: string, stateName: string): string =>
  [
    `Local market snapshot for ${cityName}, ${stateName}`,
    'Care types available and when each is appropriate',
    'Cost factors and questions to ask on pricing',
    'How to compare licensed communities and red flags',
    'Next-step checklist for tours and family decisions'
  ].join(' | ');

const buildStateBrief = (row: KeywordMapRow) => {
  const titleTag = `Senior Care in ${row.state_name} | Assisted Living, Memory Care & Nursing Homes`;
  const metaDescription = `Compare senior care in ${row.state_name}, including assisted living, memory care, nursing homes, and independent living. Browse licensed city listings, state resources, and practical family guidance.`;
  const h1 = `Senior Care in ${row.state_name}`;
  const introHook = `Families searching for ${row.primary_keyword} need a clear way to compare care types, costs, and licensed options across ${row.state_name}.`;
  const internalLinks = [
    `/states/${row.state_slug}/regulations`,
    `/states/${row.state_slug}/medicaid`,
    `/states/${row.state_slug}/ombudsman`,
    `/states/${row.state_slug}/veterans`,
    `/search?state=${encodeURIComponent(row.state_abbr)}`
  ].join(' | ');

  return {
    titleTag,
    metaDescription,
    h1,
    introHook,
    sectionPlan: buildStateSectionPlan(row.state_name),
    internalLinks,
    schemaFocus: 'WebPage | BreadcrumbList | ItemList | FAQPage',
    wordCountTarget: '1400-2200',
    cta: `Browse ${row.state_name} directory and compare city pages`,
    urlPattern: '/senior-living/[state]/',
    briefType: 'state-programmatic'
  };
};

const buildCityBrief = (row: KeywordMapRow) => {
  const titleTag = `Senior Care in ${row.city_name}, ${row.state_abbr} | Assisted Living, Memory Care & Nursing Homes`;
  const metaDescription = `Compare senior care in ${row.city_name}, ${row.state_name}, including assisted living, memory care, nursing homes, and independent living. View licensed communities, pricing context, and decision support resources.`;
  const h1 = `Senior Care in ${row.city_name}, ${row.state_abbr}`;
  const introHook = `Families searching for ${row.primary_keyword} can use this page to compare assisted living, memory care, nursing homes, and independent living in one local view.`;
  const internalLinks = [
    `/senior-living/${row.state_slug}/`,
    `/states/${row.state_slug}/regulations`,
    `/states/${row.state_slug}/medicaid`,
    `/states/${row.state_slug}/ombudsman`,
    `/search?state=${encodeURIComponent(row.state_abbr)}&city=${encodeURIComponent(row.city_name)}`
  ].join(' | ');

  return {
    titleTag,
    metaDescription,
    h1,
    introHook,
    sectionPlan: buildCitySectionPlan(row.city_name, row.state_name),
    internalLinks,
    schemaFocus: 'WebPage | BreadcrumbList | ItemList | FAQPage',
    wordCountTarget: '900-1400',
    cta: `Browse ${row.city_name} directory and compare licensed communities`,
    urlPattern: '/senior-living/[state]/[city]/assisted-living/',
    briefType: 'city-programmatic'
  };
};

const root = process.cwd();
const inputPath = path.resolve(root, 'docs/seo_geo_keyword_map.csv');
const outputPath = path.resolve(root, 'docs/seo_geo_page_briefs.csv');

if (!fs.existsSync(inputPath)) {
  throw new Error(`Missing required input file: ${inputPath}`);
}

const input = fs.readFileSync(inputPath, 'utf-8');
const mapRows = parseCsv(input);

const header = [
  'scope',
  'state_abbr',
  'state_name',
  'state_slug',
  'city_name',
  'city_slug',
  'target_url',
  'primary_keyword',
  'secondary_keywords',
  'intent_stages',
  'priority_tiers',
  'brief_type',
  'url_pattern',
  'title_tag',
  'meta_description',
  'h1',
  'intro_hook',
  'section_plan',
  'internal_links',
  'schema_focus',
  'word_count_target',
  'cta'
];

const rows: string[] = [header.join(',')];

for (const row of mapRows) {
  const brief = row.scope === 'state' ? buildStateBrief(row) : buildCityBrief(row);

  rows.push(
    [
      row.scope,
      row.state_abbr,
      row.state_name,
      row.state_slug,
      row.city_name,
      row.city_slug,
      row.target_url,
      row.primary_keyword,
      row.secondary_keywords,
      row.intent_stages,
      row.priority_tiers,
      brief.briefType,
      brief.urlPattern,
      brief.titleTag,
      brief.metaDescription,
      brief.h1,
      brief.introHook,
      brief.sectionPlan,
      brief.internalLinks,
      brief.schemaFocus,
      brief.wordCountTarget,
      brief.cta
    ]
      .map((cell) => csvEscape(cell))
      .join(',')
  );
}

fs.writeFileSync(outputPath, rows.join('\n') + '\n', 'utf-8');

const cityCount = mapRows.filter((row) => row.scope === 'city').length;
const stateCount = mapRows.filter((row) => row.scope === 'state').length;

console.log(`Generated briefs: ${outputPath}`);
console.log(`Rows: ${mapRows.length}`);
console.log(`City briefs: ${cityCount}`);
console.log(`State briefs: ${stateCount}`);
