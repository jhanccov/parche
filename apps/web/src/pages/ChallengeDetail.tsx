import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Globe2, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { ago, flag, ODS } from '../lib/format';
import { Avatar, Chip, ErrorMsg, Loading, Section } from '../components/ui';
import Chat from '../components/Chat';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const { data: c, reload, loading } = useApi<any>(`/challenges/${id}`);
  const [teamName, setTeamName] = useState('');
  const [update, setUpdate] = useState('');
  const [err, setErr] = useState<string | null>(null);

  if (loading || !c) return <Loading />;

  async function act(path: string, body: unknown = {}) {
    setErr(null);
    try {
      await api(path, { body });
      await reload();
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function createTeam(e: FormEvent) {
    e.preventDefault();
    await act(`/challenges/${id}/teams`, { name: teamName });
    setTeamName('');
  }

  async function postUpdate(e: FormEvent) {
    e.preventDefault();
    await act(`/challenges/teams/${c.myTeam}/updates`, { body: update });
    setUpdate('');
  }

  return (
    <div className="page">
      <div className="hero-card green">
        <span className="territory light"><MapPin size={14} /> {flag(c.country)} {c.territory}, {c.country}</span>
        <h1>{c.title}</h1>
        <p>{c.summary}</p>
        <div className="meta light"><Building2 size={14} /> {c.organization}</div>
      </div>
      <ErrorMsg msg={err} />

      <Section title="El problema">
        <p className="card">{c.problem}</p>
      </Section>

      <Section title="Lo que se necesita">
        <div className="picker">{c.skills.map((s: string) => <Chip key={s} tone="soft">{s}</Chip>)}</div>
        <div className="picker">{c.ods.map((o: number) => <span key={o} className={`ods ods-${o}`}>ODS {o} · {ODS[o]}</span>)}</div>
      </Section>

      <Section title={`Equipos (${c.teamsList.length})`}>
        {c.teamsList.map((t: any) => (
          <div key={t.id} className="card">
            <div className="row-between">
              <strong>{t.name}</strong>
              {t.crossUniversity && <Chip tone="gold"><Globe2 size={12} /> Interuniversitario</Chip>}
            </div>
            <div className="list">
              {t.members.map((m: any) => (
                <div key={m.id} className="list-row"><Avatar name={m.name} size={28} /><span>{m.name} <small className="muted">· {m.career} · {m.university}</small></span></div>
              ))}
            </div>
            {!c.myTeam && t.members.length < t.max_members && (
              <button className="btn navy small" onClick={() => act(`/challenges/teams/${t.id}/join`)}>Unirme a este equipo</button>
            )}
          </div>
        ))}
        {!c.myTeam && (
          <form className="card form" onSubmit={createTeam}>
            <label>Arma tu propio equipo<input required minLength={3} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Nombre del equipo" /></label>
            <button className="btn gold">Crear equipo</button>
          </form>
        )}
      </Section>

      {c.myTeam && (
        <>
          <Section title="Publicar avance">
            <form className="card form" onSubmit={postUpdate}>
              <textarea required minLength={5} value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="¿Qué lograron esta semana?" />
              <button className="btn gold">Publicar avance</button>
            </form>
          </Section>
          <Section title="Conversación del equipo">
            <Chat channel={`team:${c.myTeam}`} placeholder="Escribe a tu equipo" />
          </Section>
        </>
      )}

      <Section title="Bitácora de avances">
        {c.updates.length === 0 && <p className="muted">Aún no hay avances publicados.</p>}
        {c.updates.map((u: any) => (
          <div key={u.id} className="card update">
            <strong>{u.author}</strong> <span className="muted small">{ago(u.created_at)}</span>
            <p>{u.body}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}
