import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { CATEGORIES, when } from '../lib/format';
import { Loading } from '../components/ui';

const icon = (cls: string, label: string) =>
  L.divIcon({ className: '', html: `<div class="mk ${cls}"><span>${label}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] });

const ICONS = {
  campus: icon('mk-campus', '🎓'),
  rural: icon('mk-rural', '🌾'),
  event: icon('mk-event', '★'),
  challenge: icon('mk-challenge', '⛰'),
  help: icon('mk-help', '?'),
};
const communityIcon = (cat: string) =>
  L.divIcon({ className: '', html: `<div class="mk mk-community" style="background:${CATEGORIES[cat]?.color ?? '#033259'}"><span>👥</span></div>`, iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] });

const LAYERS = [
  { id: 'campuses', label: 'Sedes' },
  { id: 'communities', label: 'Comunidades' },
  { id: 'events', label: 'Eventos' },
  { id: 'challenges', label: 'Retos' },
  { id: 'help', label: 'Ayuda presencial' },
] as const;

export default function MapPage() {
  const { data } = useApi<any>('/map');
  const { me } = useAuth();
  const [view, setView] = useState<'sede' | 'red'>('sede');
  const [on, setOn] = useState<Record<string, boolean>>({ campuses: true, communities: true, events: true, challenges: true, help: true });

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!data) return null;
    const home = data.campuses.find((c: any) => c.id === me?.campus_id);
    if (view === 'sede' && home) return L.latLng(home.lat, home.lng).toBounds(3500) as any;
    const pts = [...data.campuses, ...data.challenges].map((p: any) => [p.lat, p.lng] as [number, number]);
    return pts.length ? (L.latLngBounds(pts).pad(0.15) as any) : null;
  }, [data, view, me?.campus_id]);

  if (!data || !bounds) return <Loading />;

  return (
    <div className="map-page">
      <div className="map-filters">
        <button className="view" onClick={() => setView(view === 'sede' ? 'red' : 'sede')}>{view === 'sede' ? 'Ver toda la red' : 'Ver mi sede'}</button>
        {LAYERS.map((l) => (
          <button key={l.id} className={on[l.id] ? 'on' : ''} onClick={() => setOn({ ...on, [l.id]: !on[l.id] })}>{l.label}</button>
        ))}
      </div>
      <MapContainer key={view} bounds={bounds} className="map" scrollWheelZoom zoomControl={false}>
        <ZoomControl position="bottomright" />
        <TileLayer attribution='&copy; OpenStreetMap, &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {on.campuses && data.campuses.map((c: any) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={c.rural ? ICONS.rural : ICONS.campus}>
            <Popup><strong>{c.university}</strong><br />{c.name} · {c.city}{c.rural && <><br />Sede rural</>}</Popup>
          </Marker>
        ))}
        {on.communities && data.communities.map((c: any) => (
          <Marker key={c.id} position={[c.lat + 0.004, c.lng - 0.004]} icon={communityIcon(c.category)}>
            <Popup><strong>{c.name}</strong><br />{c.members} miembros<br /><Link to={`/comunidades/${c.id}`}>Ver comunidad</Link></Popup>
          </Marker>
        ))}
        {on.events && data.events.map((e: any) => (
          <Marker key={e.id} position={[e.lat - 0.004, e.lng + 0.004]} icon={ICONS.event}>
            <Popup><strong>{e.title}</strong><br />{when(e.starts_at)}<br />{e.place}{e.community_id && <><br /><Link to={`/comunidades/${e.community_id}`}>Ver comunidad</Link></>}</Popup>
          </Marker>
        ))}
        {on.challenges && data.challenges.map((c: any) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={ICONS.challenge}>
            <Popup><strong>{c.title}</strong><br />{c.territory}<br /><Link to={`/retos/${c.id}`}>Ver reto</Link></Popup>
          </Marker>
        ))}
        {on.help && data.help.map((h: any) => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={ICONS.help}>
            <Popup><strong>{h.topic}</strong><br />{h.title}<br /><Link to={`/mentoria/${h.id}`}>Ofrecer ayuda</Link></Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="map-note">El mapa muestra sedes, comunidades, eventos y retos. Nunca la ubicación de una persona.</p>
    </div>
  );
}
