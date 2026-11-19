import { useEffect, useMemo, useState, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, HandHelping, Heart, MapPin, Mountain, Plus, Share2, Users, UserPlus, Check, Hand, MessageCircle, ChevronRight, Rocket, Newspaper } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { ago, CATEGORIES, when } from '../lib/format';
import { Avatar, Flag, Loading } from '../components/ui';
import { REGION_LABEL } from '../components/SocialWall';
import { News, NewsImage } from './News';
import { burst, setThemeColor, shareLink } from '../lib/fx';

const PROMPTS = ['¿Qué aprendemos hoy?', 'Tu parche te está esperando', 'Ayuda a alguien y suma puntos', 'Arma equipo para un reto real'];

// Foto sobre degradado: la imagen manda, el overlay garantiza lectura.
// Si la foto falla, queda el navy de fondo y el texto sigue legible.
const photo = (img?: string, overlay = 'linear-gradient(180deg, color-mix(in srgb, var(--night) 0%, transparent) 35%, color-mix(in srgb, var(--night) 72%, transparent))') =>
  img ? { backgroundColor: 'var(--navy)', backgroundImage: `${overlay}, url(${img})` } as const : {};

type Item =
  | { kind: 'event'; key: string; d: any }
  | { kind: 'community'; key: string; d: any }
  | { kind: 'help'; key: string; d: any }
  | { kind: 'challenge'; key: string; d: any }
  | { kind: 'invite'; key: string; d: { title: string; text: string; cta: string; to?: string; share?: boolean; img: string } };

const INVITES: Item[] = [
  { kind: 'invite', key: 'inv-crear', d: { title: 'Crea el parche de tu carrera', text: 'Un club, un semillero o un grupo de estudio. Te guiamos paso a paso hasta que esté activo.', cta: 'Crear comunidad', to: '/comunidades/nueva', img: '/img/invite-crear.jpg' } },
  { kind: 'invite', key: 'inv-ayuda', d: { title: '¿Te trabaste en un curso?', text: 'Pide ayuda y le llega a quien domina el tema, en tu sede o en otro país.', cta: 'Pedir ayuda', to: '/mentoria/nueva', img: '/img/invite-ayuda.jpg' } },
  { kind: 'invite', key: 'inv-juanita', d: { title: '¡Choca esos cinco!', text: 'Juanita, la mascota de La Salle Bogotá, celebra cada hora de mentoría. Ayuda a alguien hoy y gana tu insignia de Mentor.', cta: 'Quiero ayudar', to: '/mentoria', img: '/img/mascota-juanita.webp' } },
  { kind: 'invite', key: 'inv-share', d: { title: 'Trae a tu salón', text: 'Mientras más compañeros entren, más rápido encuentras ayuda y equipo.', cta: 'Compartir Parche', share: true, img: '/img/invite-compartir.jpg' } },
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
  const news = useApi<{ items: News[] }>('/news?group=all&limit=8');
  const [prompt, setPrompt] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setThemeColor('default'); }, []);
  const [liked, setLiked] = useState<string | null>(null);

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
      if (i === 4) out.push(INVITES[2]);
      if (i === 8) out.push(INVITES[3]);
    });
    for (const inv of INVITES) if (!out.includes(inv)) out.push(inv);
    return out;
  }, [events.data, comms.data, help.data, challenges.data, me?.id]);

  async function share(e: MouseEvent, title: string, path = '/') {
    const r = await shareLink(title, path);
    if (r === 'copied') setToast('Enlace copiado');
  }

  // Acciones optimistas: la interfaz responde al instante y se corrige si el servidor falla.
  async function rsvp(e: MouseEvent | null, d: any, fromDoubleTap = false) {
    const prev = events.data;
    const on = !d.rsvp;
    if (fromDoubleTap && !on) return;
    events.setData((list) => (list ?? []).map((x) => (x.id === d.id ? { ...x, rsvp: on, going: x.going + (on ? 1 : -1) } : x)));
    if (on) { e?.currentTarget && burst(e.currentTarget as Element); setLiked(d.id); setTimeout(() => setLiked(null), 800); }
    try {
      await api(`/events/${d.id}/rsvp`, { method: 'POST' });
    } catch (err: any) {
      events.setData(prev);
      if (err?.name !== 'AbortError') setToast(err.message);
    }
  }

  async function join(e: MouseEvent, d: any) {
    if (d.joined) return nav(`/comunidades/${d.id}`);
    const prev = comms.data;
    burst(e.currentTarget);
    comms.setData((list) => (list ?? []).map((x) => (x.id === d.id ? { ...x, joined: true, members: x.members + 1 } : x)));
    setToast(`Ya eres parte de ${d.name}`);
    try {
      await api(`/communities/${d.id}/join`, { method: 'POST' });
    } catch (err: any) {
      comms.setData(prev);
      setToast(err.message);
    }
  }

  async function offer(e: MouseEvent, d: any) {
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
      <section
        className="home-hero home-cover"
        style={photo('/img/portada-colombia.jpg', 'linear-gradient(180deg, color-mix(in srgb, var(--night) 15%, transparent) 0%, color-mix(in srgb, var(--night) 5%, transparent) 35%, color-mix(in srgb, var(--night) 88%, transparent) 100%)')}
        role="img"
        aria-label="Delegación de ULASALLE Arequipa en la Universidad de La Salle, Bogotá, con las banderas del Perú, La Salle Internacional y Arequipa"
      >
        <span className="cover-tag"><Flag country="Perú" /> Perú y <Flag country="Colombia" /> Colombia, una sola red La Salle</span>
        <h1>Hola, {first} <span className="wave" aria-hidden><Hand size={30} /></span></h1>
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
                <span className="story-in" style={cat?.img ? { backgroundImage: `url(${cat.img})` } : { background: cat?.grad }} aria-hidden />
              </span>
              <span className="story-name">{c.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Compositor al estilo LinkedIn: la acción principal siempre a un toque */}
      <div className="composer">
        <Avatar name={me?.name} size={42} />
        <Link to="/mentoria/nueva" className="composer-input">¿En qué necesitas ayuda hoy?</Link>
        <div className="composer-actions">
          <Link to="/mentoria/nueva"><HandHelping size={18} /> Pedir ayuda</Link>
          <Link to="/comunidades/nueva"><Rocket size={18} /> Comunidad</Link>
          <Link to="/retos"><Mountain size={18} /> Reto</Link>
        </div>
      </div>

      {!!news.data && (
        <section className="tech-strip" aria-label="La Salle hoy">
          <div className="tech-strip-head">
            <h2><Newspaper size={18} /> La Salle hoy</h2>
            <Link to="/noticias">Ver todo <ChevronRight size={16} /></Link>
          </div>
          <div className="tech-scroll">
            <Link to="/noticias" className="tech-card social">
              <span className="tech-img tech-ph social-ph" aria-hidden><MapPin size={26} /></span>
              <span className="tech-src">Arequipa · Redes oficiales</span>
              <strong>Lo último de ULASALLE en Facebook e Instagram</strong>
            </Link>
            {news.data.items.map((n) => (
              <a key={n.id} className="tech-card" href={n.url} target="_blank" rel="noopener noreferrer">
                {n.image ? <NewsImage src={n.image} alt="" className="tech-img" /> : <span className="tech-img tech-ph" aria-hidden><Newspaper size={26} /></span>}
                <span className="tech-src">{n.kind === 'video' ? 'Video · ' : ''}{n.region && n.region !== 'mundo' ? `${REGION_LABEL[n.region]} · ` : ''}{n.source}{n.forYou ? ' · Para ti' : ''}</span>
                <strong>{n.title}</strong>
              </a>
            ))}
            <Link to="/noticias" className="tech-card more"><Newspaper size={22} /><strong>Más de la red La Salle</strong></Link>
          </div>
        </section>
      )}

      <h2 className="feed-title">Para ti</h2>

      <div className="feed">
        {!events.data && !comms.data && <Loading rows={2} />}
        {feed.map((it) => {
          if (it.kind === 'event') {
            const d = it.d; const cat = CATEGORIES[d.category];
            const to = d.community_id ? `/comunidades/${d.community_id}` : '/';
            return (
              <article key={it.key} className="post">
                <header className="post-head">
                  <span className="post-ico gold"><CalendarDays size={18} /></span>
                  <div><Link to={to}><strong>{d.community ?? 'Evento'}</strong></Link><small>Evento · {when(d.starts_at)}</small></div>
                </header>
                <div className="post-media" style={{ backgroundImage: `url(${cat?.img ?? CATEGORIES.tecnologia.img})` }} onDoubleClick={() => rsvp(null, d, true)} role="img" aria-label={`Imagen del evento ${d.title}. Doble toque para marcar que vas.`}>
                  {liked === d.id && <Heart className="big-heart" size={96} fill="currentColor" aria-hidden />}
                </div>
                <div className="post-actions">
                  <button className={`pa ${d.rsvp ? 'on' : ''}`} onClick={(e) => rsvp(e, d)} aria-pressed={d.rsvp}><Heart size={24} fill={d.rsvp ? 'currentColor' : 'none'} /> {d.rsvp ? 'Voy' : 'Asistiré'}</button>
                  <Link className="pa" to={to}><MessageCircle size={24} /> Comentar</Link>
                  <button className="pa" onClick={(e) => share(e, d.title)}><Share2 size={22} /> Compartir</button>
                </div>
                <div className="post-body">
                  <p className="post-likes">{d.going} {d.going === 1 ? 'persona va' : 'personas van'}</p>
                  <h3><Link to={to}>{d.title}</Link></h3>
                  <p className="post-meta"><MapPin size={14} /> {d.place || 'Lugar por definir'}</p>
                </div>
              </article>
            );
          }
          if (it.kind === 'community') {
            const d = it.d; const cat = CATEGORIES[d.category];
            const pct = Math.min(100, Math.round((d.members / Math.max(1, d.goal_members)) * 100));
            return (
              <article key={it.key} className="post">
                <header className="post-head">
                  <span className="post-ico"><Users size={18} /></span>
                  <div><Link to={`/comunidades/${d.id}`}><strong>{d.name}</strong></Link><small>{['Comunidad', cat?.label, d.university].filter(Boolean).join(' · ')}</small></div>
                  <button className={`follow ${d.joined ? 'on' : ''}`} onClick={(e) => join(e, d)}>{d.joined ? 'Miembro' : 'Unirme'}</button>
                </header>
                <Link to={`/comunidades/${d.id}`} className="post-media short" style={{ backgroundImage: `url(${cat?.img})` }} aria-label={`Ver ${d.name}`} />
                <div className="post-body">
                  <p className="post-text">{d.description}</p>
                  <div className="post-progress"><span style={{ width: `${Math.max(6, pct)}%` }} /></div>
                  <p className="post-meta">{d.members} de {d.goal_members} miembros para activarse</p>
                </div>
                <div className="post-actions">
                  <button className={`pa ${d.joined ? 'on' : ''}`} onClick={(e) => join(e, d)}>{d.joined ? <Check size={22} /> : <UserPlus size={22} />} {d.joined ? 'Eres miembro' : 'Unirme'}</button>
                  <Link className="pa" to={`/comunidades/${d.id}`}><MessageCircle size={22} /> Conversación</Link>
                  <button className="pa" onClick={(e) => share(e, d.name, `/comunidades/${d.id}`)}><Share2 size={22} /> Compartir</button>
                </div>
              </article>
            );
          }
          if (it.kind === 'help') {
            const d = it.d;
            return (
              <article key={it.key} className="post">
                <header className="post-head">
                  <Avatar name={d.author} size={40} />
                  <div><strong>{d.author?.split(' ').slice(0, 2).join(' ')}</strong><small>{[d.author_career, d.author_university, d.created_at && ago(d.created_at)].filter(Boolean).join(' · ')}</small></div>
                  <span className="post-tag">{d.topic}</span>
                </header>
                <div className="post-body">
                  <h3><Link to={`/mentoria/${d.id}`}>{d.title}</Link></h3>
                  {d.detail && <p className="post-text">{d.detail}</p>}
                </div>
                <div className="post-actions">
                  <button className="pa primary" onClick={(e) => offer(e, d)}><HandHelping size={22} /> Ofrezco ayuda</button>
                  <button className="pa" onClick={(e) => share(e, `Alguien necesita ayuda en ${d.topic}`)}><Share2 size={22} /> Compartir</button>
                </div>
              </article>
            );
          }
          if (it.kind === 'challenge') {
            const d = it.d;
            return (
              <article key={it.key} className="post">
                <header className="post-head">
                  <span className="post-ico navy"><Mountain size={18} /></span>
                  <div><Link to={`/retos/${d.id}`}><strong>Reto del territorio</strong></Link><small><Flag country={d.country} /> {d.territory}</small></div>
                </header>
                <Link to={`/retos/${d.id}`} className="post-media short" style={{ backgroundImage: `url(${CATEGORIES.territorio.img})` }} aria-label={`Ver reto ${d.title}`} />
                <div className="post-body">
                  <h3><Link to={`/retos/${d.id}`}>{d.title}</Link></h3>
                  <p className="post-text">{d.summary}</p>
                  <p className="post-meta">{d.participants ? `${d.participants} estudiantes en ${d.teams} equipos` : 'Aún sin equipo, puedes ser el primero'}</p>
                </div>
                <div className="post-actions">
                  <Link className="pa primary" to={`/retos/${d.id}`}><Mountain size={22} /> Ver reto</Link>
                  <button className="pa" onClick={(e) => share(e, d.title, `/retos/${d.id}`)}><Share2 size={22} /> Compartir</button>
                </div>
              </article>
            );
          }
          const d = it.d;
          const inner = (
            <>
              <span className="promo-img" style={{ backgroundImage: `url(${d.img})` }} aria-hidden />
              <span className="promo-text">
                <strong>{d.title}</strong>
                <small>{d.text}</small>
                <span className="promo-cta">{d.cta} <ChevronRight size={16} /></span>
              </span>
            </>
          );
          return d.share ? (
            <button key={it.key} className="promo" onClick={(e) => share(e, 'Únete a mi parche')}>{inner}</button>
          ) : (
            <Link key={it.key} to={d.to!} className="promo">{inner}</Link>
          );
        })}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
