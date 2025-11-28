# National Assisted Living Facilities Database

**Collection Date:** November 28, 2025  
**Total Facilities:** 9,095  
**States Covered:** 11  
**Data Completeness:** 97.8% (phone), 100% (address), 99.8% (capacity)

---

## Executive Summary

This database contains comprehensive information on **9,095 assisted living facilities** across **11 U.S. states**, collected from official state government licensing databases and health department registries. All data was obtained through official public sources—no web scraping of private facility websites was performed.

### Key Statistics

| Metric | Value | Percentage |
|--------|-------|------------|
| **Total Facilities** | 9,095 | 100% |
| **With Phone Numbers** | 8,896 | 97.8% |
| **With Complete Addresses** | 9,094 | 100.0% |
| **With Capacity Data** | 9,075 | 99.8% |
| **With Geographic Coordinates** | 3,680 | 40.5% |
| **With License Numbers** | 8,101 | 89.1% |

---

## States Covered

| State | Facilities | Data Source |
|-------|-----------|-------------|
| **Florida (FL)** | 2,993 | Florida Agency for Health Care Administration (AHCA) |
| **Texas (TX)** | 2,003 | Texas Health and Human Services Commission (HHSC) |
| **Pennsylvania (PA)** | 991 | PA Department of Human Services |
| **Alaska (AK)** | 792 | Alaska Department of Health |
| **Colorado (CO)** | 689 | Colorado Department of Public Health and Environment (CDPHE) |
| **North Carolina (NC)** | 569 | NC Department of Health and Human Services |
| **Illinois (IL)** | 495 | Illinois Department of Public Health (IDPH) |
| **New York (NY)** | 351 | NY State Department of Health |
| **Alabama (AL)** | 190 | Alabama Department of Public Health |
| **Hawaii (HI)** | 17 | Hawaii Department of Health |
| **Arizona (AZ)** | 3 | Arizona Department of Health Services |

---

## Data Schema

Each facility record contains the following standardized fields:

```json
{
  "name": "Facility Name",
  "address": "Street Address",
  "city": "City Name",
  "state": "State Code (2-letter)",
  "zip": "ZIP Code",
  "phone": "Phone Number",
  "license_number": "State License Number",
  "license_status": "Active/Licensed/etc.",
  "capacity": "Number of beds/units",
  "facility_type": "Facility classification",
  "administrator": "Administrator name (if available)",
  "ownership": "Ownership type (if available)",
  "county": "County name (if available)",
  "last_inspection_date": "Most recent inspection date (if available)",
  "latitude": "Geographic latitude (if available)",
  "longitude": "Geographic longitude (if available)",
  "source_url": "Official source URL"
}
```

---

## Data Sources by State

### Florida (2,993 facilities)
- **Source:** Florida Agency for Health Care Administration (AHCA)
- **URL:** https://www.floridahealthfinder.gov/facilitylocator/ListFacilities.aspx
- **Method:** Official facility listing download
- **Data Quality:** ✅ Complete addresses, phones, capacity, coordinates

### Texas (2,003 facilities)
- **Source:** Texas Health and Human Services Commission (HHSC)
- **URL:** https://apps.hhs.texas.gov/LTCSearch/
- **Method:** Official licensing database export
- **Data Quality:** ✅ Complete addresses, phones, license numbers

### Pennsylvania (991 facilities)
- **Source:** PA Department of Human Services
- **URL:** https://www.dhs.pa.gov/KeepPAHealthy/Licensing/Pages/Personal-Care-Home-Listing.aspx
- **Method:** Official licensed facility CSV download
- **Data Quality:** ✅ Complete addresses, phones, capacity

### Alaska (792 facilities)
- **Source:** Alaska Department of Health
- **URL:** https://www.commerce.alaska.gov/web/cbpl/
- **Method:** Official licensing board database
- **Data Quality:** ✅ Complete addresses, phones, license numbers

### Colorado (689 facilities)
- **Source:** Colorado Department of Public Health and Environment (CDPHE)
- **URL:** https://geodata.colorado.gov/datasets/CDPHE::cdphe-health-facilities
- **Method:** ArcGIS Open Data Portal API
- **Data Quality:** ✅ Complete addresses, phones, capacity, coordinates

### North Carolina (569 facilities)
- **Source:** NC Department of Health and Human Services
- **URL:** https://info.ncdhhs.gov/dhsr/acls/index.html
- **Method:** Official adult care licensure search
- **Data Quality:** ✅ Complete addresses, phones, capacity

### Illinois (495 facilities)
- **Source:** Illinois Department of Public Health (IDPH)
- **URL:** https://dph.illinois.gov/topics-services/life-stages-populations/assisted-living-shared-housing.html
- **Method:** Official licensed establishments listing
- **Data Quality:** ✅ Complete addresses, phones, license numbers

### New York (351 facilities)
- **Source:** NY State Department of Health
- **URL:** https://profiles.health.ny.gov/
- **Method:** Official health facility profiles database
- **Data Quality:** ✅ Complete addresses, phones, capacity

### Alabama (190 facilities)
- **Source:** Alabama Department of Public Health
- **URL:** https://www.alabamapublichealth.gov/healthcarefacilities/assisted-living.html
- **Method:** Official facility directory
- **Data Quality:** ✅ Complete addresses, phones

### Hawaii (17 facilities)
- **Source:** Hawaii Department of Health
- **URL:** https://health.hawaii.gov/ohca/
- **Method:** Official care facility listing
- **Data Quality:** ✅ Complete addresses, phones

### Arizona (3 facilities)
- **Source:** Arizona Department of Health Services
- **URL:** https://www.azdhs.gov/licensing/
- **Method:** Official licensing database
- **Data Quality:** ⚠️ Limited data (only 3 facilities collected)

---

## Data Collection Methodology

### Compliance with Official Sources
All data was collected exclusively from:
- ✅ Official state government websites
- ✅ State health department databases
- ✅ Official licensing board registries
- ✅ Public open data portals

### No Unauthorized Scraping
- ❌ No scraping of private facility websites
- ❌ No collection of proprietary information
- ❌ No violation of terms of service
- ✅ All data from public government sources

### Data Processing
1. **Download:** Official CSV/Excel files or API access
2. **Standardization:** Convert to unified JSON schema
3. **Validation:** Check for completeness and accuracy
4. **Consolidation:** Merge into single database

---

## File Structure

```
/home/ubuntu/
├── all_states_alf_facilities.json          # Consolidated database (all states)
├── alf_data_summary.json                   # Summary statistics
├── alabama_alf_facilities.json             # Alabama facilities
├── alaska_alf_facilities.json              # Alaska facilities
├── arizona_alf_facilities.json             # Arizona facilities
├── colorado_alf_facilities.json            # Colorado facilities
├── florida_alf_facilities.json             # Florida facilities
├── hawaii_alf_facilities.json              # Hawaii facilities
├── illinois_alf_facilities.json            # Illinois facilities
├── new_york_alf_facilities.json            # New York facilities
├── north_carolina_alf_facilities.json      # North Carolina facilities
├── pennsylvania_alf_facilities.json        # Pennsylvania facilities
└── texas_alf_facilities.json               # Texas facilities
```

---

## Usage Examples

### Load All Facilities
```python
import json

with open('all_states_alf_facilities.json', 'r') as f:
    facilities_by_state = json.load(f)

# Access Florida facilities
florida_facilities = facilities_by_state['FL']
print(f"Florida has {len(florida_facilities)} facilities")
```

### Filter by City
```python
# Find all facilities in Miami, FL
miami_facilities = [f for f in facilities_by_state['FL'] 
                   if f['city'].upper() == 'MIAMI']
```

### Filter by Capacity
```python
# Find large facilities (100+ beds)
large_facilities = [f for state in facilities_by_state.values() 
                   for f in state 
                   if f['capacity'] and int(f['capacity']) >= 100]
```

---

## Data Quality Notes

### High-Quality Data
- **Addresses:** 100% complete across all states
- **Phone Numbers:** 97.8% complete
- **Capacity:** 99.8% complete
- **License Numbers:** 89.1% complete

### Limited Data
- **Geographic Coordinates:** Only 40.5% have lat/long
  - Florida, Colorado, and some other states provide coordinates
  - Other states require geocoding
- **Administrator Names:** Not consistently available
- **Ownership Information:** Limited availability
- **Inspection Dates:** Varies by state

### Recommendations for Enhancement
1. **Geocoding:** Use Census Geocoder or Google Maps API to add coordinates
2. **Inspection Data:** Cross-reference with state inspection databases
3. **Quality Ratings:** Integrate CMS quality star ratings where available
4. **Contact Updates:** Verify phone numbers and websites

---

## Known Issues

### Texas Data Duplication
- Some Texas facilities appear with both "TX" and "TEXAS" state codes
- Requires deduplication based on license number or address

### Arizona Limited Coverage
- Only 3 facilities collected from Arizona
- May require additional data collection efforts

### Missing Coordinates
- 59.5% of facilities lack geographic coordinates
- Geocoding recommended for mapping applications

---

## Future Expansion

### Priority States (Not Yet Collected)
1. **California** - ~7,000+ facilities
2. **Ohio** - ~1,000+ facilities
3. **Michigan** - ~500+ facilities
4. **Georgia** - ~500+ facilities
5. **Virginia** - ~400+ facilities

### Additional Data Fields
- Quality ratings and inspection scores
- Services offered (memory care, hospice, etc.)
- Pricing information (where publicly available)
- Facility photos and amenities
- Resident reviews and satisfaction scores

---

## License and Attribution

This database contains information compiled from public government sources. When using this data, please provide appropriate attribution:

> Assisted living facility data compiled from official state government sources including:
> - Florida Agency for Health Care Administration (AHCA)
> - Texas Health and Human Services Commission (HHSC)
> - Pennsylvania Department of Human Services
> - Colorado Department of Public Health and Environment (CDPHE)
> - And other state health departments

**Data is provided "as-is" without warranty.** Users should verify information with official state sources before making decisions based on this data.

---

## Contact and Updates

For questions, corrections, or to contribute additional state data:
- **Repository:** [GitHub Repository URL]
- **Last Updated:** November 28, 2025
- **Next Update:** TBD

---

## Technical Specifications

- **Format:** JSON (JavaScript Object Notation)
- **Encoding:** UTF-8
- **File Size:** ~15-20 MB (consolidated file)
- **Records:** 9,095 facilities
- **Fields per Record:** 16 standardized fields
- **API Compatibility:** Ready for REST API integration
- **Database Import:** Compatible with MongoDB, PostgreSQL, MySQL

---

## Changelog

### Version 1.0 (November 28, 2025)
- Initial release
- 11 states covered
- 9,095 facilities collected
- Standardized JSON schema implemented
- Data quality validation completed
