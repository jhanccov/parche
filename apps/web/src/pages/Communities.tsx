import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Plus, Search, Users } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { CATEGORIES } from '../lib/format';
import { CategoryChip, Chip, Empty, Loading, Progress } from '../components/ui';

export function CommunityCard({ c }: { c: any }) {
  return (
    <Link to={`/comunidades/${c.id}`} className="card community-card">
      <div className="row-between">
        <CategoryChip category={c.category} />
        {c.progress.status === 'activa' ? <Chip tone="navy">Activa</Chip> : <Chip tone="gold">En formación {c.progress.percent}%</Chip>}
      </div>
      <h3>{c.name}</h3>
      <p className="muted clamp2">{c.description}</p>
      {c.progress.status !== 'activa' && <Progress value={c.progress.percent} label="Avance de formación" />}
      <div className="meta">
        <span><Users size={14} /> {c.members} miembros</span>
        {c.scope === 'red' ? <span><Globe2 size={14} /> Toda la red · {c.universities} universidades</span> : <span>{c.campus}</span>}
        {c.joined && <Chip tone="soft">Eres miembro</Chip>}
      </div>
    </Link>
  );
}

export default function Communities() {
  const [cat, setCat] = useState<string>('');
  const [qs, setQs] = useState('');
  const path = `/communities?${cat ? `category=${cat}&` : ''}${qs ? `q=${encodeURIComponent(qs)}` : ''}`;
  const { data, loading } = useApi<any[]>(path);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Comunidades</h1>
        <Link to="/comunidades/nueva" className="btn gold small"><Plus size={16} /> Crear</Link>
      </div>
      <p className="muted">Clubes, semilleros y grupos de estudio de toda la red La Salle. ¿No existe la tuya? Créala y Parche te guía hasta activarla.</p>
      <div className="search">
        <Search size={16} />
        <input placeholder="Buscar comunidades" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Buscar comunidades" />
      </div>
      <div className="filters">
        <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>Todas</button>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{v.label}</button>
        ))}
      </div>
      {loading ? <Loading /> : data?.length ? data.map((c) => <CommunityCard key={c.id} c={c} />) : <Empty title="No hay comunidades con ese filtro" />}
    </div>
  );
}
