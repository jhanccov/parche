import { useEffect, useMemo, useState, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, HandHelping, Heart, MapPin, Mountain, Plus, Share2, Users, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { CATEGORIES, flag, when } from '../lib/format';
import { burst, shareLink } from '../lib/fx';

const PROMPTS = ['¿Qué aprendemos hoy?', 'Tu parche te está esperando', 'Ayuda a alguien y suma puntos', 'Arma equipo para un reto real'];

const TOPIC_EMOJI: Record<string, string> = {
  'Cálculo': '∫', 'Álgebra lineal': '📐', 'Física': '🧲', 'Química': '⚗️', 'Estadística': '📊', 'Programación': '👩‍💻',
  'Python': '🐍', 'Java': '☕', 'C++': '⚙️', 'Bases de datos': '🗄️', 'Desarrollo web': '🌐', 'Apps móviles': '📱',
  'Cloud (AWS)': '☁️', 'Inteligencia artificial': '🤖', 'Inglés': '🗣️', 'Redacción': '✍️',
};

type Item =
  | { kind: 'event'; key: string; d: any }
  | { kind: 'community'; key: string; d: any }
  | { kind: 'help'; key: string; d: any }
  | { kind: 'challenge'; key: string; d: any }
  | { kind: 'invite'; key: string; d: { emoji: string; title: string; text: string; cta: string; to?: string; share?: boolean; grad: string } };

const INVITES: Item[] = [
  { kind: 'invite', key: 'inv-crear', d: { emoji: '🚀', title: 'Crea el parche de tu carrera', text: 'Un club, un semillero o un grupo de estudio. Te guiamos paso a paso hasta que esté activo.', cta: 'Crear comunidad', to: '/comunidades/nueva', grad: 'linear-gradient(160deg,#FFB800 0%,#FF4D8D 55%,#5B1A9E 100%)' } },
  { kind: 'invite', key: 'inv-ayuda', d: { emoji: '🆘', title: '¿Te trabaste en un curso?', text: 'Pide ayuda y le llega a quien domina el tema, en tu sede o en otro país.', cta: 'Pedir ayuda', to: '/mentoria/nueva', grad: 'linear-gradient(160deg,#18C6B3 0%,#1E5BFF 60%,#0B1F4D 100%)' } },
  { kind: 'invite', key: 'inv-share', d: { emoji: '📲', title: 'Trae a tu salón', text: 'Mientras más compañeros entren, más rápido encuentras ayuda y equipo.', cta: 'Compartir Parche', share: true, grad: 'linear-gradient(160deg,#FF4D8D 0%,#7C3AED 60%,#1A0B3A 100%)' } },
];

function mix(lists: Item[][]) {
  const out: Item[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

export default function Home() {
  const { me } = useAuth();
  const nav = useNavigate();
  const events = useApi<any[]>('/events');
  const comms = useApi<any[]>('/communities');
  const help = useApi<any[]>('/help');
  const challenges = useApi<any[]>('/challenges');
  const [prompt, setPrompt] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('dark-page');
    return () => document.body.classList.remove('dark-page');
  }, []);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const stories = useMemo(() => [...(comms.data ?? [])].sort((a, b) => Number(b.joined) - Number(a.joined)).slice(0, 12), [comms.data]);

  const feed = useMemo(() => {
    const ev: Item[] = (events.data ?? []).map((d) => ({ kind: 'event', key: 'e' + d.id, d }));
    const co: Item[] = (comms.data ?? []).filter((c) => !c.joined).map((d) => ({ kind: 'community', key: 'c' + d.id, d }));
    const he: Item[] = (help.data ?? []).filter((h) => h.author_id !== me?.id).map((d) => ({ kind: 'help', key: 'h' + d.id, d }));
    const ch: Item[] = (challenges.data ?? []).map((d) => ({ kind: 'challenge', key: 'r' + d.id, d }));
    const items = mix([ev, he, co, ch]);
    // Las invitaciones aparecen entre el contenido y siempre al final, así el inicio nunca queda vacío.
    const out: Item[] = [];
    items.forEach((it, i) => {
      out.push(it);
      if (i === 2) out.push(INVITES[0]);
      if (i === 6) out.push(INVITES[2]);
    });
    for (const inv of INVITES) if (!out.includes(inv)) out.push(inv);
    return out;
  }, [events.data, comms.data, help.data, challenges.data, me?.id]);

  async function share(e: MouseEvent, title: string, path = '/') {
    e.preventDefault();
    const r = await shareLink(title, path);
    if (r === 'copied') setToast('Enlace copiado');
  }

  async function rsvp(e: MouseEvent, d: any) {
    e.preventDefault();
    const btn = e.currentTarget;
    const r = await api<{ rsvp: boolean }>(`/events/${d.id}/rsvp`, { method: 'POST' });
    if (r.rsvp) burst(btn);
    events.setData((list) => (list ?? []).map((x) => (x.id === d.id ? { ...x, rsvp: r.rsvp, going: x.going + (r.rsvp ? 1 : -1) } : x)));
  }

  async function join(e: MouseEvent, d: any) {
    e.preventDefault();
    const btn = e.currentTarget;
    try {
      await api(`/communities/${d.id}/join`, { method: 'POST' });
      burst(btn);
      setToast(`Ya eres parte de ${d.name}`);
      comms.setData((list) => (list ?? []).map((x) => (x.id === d.id ? { ...x, joined: true, members: x.members + 1 } : x)));
    } catch (err: any) {
      setToast(err.message);
    }
  }

  async function offer(e: MouseEvent, d: any) {
    e.preventDefault();
    try {
      await api(`/help/${d.id}/offer`, { method: 'POST' });
      burst(e.currentTarget);
      setTimeout(() => nav(`/mentoria/${d.id}`), 450);
    } catch (err: any) {
      setToast(err.message);
    }
  }

  const first = me?.name?.split(' ')[0] ?? '';

  return (
    <div className="home">
      <section className="home-hero">
        <h1>Hola, {first} <span className="wave" aria-hidden>👋</span></h1>
        <p className="prompt" key={prompt} aria-live="polite">{PROMPTS[prompt]}</p>
      </section>

      <div className="stories" aria-label="Comunidades">
        <Link to="/comunidades/nueva" className="story">
          <span className="story-ring add"><span className="story-in"><Plus size={26} /></span></span>
          <span className="story-name">Crear</span>
        </Link>
        {stories.map((c) => {
          const cat = CATEGORIES[c.category];
          return (
            <Link to={`/comunidades/${c.id}`} key={c.id} className="story">
              <span className={`story-ring ${c.joined ? 'mine' : ''}`}>
                <span className="story-in" style={{ background: cat?.grad }}>{cat?.emoji ?? '👥'}</span>
              </span>
              <span className="story-name">{c.name}</span>
            </Link>
          );
        })}
      </div>

      <h2 className="feed-title">Para ti</h2>

      <div className="feed">
        {feed.map((it) => {
          if (it.kind === 'event') {
            const d = it.d; const cat = CATEGORIES[d.category];
            return (
              <Link key={it.key} to={d.community_id ? `/comunidades/${d.community_id}` : '/'} className="fcard" style={{ background: cat?.grad ?? CATEGORIES.tecnologia.grad }}>
                <span className="fbadge"><CalendarDays size={14} /> Evento</span>
                <span className="fart" aria-hidden>{cat?.emoji ?? '📅'}</span>
                <div className="fbody">
                  <h3>{d.title}</h3>
                  <p className="fmeta">{when(d.starts_at)}</p>
                  <p className="fmeta"><MapPin size={14} /> {d.place || 'Lugar por definir'}{d.community ? ` · ${d.community}` : ''}</p>
                </div>
                <div className="frail">
                  <button className={`fbtn ${d.rsvp ? 'on' : ''}`} onClick={(e) => rsvp(e, d)} aria-pressed={d.rsvp} aria-label={d.rsvp ? 'Ya no voy' : 'Voy'}>
                    <Heart size={26} fill={d.rsvp ? 'currentColor' : 'none'} />
                  </button>
                  <span className="fcount">{d.going}<small>van</small></span>
                  <button className="fbtn" onClick={(e) => share(e, d.title)} aria-label="Compartir"><Share2 size={24} /></button>
                </div>
              </Link>
            );
          }
          if (it.kind === 'community') {
            const d = it.d; const cat = CATEGORIES[d.category];
            const pct = Math.min(100, Math.round((d.members / Math.max(1, d.goal_members)) * 100));
            return (
              <Link key={it.key} to={`/comunidades/${d.id}`} className="fcard" style={{ background: cat?.grad }}>
                <span className="fbadge"><Users size={14} /> Comunidad · {cat?.label}</span>
                <span className="fart" aria-hidden>{cat?.emoji ?? '👥'}</span>
                <div className="fbody">
                  <h3>{d.name}</h3>
                  <p className="fdesc">{d.description}</p>
                  <div className="fbar"><span style={{ width: `${Math.max(6, pct)}%` }} /></div>
                  <p className="fmeta">{d.members} de {d.goal_members} miembros · {d.university}</p>
                </div>
                <div className="frail">
                  <button className={`fbtn ${d.joined ? 'on' : ''}`} onClick={(e) => !d.joined && join(e, d)} aria-label={d.joined ? 'Ya eres miembro' : 'Unirme'}>
                    {d.joined ? <Check size={26} /> : <UserPlus size={26} />}
                  </button>
                  <span className="fcount">{d.joined ? 'Dentro' : 'Unirme'}</span>
                  <button className="fbtn" onClick={(e) => share(e, d.name, `/comunidades/${d.id}`)} aria-label="Compartir"><Share2 size={24} /></button>
                </div>
              </Link>
            );
          }
          if (it.kind === 'help') {
            const d = it.d;
            return (
              <Link key={it.key} to={`/mentoria/${d.id}`} className="fcard" style={{ background: 'linear-gradient(160deg,#FF8A00 0%,#E5397A 55%,#3A0B2E 100%)' }}>
                <span className="fbadge"><HandHelping size={14} /> Pide ayuda en {d.topic}</span>
                <span className="fart" aria-hidden>{TOPIC_EMOJI[d.topic] ?? '💡'}</span>
                <div className="fbody">
                  <h3>{d.title}</h3>
                  {d.detail && <p className="fdesc">{d.detail}</p>}
                  <p className="fmeta">{d.author?.split(' ')[0]} · {d.author_career} · {d.author_university}</p>
                </div>
                <div className="frail">
                  <button className="fbtn gold" onClick={(e) => offer(e, d)} aria-label="Ofrezco ayuda"><HandHelping size={26} /></button>
                  <span className="fcount">Ayudo</span>
                  <button className="fbtn" onClick={(e) => share(e, `Alguien necesita ayuda en ${d.topic}`)} aria-label="Compartir"><Share2 size={24} /></button>
                </div>
              </Link>
            );
          }
          if (it.kind === 'challenge') {
            const d = it.d;
            return (
              <Link key={it.key} to={`/retos/${d.id}`} className="fcard" style={{ background: CATEGORIES.territorio.grad }}>
                <span className="fbadge"><Mountain size={14} /> Reto del territorio</span>
                <span className="fart" aria-hidden>🏔️</span>
                <div className="fbody">
                  <p className="fmeta">{flag(d.country)} {d.territory}</p>
                  <h3>{d.title}</h3>
                  <p className="fdesc">{d.summary}</p>
                  <p className="fmeta">{d.participants ? `${d.participants} estudiantes en ${d.teams} equipos` : 'Aún sin equipo, puedes ser el primero'}</p>
                </div>
                <div className="frail">
                  <span className="fbtn gold" aria-hidden><Mountain size={26} /></span>
                  <span className="fcount">Ver reto</span>
                  <button className="fbtn" onClick={(e) => share(e, d.title, `/retos/${d.id}`)} aria-label="Compartir"><Share2 size={24} /></button>
                </div>
              </Link>
            );
          }
          const d = it.d;
          const inner = (
            <>
              <span className="fart big" aria-hidden>{d.emoji}</span>
              <div className="fbody">
                <h3 className="xl">{d.title}</h3>
                <p className="fdesc">{d.text}</p>
                <span className="fcta">{d.cta}</span>
              </div>
            </>
          );
          return d.share ? (
            <button key={it.key} className="fcard invite" style={{ background: d.grad }} onClick={(e) => share(e, 'Únete a mi parche')}>{inner}</button>
          ) : (
            <Link key={it.key} to={d.to!} className="fcard invite" style={{ background: d.grad }}>{inner}</Link>
          );
        })}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
