import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  price: string;
}

interface MapProps {
  facilities: Facility[];
  center?: [number, number];
  zoom?: number;
}

// Mock coordinates for demo purposes
// In a real app, these would come from the API or geocoding
const CITY_COORDINATES: Record<string, [number, number]> = {
  'san-francisco': [37.7749, -122.4194],
  'los-angeles': [34.0522, -118.2437],
  'san-diego': [32.7157, -117.1611],
  'sacramento': [38.5816, -121.4944],
  'san-jose': [37.3382, -121.8863],
  'fresno': [36.7378, -119.7871],
  'oakland': [37.8044, -122.2711],
  'anaheim': [33.8366, -117.9143],
  'bakersfield': [35.3733, -119.0187],
  'riverside': [33.9806, -117.3755],
  'stockton': [37.9577, -121.2908],
  'modesto': [37.6391, -120.9969],
  'santa-ana': [33.7455, -117.8677],
  'irvine': [33.6846, -117.8265],
  'chula-vista': [32.6401, -117.0842],
  'fremont': [37.5485, -121.9886],
  'santa-clarita': [34.3917, -118.5426],
  'san-bernardino': [34.1083, -117.2898],
  'corona': [33.8753, -117.5664],
  'fontana': [34.0922, -117.4350],
  'moreno-valley': [33.9425, -117.2297],
  'santa-barbara': [34.4208, -119.6982],
  'glendale': [34.1425, -118.2474],
  'huntington-beach': [33.6595, -117.9988],
  'salinas': [36.6777, -121.6555],
  'hayward': [37.6688, -122.0808],
  'lancaster': [34.6868, -118.1542],
  'palmdale': [34.5794, -118.1165],
  'sunnyvale': [37.3688, -122.0363],
  'pomona': [34.0551, -117.7500],
  'escondido': [33.1192, -117.0864],
  'torrance': [33.8358, -118.3406],
  'pasadena': [34.1478, -118.1445],
  'fullerton': [33.8704, -117.9242],
  'orange': [33.7879, -117.8531],
  'visalia': [36.3302, -119.2921],
  'roseville': [38.7521, -121.2880],
  'concord': [37.9779, -122.0311],
  'simi-valley': [34.2694, -118.7815],
  'santa-rosa': [38.4404, -122.7140],
  'thousand-oaks': [34.1706, -118.8376],
  'victorville': [34.5362, -117.2928],
  'vallejo': [38.1041, -122.2566],
  'berkeley': [37.8715, -122.2730],
  'el-monte': [34.0686, -118.0276],
  'downey': [33.9401, -118.1332],
  'costa-mesa': [33.6411, -117.9187],
  'carlsbad': [33.1581, -117.3506],
  'inglewood': [33.9617, -118.3531],
  'fairfield': [38.2494, -122.0405],
  'ventura': [34.2746, -119.2290],
  'temecula': [33.4936, -117.1484],
  'antioch': [38.0049, -121.8058],
  'richmond': [37.9358, -122.3477],
  'daly-city': [37.6879, -122.4702],
  'murrieta': [33.5539, -117.2139],
  'burbank': [34.1808, -118.3089],
  'el-cajon': [32.7948, -116.9625],
  'vista': [33.2000, -117.2425],
  'rialto': [34.1064, -117.3703],
  'santa-maria': [34.9530, -120.4357],
  'jurupa-valley': [33.9995, -117.4855],
  'compton': [33.8958, -118.2201],
  'mission-viejo': [33.6000, -117.6719],
  'south-gate': [33.9547, -118.2120],
  'vacaville': [38.3566, -121.9877],
  'carson': [33.8317, -118.2817],
  'santa-monica': [34.0195, -118.4912],
  'westminster': [33.7513, -117.9939],
  'h esperia': [34.4264, -117.3009],
  'san-mateo': [37.5630, -122.3255],
  'redding': [40.5865, -122.3917],
  'chico': [39.7285, -121.8375],
  'menifee': [33.6971, -117.1853],
  'indio': [33.7206, -116.2156],
  'citrus-heights': [38.7071, -121.2811],
  'livermore': [37.6819, -121.7680],
  'tracy': [37.7397, -121.4252],
  'chino': [34.0122, -117.6889],
  'newport-beach': [33.6189, -117.9298],
  'redwood-city': [37.4852, -122.2364],
  'hemet': [33.7475, -116.9720],
  'lake-forest': [33.6469, -117.6892],
  'merced': [37.3022, -120.4830],
  'chino-hills': [33.9898, -117.7326],
  'napa': [38.2975, -122.2869],
  'clovis': [36.8252, -119.7029],
  'pleasanton': [37.6624, -121.8747],
  'san-leandro': [37.7249, -122.1561],
  'milpitas': [37.4323, -121.8996],
  'folsom': [38.6780, -121.1761],
  'upland': [34.0975, -117.6484],
  'imperial-beach': [32.5839, -117.1131],
  'chula-vista': [32.6401, -117.0842],
  'national-city': [32.6781, -117.0992],
  'lemon-grove': [32.7426, -117.0314],
  'la-mesa': [32.7714, -117.0231],
  'el-cajon': [32.7948, -116.9625],
  'santee': [32.8384, -116.9739],
  'poway': [32.9628, -117.0359],
  'ramona': [33.0417, -116.8675],
  'alpine': [32.8351, -116.7664],
  'julian': [33.0787, -116.6020],
  'borrego-springs': [33.2559, -116.3750],
  'brawley': [32.9787, -115.5303],
  'imperial': [32.8475, -115.5694],
  'el-centro': [32.7920, -115.5630],
  'calexico': [32.6789, -115.4989],
  'holtville': [32.8112, -115.3803],
  'blythe': [33.6170, -114.5892]
};

// Deterministic random number generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Generate mock coordinates near a center point
const getMockCoordinates = (facility: Facility, center: [number, number]): [number, number] => {
  // Use facility ID to generate deterministic offset
  const seed = parseInt(facility.id.replace(/\D/g, '') || '0');
  
  // Generate random offset between -0.05 and 0.05 degrees (approx 3-4 miles)
  const latOffset = (seededRandom(seed) - 0.5) * 0.1;
  const lngOffset = (seededRandom(seed + 1) - 0.5) * 0.1;

  return [center[0] + latOffset, center[1] + lngOffset];
};

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const Map: React.FC<MapProps> = ({ facilities, center, zoom = 11 }) => {
  const [markers, setMarkers] = useState<Array<{ facility: Facility; position: [number, number] }>>([]);

  useEffect(() => {
    if (!center) return;

    const newMarkers = facilities.map(facility => ({
      facility,
      position: getMockCoordinates(facility, center)
    }));
    setMarkers(newMarkers);
  }, [facilities, center]);

  if (!center) return null;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        {markers.map(({ facility, position }) => (
          <Marker key={facility.id} position={position}>
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{facility.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{facility.address}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                    {facility.type}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{facility.price}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Export the coordinate lookup for use in parent
export { CITY_COORDINATES };
