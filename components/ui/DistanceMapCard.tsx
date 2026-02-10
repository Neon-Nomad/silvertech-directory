import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './Button';
import { findNearestCity } from '@/src/utils/geolocation';

interface DistanceMapCardProps {
  facilityName: string;
  facilityLat?: number | null;
  facilityLng?: number | null;
  facilityAddress?: string;
}

const getStoredCoords = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('geo_coords');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { lat: number; lng: number };
  } catch {
    return null;
  }
};

const getStoredStatus = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('geo_status');
};

const toRad = (value: number) => (value * Math.PI) / 180;

const getDistanceMiles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};

const userDot = L.divIcon({
  className: 'custom-user-dot',
  html: '<div class="user-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const facilityDot = L.divIcon({
  className: 'custom-facility-pin',
  html: '<div class="facility-pin"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 18]
});

export const DistanceMapCard: React.FC<DistanceMapCardProps> = ({
  facilityName,
  facilityLat,
  facilityLng,
  facilityAddress
}) => {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setUserCoords(getStoredCoords());
    setGeoStatus(getStoredStatus());
  }, []);

  const facilityCoords = useMemo(() => {
    if (!facilityLat || !facilityLng) return null;
    return { lat: facilityLat, lng: facilityLng };
  }, [facilityLat, facilityLng]);

  const distanceMiles = useMemo(() => {
    if (!userCoords || !facilityCoords) return null;
    return getDistanceMiles(userCoords, facilityCoords);
  }, [userCoords, facilityCoords]);

  const driveMinutes = useMemo(() => {
    if (!distanceMiles) return null;
    const mph = 30;
    return Math.max(5, Math.round((distanceMiles / mph) * 60));
  }, [distanceMiles]);

  const center = useMemo(() => {
    if (!userCoords && facilityCoords) return [facilityCoords.lat, facilityCoords.lng] as [number, number];
    if (userCoords && !facilityCoords) return [userCoords.lat, userCoords.lng] as [number, number];
    if (userCoords && facilityCoords) {
      return [
        (userCoords.lat + facilityCoords.lat) / 2,
        (userCoords.lng + facilityCoords.lng) / 2
      ] as [number, number];
    }
    return null;
  }, [userCoords, facilityCoords]);

  const line = useMemo(() => {
    if (!userCoords || !facilityCoords) return null;
    return [
      [userCoords.lat, userCoords.lng],
      [facilityCoords.lat, facilityCoords.lng]
    ] as [number, number][];
  }, [userCoords, facilityCoords]);

  const mapUrl = useMemo(() => {
    if (!facilityCoords) return null;
    const destination = `${facilityCoords.lat},${facilityCoords.lng}`;
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  }, [facilityCoords, userCoords]);

  useEffect(() => {
    if (!center) return;
    const timer = setTimeout(() => setIsRevealed(true), 250);
    return () => clearTimeout(timer);
  }, [center]);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        const city = findNearestCity(latitude, longitude);

        localStorage.setItem('geo_coords', JSON.stringify(coords));
        if (city) {
          localStorage.setItem('geo_city', city);
        }
        localStorage.setItem('geo_status', 'granted');
        setGeoStatus('granted');
        setUserCoords(coords);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          localStorage.setItem('geo_status', 'denied');
          setGeoStatus('denied');
        } else {
          setGeoStatus('error');
        }
      }
    );
  };

  if (!facilityCoords) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Distance from your location</h3>
        <span className="text-xs text-slate-400">Approximate location</span>
      </div>

      <div className="relative h-[300px] sm:h-[280px] rounded-xl overflow-hidden border border-slate-200">
        <div
          className={`absolute inset-0 transition-all duration-500 ${isRevealed ? 'opacity-100 blur-0' : 'opacity-90 blur-[6px]'}`}
          aria-hidden={!userCoords}
        >
          {center && (
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              {userCoords && (
                <>
                  <Circle
                    center={[userCoords.lat, userCoords.lng]}
                    radius={600}
                    pathOptions={{ color: '#93c5fd', fillColor: '#93c5fd', fillOpacity: 0.25, weight: 1 }}
                  />
                  <Marker position={[userCoords.lat, userCoords.lng]} icon={userDot} />
                </>
              )}
              <Marker position={[facilityCoords.lat, facilityCoords.lng]} icon={facilityDot} />
              {line && (
                <Polyline positions={line} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }} />
              )}
            </MapContainer>
          )}
          {mapUrl && (
            <button
              className="absolute inset-0"
              onClick={() => window.open(mapUrl, '_blank')}
              aria-label={`Open map directions to ${facilityName}`}
            />
          )}
        </div>
        {!userCoords && (
          <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[6px] flex flex-col items-center justify-center text-slate-600 text-sm gap-3 z-10">
            <div>
              {geoStatus === 'denied'
                ? 'Location access is off. Enable it to see distance.'
                : geoStatus === 'unsupported'
                  ? 'Your browser does not support location services.'
                  : 'Enable location to see distance.'}
            </div>
            {geoStatus !== 'unsupported' && (
              <Button
                variant="outline"
                className="border-slate-300 hover:bg-slate-100"
                onClick={handleEnableLocation}
              >
                Use My Location
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-600">
          <div><span className="text-slate-400">Drive time:</span> <span className="font-semibold text-slate-800">{driveMinutes ? `${driveMinutes} minutes` : 'Approximate'}</span></div>
          <div><span className="text-slate-400">Distance:</span> <span className="font-semibold text-slate-800">{distanceMiles ? `${distanceMiles.toFixed(1)} miles` : 'Approximate'}</span></div>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 hover:bg-slate-100"
          onClick={() => mapUrl && window.open(mapUrl, '_blank')}
        >
          Get Directions
        </Button>
      </div>

      <p className="text-xs text-slate-400 mt-3">Location is approximate and based on device permissions.</p>
    </div>
  );
};

// Marker styles
if (typeof document !== 'undefined') {
  const styleId = 'distance-map-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .custom-user-dot .user-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #60a5fa;
        box-shadow: 0 0 0 10px rgba(147, 197, 253, 0.35);
      }
      .custom-facility-pin .facility-pin {
        width: 18px;
        height: 18px;
        border-radius: 999px 999px 999px 0;
        transform: rotate(-45deg);
        background: #0f172a;
        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.2);
      }
    `;
    document.head.appendChild(style);
  }
}
