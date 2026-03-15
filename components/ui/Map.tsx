import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
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
  latitude?: number;
  longitude?: number;
}

interface MapProps {
  facilities?: Facility[];
  center?: [number, number];
  zoom?: number;
}

// Deterministic random number generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Generate mock coordinates near a center point
const getMockCoordinates = (facility: Facility, center: [number, number]): [number, number] => {
  if (facility.latitude && facility.longitude) {
      return [facility.latitude, facility.longitude];
  }

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

export const Map: React.FC<MapProps> = ({ facilities = [], center, zoom = 11 }) => {
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

