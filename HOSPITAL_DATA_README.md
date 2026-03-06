# Hospital Data for SilverTech Directory

This directory contains free, verified hospital data from the **CMS (Centers for Medicare & Medicaid Services)** Provider Data Catalog, geocoded and pre-matched to every Indiana senior living facility in the database.

**Source:** [CMS Hospital General Information](https://data.cms.gov/provider-data/dataset/xubh-q36u)  
**Last updated:** March 2026  
**Cost:** Free — no API key, no per-query charges

---

## Files

### `indiana_hospitals_cms.json`
Raw CMS hospital data for all **150 Indiana hospitals** registered with Medicare.

**Fields per hospital:**
```json
{
  "facility_id": "150009",
  "facility_name": "COMMUNITY HOSPITAL EAST",
  "address": "1500 N RITTER AVE",
  "citytown": "INDIANAPOLIS",
  "state": "IN",
  "zip_code": "46219",
  "telephone_number": "(317) 355-1411",
  "hospital_type": "Acute Care Hospitals",
  "hospital_ownership": "Voluntary non-profit - Private",
  "emergency_services": "Yes",
  "hospital_overall_rating": "3"
}
```

---

### `indiana_hospitals_geocoded.json`
Same as above but with **latitude and longitude added** via Nominatim (OpenStreetMap geocoder). 134 of 150 hospitals successfully geocoded.

**Additional fields:**
```json
{
  "latitude": 39.7748,
  "longitude": -86.0714
}
```

---

### `indiana_facility_hospitals.json`
**The main file to use.** Every Indiana facility pre-matched to its nearest hospitals with exact distances in miles.

**Structure:**
```json
{
  "facility_name": "ROSEWALK VILLAGE",
  "facility_address": "1302 N LESLEY AVE, INDIANAPOLIS, IN 46219",
  "facility_lat": 39.7748,
  "facility_lon": -86.071,
  "nearest_hospital": {
    "name": "COMMUNITY HOSPITAL EAST",
    "address": "1500 N RITTER AVE, INDIANAPOLIS, IN 46219",
    "phone": "(317) 355-1411",
    "emergency_services": "Yes",
    "hospital_type": "Acute Care Hospitals",
    "distance_miles": 0.8
  },
  "nearest_er": {
    "name": "COMMUNITY HOSPITAL EAST",
    "distance_miles": 0.8,
    "emergency_services": "Yes"
  },
  "nearest_5_hospitals": [...],
  "total_hospitals_within_10mi": 9,
  "total_er_within_10mi": 6
}
```

---

## Why This Data Exists

The current site was showing **Eskenazi Health (6.0 miles)** as the nearest hospital for Rosewalk Village Indianapolis, when **Community Hospital East is 0.8 miles away** — literally across the street. This was a data accuracy issue that undermines family trust.

This dataset corrects that by:
1. Using verified CMS hospital addresses
2. Geocoding each hospital to exact coordinates
3. Computing haversine distances from each facility's coordinates to every hospital
4. Returning the 5 nearest hospitals sorted by distance

---

## How to Use This Data

### Replace the current Healthcare Access section

The `indiana_facility_hospitals.json` file maps directly to what the **Healthcare Access sidebar** on each facility page should display.

**Current (wrong):**
```
NEAREST HOSPITAL
ESKENAZI HEALTH  3.0 mi
720 ESKENAZI AVENUE, INDIANAPOLIS
```

**Correct (from this data):**
```
NEAREST HOSPITAL
COMMUNITY HOSPITAL EAST  0.8 mi
1500 N RITTER AVE, INDIANAPOLIS
Emergency Services: Yes

9 hospitals within 10 miles | 6 with Emergency Rooms
```

### Lookup by facility name
```javascript
// Example: find hospital data for a facility
const facilityHospitals = require('./indiana_facility_hospitals.json');
const rosewalk = facilityHospitals.find(f => f.facility_name === 'ROSEWALK VILLAGE');
console.log(rosewalk.nearest_hospital); // Community Hospital East, 0.8 mi
```

### Display rules (recommended)
- **Show name and distance only** — no quality grades, no star ratings
- **Show "Emergency Services" label** if `emergency_services === "Yes"`
- **Show top 3 hospitals** in the sidebar, with a "See all nearby hospitals" expand
- **Show counts** — "9 hospitals within 10 miles" as a summary stat

---

## Expanding to All 50 States

This same process can be repeated for every state:

1. Download the full US hospital dataset: `us_hospitals_cms.json` (already in this repo — 5,426 hospitals)
2. Filter by state
3. Geocode using Nominatim (free, 1 request/second rate limit)
4. Run the haversine matching against your facility coordinates

The script that generated this data is at `/match_hospitals.py` in the repo root.

---

## Data Limitations

- CMS only includes **Medicare-registered hospitals** — some small rural hospitals may be missing
- **16 of 150 Indiana hospitals** failed geocoding (address format issues) — these are excluded from distance calculations
- Distances are **straight-line (haversine)**, not driving distance — actual drive time will vary
- Hospital data was last updated **January 26, 2026** per CMS

---

## Regenerating / Updating

To refresh this data when CMS updates their dataset (quarterly):

```bash
python3 match_hospitals.py
```

The script re-downloads from CMS, re-geocodes, and re-matches all facilities automatically.
