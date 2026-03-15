import fs from 'node:fs';
import path from 'node:path';

type CityIndexEntry = {
  stateSlug: string;
  citySlug: string;
  stateAbbr: string;
  stateName: string;
  cityName: string;
  count?: number;
};

type Template = {
  id: string;
  pattern: string;
  intent: 'awareness' | 'research' | 'comparison' | 'decision';
  priority: 'P1' | 'P2' | 'P3';
};

const CITY_TEMPLATES: Template[] = [
  { id: 'city_senior_care', pattern: 'senior care in {city}, {state_abbr}', intent: 'decision', priority: 'P1' },
  { id: 'city_senior_living', pattern: 'senior living in {city}, {state_abbr}', intent: 'decision', priority: 'P1' },
  { id: 'city_assisted_living', pattern: 'assisted living in {city}, {state_abbr}', intent: 'decision', priority: 'P1' },
  { id: 'city_memory_care', pattern: 'memory care in {city}, {state_abbr}', intent: 'decision', priority: 'P1' },
  { id: 'city_nursing_homes', pattern: 'nursing homes in {city}, {state_abbr}', intent: 'decision', priority: 'P1' },
  { id: 'city_independent_living', pattern: 'independent living in {city}, {state_abbr}', intent: 'comparison', priority: 'P1' },
  { id: 'city_respite_care', pattern: 'respite care in {city}, {state_abbr}', intent: 'comparison', priority: 'P1' },
  { id: 'city_dementia_care', pattern: 'dementia care in {city}, {state_abbr}', intent: 'comparison', priority: 'P1' },
  { id: 'city_best_senior_care', pattern: 'best senior care in {city}, {state_abbr}', intent: 'comparison', priority: 'P2' },
  { id: 'city_affordable_assisted', pattern: 'affordable assisted living in {city}, {state_abbr}', intent: 'comparison', priority: 'P2' },
  { id: 'city_assisted_cost', pattern: 'assisted living cost in {city}, {state_abbr}', intent: 'research', priority: 'P2' },
  { id: 'city_memory_cost', pattern: 'memory care cost in {city}, {state_abbr}', intent: 'research', priority: 'P2' },
  { id: 'city_compare_assisted', pattern: 'compare assisted living in {city}, {state_abbr}', intent: 'comparison', priority: 'P2' },
  { id: 'city_licensed_assisted', pattern: 'licensed assisted living in {city}, {state_abbr}', intent: 'comparison', priority: 'P2' },
  { id: 'city_senior_apartments', pattern: 'senior apartments in {city}, {state_abbr}', intent: 'comparison', priority: 'P2' },
  { id: 'city_near_city', pattern: 'senior care near {city}, {state_abbr}', intent: 'decision', priority: 'P2' }
];

const STATE_TEMPLATES: Template[] = [
  { id: 'state_senior_care', pattern: 'senior care in {state_name}', intent: 'decision', priority: 'P1' },
  { id: 'state_senior_living', pattern: 'senior living in {state_name}', intent: 'decision', priority: 'P1' },
  { id: 'state_assisted_living', pattern: 'assisted living in {state_name}', intent: 'decision', priority: 'P1' },
  { id: 'state_memory_care', pattern: 'memory care in {state_name}', intent: 'decision', priority: 'P1' },
  { id: 'state_nursing_homes', pattern: 'nursing homes in {state_name}', intent: 'decision', priority: 'P1' },
  { id: 'state_independent_living', pattern: 'independent living in {state_name}', intent: 'comparison', priority: 'P1' },
  { id: 'state_assisted_cost', pattern: 'assisted living cost in {state_name}', intent: 'research', priority: 'P2' },
  { id: 'state_memory_cost', pattern: 'memory care cost in {state_name}', intent: 'research', priority: 'P2' },
  { id: 'state_medicaid_assisted', pattern: 'medicaid assisted living in {state_name}', intent: 'research', priority: 'P2' },
  { id: 'state_licensed_facilities', pattern: 'licensed assisted living facilities in {state_name}', intent: 'comparison', priority: 'P2' }
];

const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const renderKeyword = (pattern: string, params: { city?: string; stateAbbr?: string; stateName?: string }): string =>
  pattern
    .replaceAll('{city}', params.city || '')
    .replaceAll('{state_abbr}', params.stateAbbr || '')
    .replaceAll('{state_name}', params.stateName || '')
    .replace(/\s+/g, ' ')
    .trim();

const csvEscape = (value: string): string => {
  const normalized = value.replace(/\r?\n/g, ' ').trim();
  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('|')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

const root = process.cwd();
const cityIndexPath = path.resolve(root, 'public/city_index.json');
if (!fs.existsSync(cityIndexPath)) {
  throw new Error(`Missing required file: ${cityIndexPath}`);
}

const cityIndex = JSON.parse(fs.readFileSync(cityIndexPath, 'utf-8')) as CityIndexEntry[];
const cities = cityIndex
  .map((entry) => ({
    ...entry,
    cityName: titleCase(entry.cityName),
    stateName: titleCase(entry.stateName),
    stateAbbr: entry.stateAbbr.toUpperCase()
  }))
  .sort((a, b) => {
    if (a.stateSlug !== b.stateSlug) return a.stateSlug.localeCompare(b.stateSlug);
    return a.citySlug.localeCompare(b.citySlug);
  });

const stateMap = new Map<string, { stateSlug: string; stateAbbr: string; stateName: string }>();
for (const city of cities) {
  if (!stateMap.has(city.stateSlug)) {
    stateMap.set(city.stateSlug, {
      stateSlug: city.stateSlug,
      stateAbbr: city.stateAbbr,
      stateName: city.stateName
    });
  }
}

const states = Array.from(stateMap.values()).sort((a, b) => a.stateSlug.localeCompare(b.stateSlug));
const isExpanded = process.argv.includes('--expanded');
const docsDir = path.resolve(root, 'docs');
fs.mkdirSync(docsDir, { recursive: true });
const outPath = path.resolve(docsDir, isExpanded ? 'seo_geo_keyword_map_expanded.csv' : 'seo_geo_keyword_map.csv');

if (isExpanded) {
  const rows: string[] = [
    [
      'keyword',
      'scope',
      'template_id',
      'intent',
      'priority',
      'target_url',
      'state_abbr',
      'state_name',
      'state_slug',
      'city_name',
      'city_slug'
    ].join(',')
  ];

  for (const city of cities) {
    const targetUrl = `https://silvertechdirectory.com/assisted-living/${city.stateSlug}/${city.citySlug}/`;
    for (const template of CITY_TEMPLATES) {
      const keyword = renderKeyword(template.pattern, {
        city: city.cityName,
        stateAbbr: city.stateAbbr,
        stateName: city.stateName
      });
      rows.push(
        [
          keyword,
          'city',
          template.id,
          template.intent,
          template.priority,
          targetUrl,
          city.stateAbbr,
          city.stateName,
          city.stateSlug,
          city.cityName,
          city.citySlug
        ]
          .map((cell) => csvEscape(String(cell)))
          .join(',')
      );
    }
  }

  for (const state of states) {
    const targetUrl = `https://silvertechdirectory.com/assisted-living/${state.stateSlug}/`;
    for (const template of STATE_TEMPLATES) {
      const keyword = renderKeyword(template.pattern, {
        stateAbbr: state.stateAbbr,
        stateName: state.stateName
      });
      rows.push(
        [
          keyword,
          'state',
          template.id,
          template.intent,
          template.priority,
          targetUrl,
          state.stateAbbr,
          state.stateName,
          state.stateSlug,
          '',
          ''
        ]
          .map((cell) => csvEscape(String(cell)))
          .join(',')
      );
    }
  }

  fs.writeFileSync(outPath, rows.join('\n') + '\n', 'utf-8');
  console.log(`Generated expanded map: ${outPath}`);
  console.log(`Cities: ${cities.length}, States: ${states.length}`);
  console.log(`City keywords: ${cities.length * CITY_TEMPLATES.length}`);
  console.log(`State keywords: ${states.length * STATE_TEMPLATES.length}`);
  console.log(`Total keywords: ${(cities.length * CITY_TEMPLATES.length) + (states.length * STATE_TEMPLATES.length)}`);
} else {
  const rows: string[] = [
    [
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
      'priority_tiers'
    ].join(',')
  ];

  for (const city of cities) {
    const keywords = CITY_TEMPLATES.map((template) =>
      renderKeyword(template.pattern, {
        city: city.cityName,
        stateAbbr: city.stateAbbr,
        stateName: city.stateName
      })
    );
    const intents = Array.from(new Set(CITY_TEMPLATES.map((template) => template.intent))).join('|');
    const priorities = Array.from(new Set(CITY_TEMPLATES.map((template) => template.priority))).join('|');

    rows.push(
      [
        'city',
        city.stateAbbr,
        city.stateName,
        city.stateSlug,
        city.cityName,
        city.citySlug,
        `https://silvertechdirectory.com/assisted-living/${city.stateSlug}/${city.citySlug}/`,
        keywords[0],
        keywords.slice(1).join(' | '),
        intents,
        priorities
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(',')
    );
  }

  for (const state of states) {
    const keywords = STATE_TEMPLATES.map((template) =>
      renderKeyword(template.pattern, {
        stateAbbr: state.stateAbbr,
        stateName: state.stateName
      })
    );
    const intents = Array.from(new Set(STATE_TEMPLATES.map((template) => template.intent))).join('|');
    const priorities = Array.from(new Set(STATE_TEMPLATES.map((template) => template.priority))).join('|');

    rows.push(
      [
        'state',
        state.stateAbbr,
        state.stateName,
        state.stateSlug,
        '',
        '',
        `https://silvertechdirectory.com/assisted-living/${state.stateSlug}/`,
        keywords[0],
        keywords.slice(1).join(' | '),
        intents,
        priorities
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(',')
    );
  }

  fs.writeFileSync(outPath, rows.join('\n') + '\n', 'utf-8');
  console.log(`Generated compact map: ${outPath}`);
  console.log(`Rows: ${rows.length - 1} (city + state targets)`);
  console.log(`City rows: ${cities.length}, State rows: ${states.length}`);
  console.log(`Keyword variants per city row: ${CITY_TEMPLATES.length}`);
  console.log(`Keyword variants per state row: ${STATE_TEMPLATES.length}`);
  console.log(`Run with --expanded to emit one row per keyword variant.`);
}
