import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

type Props = {
  lat: number;
  lng: number;
  name: string;
  address: string;
};

type LeafletLike = {
  map: (...args: unknown[]) => any;
  tileLayer: (...args: unknown[]) => any;
  marker: (...args: unknown[]) => any;
  divIcon: (...args: unknown[]) => any;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function FacilityMapPin({ lat, lng, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      const leafletModule = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      const L = (leafletModule.default || leafletModule) as unknown as LeafletLike;
      const map = L.map(containerRef.current, { zoomControl: false, scrollWheelZoom: false });
      mapRef.current = map;

      map.setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'fp-map-pin-wrap',
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -38],
          html: '<span class="fp-map-pin"></span>',
        }),
      });
      marker.bindPopup(
        `<strong>${escapeHtml(name)}</strong><br/><span style="font-size:0.82rem;color:#64748b">${escapeHtml(address)}</span>`,
        { maxWidth: 220 },
      );
      marker.addTo(map);

      setReady(true);
    }

    init().catch((err) => {
      console.error('FacilityMapPin init failed:', err);
      setError('Map failed to load.');
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setReady(false);
    };
  }, [lat, lng]);

  return (
    <div className="fp-map-shell">
      <div ref={containerRef} className="fp-map" />
      {!ready && !error && <div className="fp-map-loading">Loading map…</div>}
      {error && <div className="fp-map-loading">{error}</div>}
      {ready && (
        <div className="fp-map-controls">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>−</button>
        </div>
      )}
    </div>
  );
}
