"""
Geocode Indiana hospitals using Nominatim (free, no API key)
then match each Indiana facility to its nearest hospitals.
"""
import json, time, math, urllib.request, urllib.parse

# ── Load data ────────────────────────────────────────────────────────────────
with open('/home/ubuntu/silvertech-directory/indiana_hospitals_cms.json') as f:
    hospitals = json.load(f)

with open('/home/ubuntu/upload/indiana_facilities.json') as f:
    fac_data = json.load(f)
facilities = fac_data['facilities']

print(f"Hospitals to geocode: {len(hospitals)}")
print(f"Facilities to match: {len(facilities)}")

# ── Geocode hospitals using Nominatim ────────────────────────────────────────
def geocode(address, city, state, zip_code):
    """Return (lat, lon) or None."""
    query = f"{address}, {city}, {state} {zip_code}"
    params = urllib.parse.urlencode({
        'q': query,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'us'
    })
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    headers = {'User-Agent': 'SilverTechDirectory/1.0 (hospital-geocoder)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            results = json.load(r)
        if results:
            return float(results[0]['lat']), float(results[0]['lon'])
    except Exception as e:
        pass
    return None

# Geocode all Indiana hospitals (with 1s delay to respect Nominatim policy)
geocoded = []
for i, h in enumerate(hospitals):
    coords = geocode(h['address'], h['citytown'], h['state'], h['zip_code'])
    if coords:
        h['latitude'] = coords[0]
        h['longitude'] = coords[1]
        geocoded.append(h)
        print(f"  [{i+1}/{len(hospitals)}] ✓ {h['facility_name']} → {coords[0]:.4f}, {coords[1]:.4f}")
    else:
        print(f"  [{i+1}/{len(hospitals)}] ✗ {h['facility_name']} — geocode failed")
    time.sleep(1.1)  # Nominatim rate limit: 1 req/sec

print(f"\nGeocoded: {len(geocoded)}/{len(hospitals)}")

# Save geocoded hospitals
with open('/home/ubuntu/silvertech-directory/indiana_hospitals_geocoded.json', 'w') as f:
    json.dump(geocoded, f, indent=2)

# ── Distance calculation ──────────────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2):
    """Return distance in miles."""
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ── Match each facility to nearest hospitals ──────────────────────────────────
results = []
for fac in facilities:
    lat = fac['location'].get('latitude')
    lon = fac['location'].get('longitude')
    if not lat or not lon:
        continue

    distances = []
    for h in geocoded:
        d = haversine(lat, lon, h['latitude'], h['longitude'])
        distances.append({
            'name': h['facility_name'],
            'address': f"{h['address']}, {h['citytown']}, {h['state']} {h['zip_code']}",
            'phone': h.get('telephone_number', ''),
            'emergency_services': h.get('emergency_services', ''),
            'hospital_type': h.get('hospital_type', ''),
            'distance_miles': round(d, 1)
        })

    distances.sort(key=lambda x: x['distance_miles'])
    nearest_5 = distances[:5]
    er_hospitals = [d for d in distances if d['emergency_services'] == 'Yes']
    nearest_er = er_hospitals[0] if er_hospitals else None

    results.append({
        'facility_name': fac['name'],
        'facility_address': f"{fac['address']['street']}, {fac['address']['city']}, {fac['address']['state']} {fac['address']['zip']}",
        'facility_lat': lat,
        'facility_lon': lon,
        'nearest_hospital': nearest_5[0] if nearest_5 else None,
        'nearest_er': nearest_er,
        'nearest_5_hospitals': nearest_5,
        'total_hospitals_within_10mi': len([d for d in distances if d['distance_miles'] <= 10]),
        'total_er_within_10mi': len([d for d in distances if d['distance_miles'] <= 10 and d['emergency_services'] == 'Yes'])
    })

# Save results
output_path = '/home/ubuntu/silvertech-directory/indiana_facility_hospitals.json'
with open(output_path, 'w') as f:
    json.dump(results, f, indent=2)

print(f"\nSaved {len(results)} facility-hospital matches to {output_path}")

# Print Rosewalk specifically
for r in results:
    if 'ROSEWALK' in r['facility_name']:
        print(f"\n=== {r['facility_name']} ===")
        print(f"Address: {r['facility_address']}")
        print(f"Nearest hospital: {r['nearest_hospital']['name']} — {r['nearest_hospital']['distance_miles']} mi")
        print(f"Nearest ER: {r['nearest_er']['name']} — {r['nearest_er']['distance_miles']} mi")
        print(f"Hospitals within 10mi: {r['total_hospitals_within_10mi']} ({r['total_er_within_10mi']} with ER)")
        print("Top 5 nearest:")
        for h in r['nearest_5_hospitals']:
            print(f"  {h['name']} — {h['distance_miles']} mi | ER: {h['emergency_services']}")
