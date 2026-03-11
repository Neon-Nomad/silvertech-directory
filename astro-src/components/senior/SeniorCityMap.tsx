import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type CareTypeSlug =
  | 'assisted-living'
  | 'memory-care'
  | 'nursing-homes'
  | 'independent-living'
  | 'residential-care'
  | 'adult-day-services'
  | 'ccrc';

type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  careTypes: CareTypeSlug[];
  address: string;
};

type Props = {
  points: MapPoint[];
  fallbackCenter: { lat: number; lng: number };
  careColors: Record<CareTypeSlug, string>;
};

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };

export default function SeniorCityMap({ points, fallbackCenter, careColors }: Props) {
  const center = points.length > 0 ? { lat: points[0].lat, lng: points[0].lng } : fallbackCenter || DEFAULT_CENTER;

  return (
    <div className="sl-map-shell">
      <MapContainer center={[center.lat, center.lng]} zoom={11} scrollWheelZoom={false} className="sl-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => {
          const primaryCareType = point.careTypes[0] || 'assisted-living';
          const color = careColors[primaryCareType] || '#2e7d32';
          return (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.82 }}
              radius={7}
            >
              <Popup>
                <div className="sl-map-popup">
                  <strong>{point.name}</strong>
                  <div>{point.address}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
