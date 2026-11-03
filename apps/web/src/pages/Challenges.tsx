import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { flag, ODS } from '../lib/format';
import { Chip, Empty, Loading } from '../components/ui';

export function ChallengeCard({ c }: { c: any }) {
  return (
    <Link to={`/retos/${c.id}`} className="card challenge-card">
      <div className="row-between">
        <span className="territory"><MapPin size={14} /> {flag(c.country)} {c.territory}</span>
        <Chip tone={c.status === 'abierto' ? 'gold' : 'navy'}>{c.status === 'abierto' ? 'Busca equipo' : 'En progreso'}</Chip>
      </div>
      <h3>{c.title}</h3>
      <p className="muted clamp2">{c.summary}</p>
      <div className="meta">
        {c.ods.map((o: number) => <span key={o} className={`ods ods-${o}`}>ODS {o}</span>)}
        <span><Users size={14} /> {c.participants ? `${c.participants} estudiantes · ${c.universities} universidad${c.universities === 1 ? '' : 'es'}` : 'Sé el primer equipo'}</span>
      </div>
    </Link>
  );
}

export default function Challenges() {
  const [country, setCountry] = useState('');
  const [ods, setOds] = useState('');
  const [status, setStatus] = useState('');
  const qs = [
    country && `country=${encodeURIComponent(country)}`,
    ods && `ods=${ods}`,
    status && `status=${status}`,
  ].filter(Boolean).join('&');
  const { data, loading } = useApi<any[]>(`/challenges${qs ? `?${qs}` : ''}`);
  return (
    <div className="page">
      <h1>Retos del territorio</h1>
      <p className="muted">Problemas reales de comunidades rurales y territorios de Colombia y Perú. Arma un equipo con estudiantes de otras sedes y universidades y construye la solución.</p>
      <div className="filters">
        <button className={!country ? 'on' : ''} onClick={() => setCountry('')}>Todos</button>
        <button className={country === 'Colombia' ? 'on' : ''} onClick={() => setCountry('Colombia')}>🇨🇴 Colombia</button>
        <button className={country === 'Perú' ? 'on' : ''} onClick={() => setCountry('Perú')}>🇵🇪 Perú</button>
      </div>
      <div className="filters">
        <button className={!status ? 'on' : ''} onClick={() => setStatus('')}>Cualquier estado</button>
        <button className={status === 'abierto' ? 'on' : ''} onClick={() => setStatus('abierto')}>Buscan equipo</button>
        <button className={status === 'en_progreso' ? 'on' : ''} onClick={() => setStatus('en_progreso')}>En progreso</button>
      </div>
      <label className="small">Objetivo de desarrollo
        <select value={ods} onChange={(e) => setOds(e.target.value)}>
          <option value="">Todos los ODS</option>
          {Object.entries(ODS).map(([n, label]) => <option key={n} value={n}>ODS {n} · {label}</option>)}
        </select>
      </label>
      {loading ? <Loading /> : data?.length ? data.map((c) => <ChallengeCard key={c.id} c={c} />) : <Empty title="No hay retos con esos filtros" />}
    </div>
  );
}
