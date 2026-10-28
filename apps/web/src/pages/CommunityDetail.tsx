import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, Check, Circle, Flag, Globe2, MapPin, Users, Video } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { when } from '../lib/format';
import { Avatar, CategoryChip, Chip, ErrorMsg, Loading, Progress, Section } from '../components/ui';
import Chat from '../components/Chat';

export default function CommunityDetail() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const { data: c, reload, loading } = useApi<any>(`/communities/${id}`);
  const [tab, setTab] = useState<'info' | 'chat'>('info');
  const [err, setErr] = useState<string | null>(null);
  const [showEvent, setShowEvent] = useState(false);
  const [ev, setEv] = useState({ title: '', starts_at: '', place: '', description: '' });

  if (loading || !c) return <Loading />;
  const canManage = c.myRole === 'fundador' || c.myRole === 'core';

  async function act(path: string, body?: unknown) {
    setErr(null);
    try {
      await api(path, { method: 'POST', body: body ?? {} });
      await reload();
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    await act('/events', { community_id: id, ...ev, starts_at: new Date(ev.starts_at).toISOString() });
    setShowEvent(false);
    setEv({ title: '', starts_at: '', place: '', description: '' });
  }

  return (
    <div className="page">
      <div className="hero-card">
        <CategoryChip category={c.category} />
        <h1>{c.name}</h1>
        <p>{c.description}</p>
        <div className="meta light">
          <span><Users size={14} /> {c.members} miembros</span>
          {c.scope === 'red' ? <span><Globe2 size={14} /> {c.universities} universidades</span> : <span><MapPin size={14} /> {c.campus}</span>}
        </div>
        <div className="row gap">
          {!c.joined && <button className="btn gold" onClick={() => act(`/communities/${id}/join`)}>Unirme</button>}
          {c.joined && c.myRole !== 'fundador' && <button className="btn ghost light" onClick={() => act(`/communities/${id}/leave`)}>Salir</button>}
          {c.joined && <Chip tone="gold">Tu rol: {c.myRole}</Chip>}
        </div>
      </div>
      <ErrorMsg msg={err} />

      <div className="tabs">
        <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>Comunidad</button>
        <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')} disabled={!c.joined}>Conversación</button>
      </div>

      {tab === 'chat' && c.joined ? (
        <Chat channel={`community:${id}`} placeholder="Escribe a la comunidad" />
      ) : (
        <>
          <Section title={c.progress.status === 'activa' ? 'Comunidad activa' : `Ruta de formación · ${c.progress.percent}%`}>
            <div className="card">
              <Progress value={c.progress.percent} label="Avance de formación" />
              <ul className="checklist">
                {c.progress.steps.map((s: any) => (
                  <li key={s.id} className={s.done ? 'done' : ''}>
                    {s.done ? <Check size={16} /> : <Circle size={16} />} <span>{s.label}</span> {s.value && <small>{s.value}</small>}
                  </li>
                ))}
              </ul>
              <p className="muted small"><Flag size={12} /> Inspirada en cómo nacen comunidades como los AWS Student Builder Groups: núcleo, primeras actividades y una meta de miembros.</p>
            </div>
          </Section>

          <Section title="Eventos" action={canManage && <button className="link" onClick={() => setShowEvent(!showEvent)}>+ Nuevo evento</button>}>
            {showEvent && (
              <form className="card form" onSubmit={createEvent}>
                <label>Título<input required minLength={3} value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} /></label>
                <label>Fecha y hora<input type="datetime-local" required value={ev.starts_at} onChange={(e) => setEv({ ...ev, starts_at: e.target.value })} /></label>
                <label>Lugar o enlace<input value={ev.place} onChange={(e) => setEv({ ...ev, place: e.target.value })} /></label>
                <label>Descripción<textarea value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} /></label>
                <button className="btn gold">Publicar evento</button>
              </form>
            )}
            {c.events.length === 0 && <p className="muted">Aún no hay eventos.</p>}
            {c.events.map((e: any) => (
              <div key={e.id} className="card row-between">
                <div>
                  <span className="event-date"><CalendarDays size={14} /> {when(e.starts_at)}</span>
                  <strong className="block">{e.title}</strong>
                  <span className="muted small">{e.virtual_url ? <Video size={12} /> : <MapPin size={12} />} {e.place}</span>
                </div>
                <button className={`btn small ${e.rsvp ? 'navy' : 'ghost'}`} onClick={() => act(`/events/${e.id}/rsvp`)}>
                  {e.rsvp ? 'Voy ✓' : 'Asistiré'} · {e.going}
                </button>
              </div>
            ))}
          </Section>

          <Section title={`Miembros (${c.memberList.length})`}>
            <div className="list">
              {c.memberList.map((m: any) => (
                <div key={m.id} className="list-row">
                  <Avatar name={m.name} size={34} />
                  <span><strong>{m.name}</strong><small className="block muted">{m.career} · {m.university}</small></span>
                  <Chip tone={m.role === 'miembro' ? 'soft' : 'gold'}>{m.role}</Chip>
                  {c.myRole === 'fundador' && m.role === 'miembro' && (
                    <button className="link" onClick={() => act(`/communities/${id}/core`, { userId: m.id })}>Sumar al núcleo</button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
