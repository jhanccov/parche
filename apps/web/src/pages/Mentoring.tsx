import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, MapPin, Plus } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { ago } from '../lib/format';
import { Avatar, Chip, Empty, Loading } from '../components/ui';

const STATUS: Record<string, { label: string; tone: 'gold' | 'navy' | 'soft' }> = {
  abierta: { label: 'Abierta', tone: 'gold' },
  en_curso: { label: 'En curso', tone: 'navy' },
  resuelta: { label: 'Resuelta', tone: 'soft' },
};

export function HelpCard({ h }: { h: any }) {
  const s = STATUS[h.status];
  return (
    <Link to={`/mentoria/${h.id}`} className="card help-card">
      <div className="row-between">
        <Chip tone="soft">{h.topic}</Chip>
        <Chip tone={s.tone}>{s.label}</Chip>
      </div>
      <h3>{h.title}</h3>
      <div className="meta">
        <Avatar name={h.author} size={24} />
        <span>{h.author} · {h.author_university}</span>
        <span>{h.mode === 'presencial' ? <><MapPin size={13} /> {h.campus}</> : <><Monitor size={13} /> Virtual</>}</span>
        <span className="muted">{ago(h.created_at)}</span>
      </div>
    </Link>
  );
}

export default function Mentoring() {
  const [scope, setScope] = useState<'para-mi' | 'todas' | 'mias'>('para-mi');
  const { data, loading } = useApi<any[]>(`/help?scope=${scope}`);
  return (
    <div className="page">
      <div className="page-head">
        <h1>Mentoría entre pares</h1>
        <Link to="/mentoria/nueva" className="btn gold small"><Plus size={16} /> Pedir ayuda</Link>
      </div>
      <p className="muted">Pide ayuda en un tema o ayuda a otros con lo que sabes. Cada hora de mentoría queda registrada en tu constancia.</p>
      <div className="filters">
        <button className={scope === 'para-mi' ? 'on' : ''} onClick={() => setScope('para-mi')}>Puedo ayudar</button>
        <button className={scope === 'todas' ? 'on' : ''} onClick={() => setScope('todas')}>Todas abiertas</button>
        <button className={scope === 'mias' ? 'on' : ''} onClick={() => setScope('mias')}>Mis mentorías</button>
      </div>
      {loading ? <Loading /> : data?.length ? data.map((h) => <HelpCard key={h.id} h={h} />) : (
        <Empty title={scope === 'para-mi' ? 'Nadie pide ayuda en tus temas por ahora' : 'No hay solicitudes'}>
          {scope === 'para-mi' && 'Agrega temas en "Puedo ayudar en" desde tu perfil.'}
        </Empty>
      )}
    </div>
  );
}
