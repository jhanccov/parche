import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { CATEGORIES, when } from '../lib/format';
import { Empty, ErrorMsg, Loading } from '../components/ui';

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

// Sin API key: OpenStreetMap estándar no requiere clave ni cuenta.
// Se evita CARTO/Google/Mapbox para que el mapa funcione en local, Docker y Render sin configurar nada.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Encuadre por defecto Colombia + Perú cuando aún no hay sede o puntos.
const DEFAULT_BOUNDS = L.latLngBounds([-18.5, -81.5], [12.5, -66]).pad(0.05);

const LAYERS = [
  { id: 'campuses', label: 'Sedes' },
  { id: 'communities', label: 'Comunidades' },
  { id: 'events', label: 'Eventos' },
  { id: 'challenges', label: 'Retos' },
  { id: 'help', label: 'Ayuda presencial' },
] as const;

type Pt = { lat: number | string | null; lng: number | string | null };
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? (n as number) : null;
};
const validPt = (p: Pt): p is { lat: number; lng: number } => num(p.lat) !== null && num(p.lng) !== null;

export default function MapPage() {
  const { data, error, loading, reload } = useApi<any>('/map');
  const { me } = useAuth();
  const [view, setView] = useState<'sede' | 'red'>('sede');
  const [on, setOn] = useState<Record<string, boolean>>({ campuses: true, communities: true, events: true, challenges: true, help: true });

  const campuses: any[] = Array.isArray(data?.campuses) ? data.campuses : [];
  const communities: any[] = Array.isArray(data?.communities) ? data.communities : [];
  const events: any[] = Array.isArray(data?.events) ? data.events : [];
  const challenges: any[] = Array.isArray(data?.challenges) ? data.challenges : [];
  const helps: any[] = Array.isArray(data?.help) ? data.help : [];

  const bounds = useMemo<LatLngBoundsExpression>(() => {
    const home = campuses.find((c: any) => c.id === me?.campus_id);
    if (view === 'sede' && home && validPt(home)) {
      return L.latLng(num(home.lat)!, num(home.lng)!).toBounds(3500) as any;
    }
    const pts = [...campuses, ...challenges].filter(validPt).map((p: any) => [num(p.lat)!, num(p.lng)!] as [number, number]);
    return pts.length ? (L.latLngBounds(pts).pad(0.15) as any) : (DEFAULT_BOUNDS as any);
  }, [campuses, challenges, view, me?.campus_id]);

  if (loading && !data) return <Loading />;
  if (error && !data)
    return (
      <div className="section">
        <ErrorMsg msg={error} />
        <button className="btn" onClick={reload} type="button">Reintentar</button>
      </div>
    );

  const empty = campuses.length + communities.length + events.length + challenges.length + helps.length === 0;

  return (
    <div className="map-page">
      <div className="map-filters">
        <button className="view" onClick={() => setView(view === 'sede' ? 'red' : 'sede')}>{view === 'sede' ? 'Ver toda la red' : 'Ver mi sede'}</button>
        {LAYERS.map((l) => (
          <button key={l.id} className={on[l.id] ? 'on' : ''} onClick={() => setOn({ ...on, [l.id]: !on[l.id] })}>{l.label}</button>
        ))}
      </div>
      {empty ? (
        <Empty title="Aún no hay puntos en el mapa" />
      ) : (
        <MapContainer key={view} bounds={bounds} className="map" scrollWheelZoom zoomControl={false} maxZoom={19} worldCopyJump>
          <ZoomControl position="bottomright" />
          <TileLayer attribution={TILE_ATTR} url={TILE_URL} maxZoom={19} />
          {on.campuses && campuses.filter(validPt).map((c: any) => (
            <Marker key={c.id} position={[num(c.lat)!, num(c.lng)!]} icon={c.rural ? ICONS.rural : ICONS.campus}>
              <Popup><strong>{c.university}</strong><br />{c.name} · {c.city}{c.rural && <><br />Sede rural</>}</Popup>
            </Marker>
          ))}
          {on.communities && communities.filter(validPt).map((c: any) => (
            <Marker key={c.id} position={[num(c.lat)! + 0.004, num(c.lng)! - 0.004]} icon={communityIcon(c.category)}>
              <Popup><strong>{c.name}</strong><br />{c.members} miembros<br /><Link to={`/comunidades/${c.id}`}>Ver comunidad</Link></Popup>
            </Marker>
          ))}
          {on.events && events.filter(validPt).map((e: any) => (
            <Marker key={e.id} position={[num(e.lat)! - 0.004, num(e.lng)! + 0.004]} icon={ICONS.event}>
              <Popup><strong>{e.title}</strong><br />{when(e.starts_at)}<br />{e.place}{e.community_id && <><br /><Link to={`/comunidades/${e.community_id}`}>Ver comunidad</Link></>}</Popup>
            </Marker>
          ))}
          {on.challenges && challenges.filter(validPt).map((c: any) => (
            <Marker key={c.id} position={[num(c.lat)!, num(c.lng)!]} icon={ICONS.challenge}>
              <Popup><strong>{c.title}</strong><br />{c.territory}<br /><Link to={`/retos/${c.id}`}>Ver reto</Link></Popup>
            </Marker>
          ))}
          {on.help && helps.filter(validPt).map((h: any) => (
            <Marker key={h.id} position={[num(h.lat)!, num(h.lng)!]} icon={ICONS.help}>
              <Popup><strong>{h.topic}</strong><br />{h.title}<br /><Link to={`/mentoria/${h.id}`}>Ofrecer ayuda</Link></Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      <p className="map-note">El mapa muestra sedes, comunidades, eventos y retos. Nunca la ubicación de una persona.</p>
    </div>
  );
}
