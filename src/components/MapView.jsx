import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Base layers. Satellite imagery helps farmers recognise their own fields.
export const BASEMAPS = {
  map: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 18 },
};

// MapContainer only reads `center` on mount; this keeps the view in step when the selected farm or union changes.
export function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom ?? map.getZoom(), { animate: true }); }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// points: [{id, lat, lon, color, r, label, onClick, ring}]
export default function MapView({ center, zoom = 13, points = [], circles = [], height = 260, className = '', basemap = 'map', label }) {
  const base = BASEMAPS[basemap];
  return (
    <div className={`overflow-hidden rounded-2xl border border-black/10 ${className}`} style={{ height }} role="region" aria-label={label}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} attributionControl>
        <TileLayer key={basemap} url={base.url} attribution={base.attribution} maxZoom={base.maxZoom} />
        <Recenter center={center} zoom={zoom} />
        {circles.map((c) => (
          <Circle key={c.id} center={[c.lat, c.lon]} radius={c.radius} pathOptions={{ color: c.color, fillColor: c.color, fillOpacity: 0.12, weight: 2, dashArray: '6 4' }} />
        ))}
        {points.map((p) => (
          <CircleMarker key={p.id} center={[p.lat, p.lon]} radius={p.r ?? 6}
            pathOptions={{ color: p.ring ?? '#ffffff', weight: p.ring ? 3 : 1.5, fillColor: p.color, fillOpacity: 0.95 }}
            eventHandlers={p.onClick ? { click: p.onClick } : undefined}>
            {p.label && <Tooltip direction="top" offset={[0, -6]}>{p.label}</Tooltip>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
