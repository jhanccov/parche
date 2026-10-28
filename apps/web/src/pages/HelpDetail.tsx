import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { ago } from '../lib/format';
import { Avatar, Chip, ErrorMsg, Loading, Section } from '../components/ui';
import Chat from '../components/Chat';

export default function HelpDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me, refresh } = useAuth();
  const { data: h, reload, loading } = useApi<any>(`/help/${id}`);
  const [hours, setHours] = useState(1);
  const [rating, setRating] = useState(5);
  const [err, setErr] = useState<string | null>(null);

  if (loading || !h) return <Loading />;
  const mine = h.author_id === me?.id;
  const isMentor = h.mentor_id === me?.id;

  async function act(path: string, body: unknown = {}, method = 'POST') {
    setErr(null);
    try {
      await api(path, { method, body });
      await reload();
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function report() {
    await api('/reports', { body: { target_type: 'help', target_id: id, reason: 'Contenido inapropiado' } });
    setErr('Gracias. Un moderador revisará esta solicitud.');
  }

  return (
    <div className="page">
      <div className="card">
        <div className="row-between">
          <Chip tone="soft">{h.topic}</Chip>
          <Chip tone={h.status === 'abierta' ? 'gold' : h.status === 'en_curso' ? 'navy' : 'soft'}>{h.status.replace('_', ' ')}</Chip>
        </div>
        <h1 className="h2">{h.title}</h1>
        {h.detail && <p>{h.detail}</p>}
        <div className="meta">
          <Avatar name={h.author} size={28} />
          <span>{h.author} · {h.author_career} · {h.author_university}</span>
          <span className="muted">{ago(h.created_at)}</span>
        </div>
        {h.mentor && <p className="small">Mentor: <strong>{h.mentor}</strong> ({h.mentor_university})</p>}
        {h.status === 'resuelta' && <p className="small">Resuelta en {Number(h.hours)} h · {'★'.repeat(h.rating ?? 0)}</p>}
        <ErrorMsg msg={err} />
        <div className="row gap">
          {h.status === 'abierta' && !mine && <button className="btn gold" onClick={() => act(`/help/${id}/offer`)}>Ofrezco ayuda</button>}
          {h.status === 'abierta' && mine && <button className="btn ghost" onClick={async () => { await act(`/help/${id}`, undefined, 'DELETE'); nav('/mentoria'); }}>Borrar</button>}
          {!mine && <button className="link small" onClick={report}>Reportar</button>}
        </div>
      </div>

      {h.status === 'en_curso' && mine && (
        <Section title="¿Te ayudaron? Cierra la mentoría">
          <div className="card form">
            <label>Horas de mentoría
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {[0.5, 1, 1.5, 2, 2.5, 3, 4].map((x) => <option key={x} value={x}>{x} h</option>)}
              </select>
            </label>
            <div className="stars" role="radiogroup" aria-label="Calificación">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-label={`${n} estrellas`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}><Star size={26} /></button>
              ))}
            </div>
            <button className="btn gold" onClick={() => act(`/help/${id}/resolve`, { hours, rating })}>Confirmar y agradecer</button>
            <p className="muted small">Tu mentor suma {hours * 10} puntos y las horas quedan en su constancia.</p>
          </div>
        </Section>
      )}

      {(mine || isMentor) && h.mentor_id && (
        <Section title="Conversación de la mentoría">
          <Chat channel={`help:${id}`} placeholder="Coordina hora y lugar" />
        </Section>
      )}
    </div>
  );
}
