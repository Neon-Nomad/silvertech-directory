/**
 * State-Level Senior Care Cost Lookup Table
 * Sources:
 *   - Assisted Living: A Place for Mom 2026 Report (based on 2025 move-in data, 24,305 move-ins)
 *   - Memory Care: A Place for Mom 2025 Report (based on 10,596 move-ins in 2024)
 *   - Independent Living: A Place for Mom 2026 Report
 *   - National Medians (CareScout 2025 Cost of Care Survey, released March 2026):
 *       Assisted Living: $6,200/mo | Memory Care: ~$6,690/mo (APFM) | Nursing Home Private: $10,798/mo
 *
 * Usage: Look up by state abbreviation to get median monthly costs by care type.
 * These are state-level medians — actual city costs will vary above or below.
 */

export type CareTypeCostKey =
  | 'assisted-living'
  | 'memory-care'
  | 'independent-living'
  | 'nursing-home';

export interface StateCostData {
  stateName: string;
  abbr: string;
  // Monthly median costs in USD
  assistedLiving: number | null;
  memoryCare: number | null;
  independentLiving: number | null;
  // Source year for reference
  sourceYear: number;
}

// National medians (CareScout 2025 / APFM 2026 report)
export const NATIONAL_MEDIANS: Record<CareTypeCostKey, number> = {
  'assisted-living': 6200,
  'memory-care': 6690,
  'independent-living': 3200,
  'nursing-home': 10798,
};

export const STATE_COST_DATA: StateCostData[] = [
  { stateName: 'Alabama',              abbr: 'AL', assistedLiving: 4100,  memoryCare: 5310,  independentLiving: 2895, sourceYear: 2025 },
  { stateName: 'Alaska',               abbr: 'AK', assistedLiving: 7000,  memoryCare: 8750,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Arizona',              abbr: 'AZ', assistedLiving: 4820,  memoryCare: 6000,  independentLiving: 2495, sourceYear: 2025 },
  { stateName: 'Arkansas',             abbr: 'AR', assistedLiving: 4845,  memoryCare: 5650,  independentLiving: 2745, sourceYear: 2025 },
  { stateName: 'California',           abbr: 'CA', assistedLiving: 5739,  memoryCare: 6500,  independentLiving: 3634, sourceYear: 2025 },
  { stateName: 'Colorado',             abbr: 'CO', assistedLiving: 6070,  memoryCare: 7149,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Connecticut',          abbr: 'CT', assistedLiving: 7099,  memoryCare: 8312,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Delaware',             abbr: 'DE', assistedLiving: 7230,  memoryCare: 7424,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'District of Columbia', abbr: 'DC', assistedLiving: 8960,  memoryCare: 10555, independentLiving: null, sourceYear: 2025 },
  { stateName: 'Florida',              abbr: 'FL', assistedLiving: 4624,  memoryCare: 5495,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Georgia',              abbr: 'GA', assistedLiving: 4395,  memoryCare: 4914,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Hawaii',               abbr: 'HI', assistedLiving: 6193,  memoryCare: 11000, independentLiving: null, sourceYear: 2025 },
  { stateName: 'Idaho',                abbr: 'ID', assistedLiving: 5100,  memoryCare: 5500,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Illinois',             abbr: 'IL', assistedLiving: 5970,  memoryCare: 7200,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Indiana',              abbr: 'IN', assistedLiving: 4568,  memoryCare: 6135,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Iowa',                 abbr: 'IA', assistedLiving: 5790,  memoryCare: 6500,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Kansas',               abbr: 'KS', assistedLiving: 5720,  memoryCare: 7100,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Kentucky',             abbr: 'KY', assistedLiving: 4500,  memoryCare: 5650,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Louisiana',            abbr: 'LA', assistedLiving: 3983,  memoryCare: 5499,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Maine',                abbr: 'ME', assistedLiving: 7241,  memoryCare: 9498,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Maryland',             abbr: 'MD', assistedLiving: 6690,  memoryCare: 7537,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Massachusetts',        abbr: 'MA', assistedLiving: 7250,  memoryCare: 9298,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Michigan',             abbr: 'MI', assistedLiving: 5039,  memoryCare: 5913,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Minnesota',            abbr: 'MN', assistedLiving: 5310,  memoryCare: 7765,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Mississippi',          abbr: 'MS', assistedLiving: 4106,  memoryCare: 5295,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Missouri',             abbr: 'MO', assistedLiving: 5500,  memoryCare: 6446,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Montana',              abbr: 'MT', assistedLiving: 5778,  memoryCare: 8110,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Nebraska',             abbr: 'NE', assistedLiving: 5575,  memoryCare: 7306,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Nevada',               abbr: 'NV', assistedLiving: 5928,  memoryCare: 7046,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'New Hampshire',        abbr: 'NH', assistedLiving: 6752,  memoryCare: 8775,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'New Jersey',           abbr: 'NJ', assistedLiving: 7480,  memoryCare: 8877,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'New Mexico',           abbr: 'NM', assistedLiving: 4880,  memoryCare: 6200,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'New York',             abbr: 'NY', assistedLiving: 6195,  memoryCare: 7765,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'North Carolina',       abbr: 'NC', assistedLiving: 5730,  memoryCare: 6700,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'North Dakota',         abbr: 'ND', assistedLiving: 4665,  memoryCare: 6333,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Ohio',                 abbr: 'OH', assistedLiving: 5449,  memoryCare: 6393,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Oklahoma',             abbr: 'OK', assistedLiving: 5288,  memoryCare: 6349,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Oregon',               abbr: 'OR', assistedLiving: 6693,  memoryCare: 8190,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Pennsylvania',         abbr: 'PA', assistedLiving: 5438,  memoryCare: 6800,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Rhode Island',         abbr: 'RI', assistedLiving: 5800,  memoryCare: 7162,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'South Carolina',       abbr: 'SC', assistedLiving: 4568,  memoryCare: 4990,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'South Dakota',         abbr: 'SD', assistedLiving: 4740,  memoryCare: 7174,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Tennessee',            abbr: 'TN', assistedLiving: 4928,  memoryCare: 5339,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Texas',                abbr: 'TX', assistedLiving: 5458,  memoryCare: 6063,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Utah',                 abbr: 'UT', assistedLiving: 4500,  memoryCare: 5225,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Vermont',              abbr: 'VT', assistedLiving: 7885,  memoryCare: 10941, independentLiving: null, sourceYear: 2025 },
  { stateName: 'Virginia',             abbr: 'VA', assistedLiving: 6025,  memoryCare: 6803,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Washington',           abbr: 'WA', assistedLiving: 6160,  memoryCare: 7845,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'West Virginia',        abbr: 'WV', assistedLiving: 5425,  memoryCare: 6200,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Wisconsin',            abbr: 'WI', assistedLiving: 5595,  memoryCare: 7098,  independentLiving: null, sourceYear: 2025 },
  { stateName: 'Wyoming',              abbr: 'WY', assistedLiving: 5120,  memoryCare: 4025,  independentLiving: null, sourceYear: 2025 },
];

// Lookup by state abbreviation
export const STATE_COST_MAP: Record<string, StateCostData> = Object.fromEntries(
  STATE_COST_DATA.map((s) => [s.abbr, s])
);

/**
 * Get the state median cost for a given care type.
 * Returns null if not available for that state/care type.
 */
export function getStateCost(
  stateAbbr: string,
  careType: CareTypeCostKey
): number | null {
  const state = STATE_COST_MAP[stateAbbr.toUpperCase()];
  if (!state) return null;
  switch (careType) {
    case 'assisted-living':   return state.assistedLiving;
    case 'memory-care':       return state.memoryCare;
    case 'independent-living': return state.independentLiving;
    case 'nursing-home':      return null; // not in current dataset
    default:                  return null;
  }
}

/**
 * Compare a state's median to the national median.
 * Returns a percentage difference (positive = above national, negative = below).
 * e.g. +18 means "18% above the national median"
 */
export function getStateVsNationalPct(
  stateAbbr: string,
  careType: CareTypeCostKey
): number | null {
  const stateCost = getStateCost(stateAbbr, careType);
  const national = NATIONAL_MEDIANS[careType];
  if (stateCost === null || !national) return null;
  return Math.round(((stateCost - national) / national) * 100);
}
