import { useEffect, useMemo, useRef, useState } from 'react';

type CareTypeSlug =
  | 'assisted-living'
  | 'memory-care'
  | 'nursing-homes'
  | 'independent-living'
  | 'residential-care'
  | 'adult-day-services'
  | 'ccrc';

type FacilityPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  careTypes: CareTypeSlug[];
  address: string;
  phone?: string;
  licenseNumber?: string;
  listingTier?: string;
  profileUrl?: string;
};

type HospitalPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  type?: string;
};

type Props = {
  points: FacilityPoint[];
  fallbackCenter: { lat: number; lng: number };
  careColors: Record<CareTypeSlug, string>;
  hospitals?: HospitalPoint[];
  clusterThreshold?: number;
};

const FEATURED_TIER_COLOR = '#d4af37';
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const FEATURED_TIERS = new Set(['accelerator', 'dominator']);
const CARE_LABELS: Record<CareTypeSlug, string> = {
  'assisted-living': 'Assisted Living',
  'memory-care': 'Memory Care',
  'nursing-homes': 'Nursing Homes',
  'independent-living': 'Independent Living',
  'residential-care': 'Residential Care',
  'adult-day-services': 'Adult Day Services',
  ccrc: 'CCRC',
};

type LeafletLike = {
  map: (...args: unknown[]) => any;
  tileLayer: (...args: unknown[]) => any;
  marker: (...args: unknown[]) => any;
  divIcon: (...args: unknown[]) => any;
  layerGroup: (...args: unknown[]) => any;
  latLngBounds: (...args: unknown[]) => any;
  markerClusterGroup?: (...args: unknown[]) => any;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toTierKey = (value: string | undefined): string => (value || '').trim().toLowerCase();

const toCareLabel = (slug: CareTypeSlug): string => CARE_LABELS[slug] || slug;

const isValidCoord = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const toPointColor = (point: FacilityPoint, careColors: Record<CareTypeSlug, string>): string => {
  const tierKey = toTierKey(point.listingTier);
  if (FEATURED_TIERS.has(tierKey)) return FEATURED_TIER_COLOR;
  const primaryCare = point.careTypes[0] || 'assisted-living';
  return careColors[primaryCare] || '#2e7d32';
};

const toFacilityPopupHtml = (point: FacilityPoint): string => {
  const careBadges = point.careTypes
    .slice(0, 4)
    .map(
      (careType) =>
        `<span class="sl-map-popup-badge">${escapeHtml(toCareLabel(careType))}</span>`,
    )
    .join('');
  const phoneLine = point.phone ? `<p>${escapeHtml(point.phone)}</p>` : '';
  const licenseLine = point.licenseNumber
    ? `<p>License: ${escapeHtml(point.licenseNumber)}</p>`
    : '';
  const profileUrl = point.profileUrl || `/facility/${encodeURIComponent(point.id)}/`;

  return `
    <article class="sl-map-popup-card">
      <h3>${escapeHtml(point.name)}</h3>
      <p>${escapeHtml(point.address)}</p>
      ${phoneLine}
      ${licenseLine}
      <div class="sl-map-popup-badges">${careBadges}</div>
      <a class="sl-map-popup-link" href="${escapeHtml(profileUrl)}">View Profile</a>
    </article>
  `;
};

const toHospitalPopupHtml = (point: HospitalPoint): string => {
  const detail = [point.type || '', point.address || ''].filter(Boolean).join(' - ');
  return `
    <article class="sl-map-popup-card">
      <h3>${escapeHtml(point.name)}</h3>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
      <p>Hospital reference</p>
    </article>
  `;
};

export default function MapIsland({
  points,
  fallbackCenter,
  careColors,
  hospitals = [],
  clusterThreshold = 20,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletLike | null>(null);
  const mapRef = useRef<any>(null);
  const facilityLayerRef = useRef<any>(null);
  const hospitalLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);

  const validPoints = useMemo(
    () => points.filter((point) => isValidCoord(point.lat, point.lng)),
    [points],
  );
  const validHospitals = useMemo(
    () => hospitals.filter((point) => isValidCoord(point.lat, point.lng)),
    [hospitals],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!mapContainerRef.current) return;

      await import('leaflet/dist/leaflet.css');
      await import('leaflet.markercluster/dist/MarkerCluster.css');
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css');
      const leafletModule = await import('leaflet');
      await import('leaflet.markercluster');

      if (cancelled || !mapContainerRef.current) return;

      const leaf = (leafletModule.default || leafletModule) as unknown as LeafletLike;
      leafletRef.current = leaf;

      const map = leaf.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      const center = fallbackCenter || DEFAULT_CENTER;
      map.setView([center.lat, center.lng], 11);
      leaf
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(map);

      setMapReady(true);
    };

    initializeMap().catch((error) => {
      console.error('Map initialization failed:', error);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      leafletRef.current = null;
      facilityLayerRef.current = null;
      hospitalLayerRef.current = null;
      setMapReady(false);
    };
  }, [fallbackCenter]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;

    if (facilityLayerRef.current) {
      map.removeLayer(facilityLayerRef.current);
      facilityLayerRef.current = null;
    }

    if (!validPoints.length) {
      const center = fallbackCenter || DEFAULT_CENTER;
      map.setView([center.lat, center.lng], 11);
      return;
    }

    const facilityMarkers = validPoints.map((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'sl-map-facility-icon-wrap',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12],
          html: `<span class="sl-map-facility-icon" style="--pin-color:${toPointColor(point, careColors)};"></span>`,
        }),
      });
      marker.bindPopup(toFacilityPopupHtml(point), { maxWidth: 300 });
      return marker;
    });

    let layer = null;
    const shouldCluster = validPoints.length >= clusterThreshold && typeof L.markerClusterGroup === 'function';
    if (shouldCluster) {
      layer = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        maxClusterRadius: 48,
      });
      facilityMarkers.forEach((marker) => layer.addLayer(marker));
    } else {
      layer = L.layerGroup(facilityMarkers);
    }

    layer.addTo(map);
    facilityLayerRef.current = layer;

    const bounds = L.latLngBounds(
      facilityMarkers.map((marker) => marker.getLatLng()),
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), { maxZoom: 13 });
    }

    return () => {
      if (facilityLayerRef.current === layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    };
  }, [mapReady, validPoints, careColors, clusterThreshold, fallbackCenter]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;

    if (hospitalLayerRef.current) {
      map.removeLayer(hospitalLayerRef.current);
      hospitalLayerRef.current = null;
    }

    if (!showHospitals || validHospitals.length === 0) return;

    const hospitalLayer = L.layerGroup();
    validHospitals.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'sl-map-hospital-icon-wrap',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12],
          html: '<span class="sl-map-hospital-icon">H</span>',
        }),
      });
      marker.bindPopup(toHospitalPopupHtml(point), { maxWidth: 260 });
      hospitalLayer.addLayer(marker);
    });

    hospitalLayer.addTo(map);
    hospitalLayerRef.current = hospitalLayer;

    return () => {
      if (hospitalLayerRef.current === hospitalLayer && map.hasLayer(hospitalLayer)) {
        map.removeLayer(hospitalLayer);
      }
    };
  }, [mapReady, showHospitals, validHospitals]);

  return (
    <div className="sl-map-shell">
      <div ref={mapContainerRef} className="sl-map" />

      {!mapReady ? (
        <div className="sl-map-loading">
          <p>Loading map...</p>
        </div>
      ) : (
        <div className="sl-map-controls">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapRef.current?.zoomOut()}
          >
            -
          </button>
          <button
            type="button"
            aria-label="Toggle hospital layer"
            className={showHospitals ? 'is-active' : ''}
            onClick={() => setShowHospitals((prev) => !prev)}
          >
            Hospitals
          </button>
        </div>
      )}
    </div>
  );
}
