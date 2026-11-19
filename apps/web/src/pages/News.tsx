import { MouseEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Globe2, MapPin, Smartphone, Newspaper, Play, Share2, Sparkles, Star, Youtube } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { ago } from '../lib/format';
import { shareLink } from '../lib/fx';
import { Empty, Loading } from '../components/ui';
import SocialWall, { Region, REGION_LABEL } from '../components/SocialWall';

export type News = {
  id: string; title: string; summary: string; url: string; image: string | null; source: string; sourceId: string;
  group: 'lasalle' | 'video'; region?: Region; kind?: 'video'; featured?: boolean; lang: 'es' | 'en' | 'pt'; publishedAt: string; topics: string[]; forYou: boolean;
};
type Resp = { items: News[]; topics: { id: string; label: string; mine: boolean }[]; sources: { id: string; name: string; site: string; ok: boolean; count: number }[]; updatedAt: number | null; hasVideos?: boolean; featured?: boolean };

// Arequipa, Colombia y México van primero; luego toda la red.
const TABS = [
  { id: 'all', label: 'Para ti', icon: Sparkles },
  { id: 'arequipa', label: 'Arequipa', icon: MapPin },
  { id: 'colombia', label: 'Colombia', icon: MapPin },
  { id: 'mexico', label: 'México', icon: MapPin },
  { id: 'lasalle', label: 'Red La Salle', icon: Globe2 },
  { id: 'video', label: 'Videos', icon: Youtube },
] as const;
type Tab = (typeof TABS)[number]['id'];
const isRegionTab = (t: Tab): t is 'arequipa' | 'colombia' | 'mexico' => t === 'arequipa' || t === 'colombia' || t === 'mexico';

// Imagen externa del medio: si no carga, la tarjeta queda sin foto.
export function NewsImage({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  const [ok, setOk] = useState(!!src);
  if (!src || !ok) return null;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setOk(false)} />;
}

export function NewsCard({ n, onShare }: { n: News; onShare?: (e: MouseEvent, n: News) => void }) {
  return (
    <article className={`news-card ${n.kind === 'video' ? 'is-video' : ''}`}>
      {n.kind === 'video' ? (
        <a className="news-video" href={n.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver video: ${n.title}`}>
          <NewsImage src={n.image} alt="" className="news-img" />
          <span className="news-play" aria-hidden><Play size={26} fill="currentColor" /></span>
        </a>
      ) : <NewsImage src={n.image} alt="" className="news-img" />}
      <div className="news-body">
        <p className="news-meta">
          <strong>{n.source}</strong> · {n.featured ? <span className="news-featured"><Star size={11} fill="currentColor" /> Destacado</span> : ago(n.publishedAt)}
          {n.region && n.region !== 'mundo' && <span className="news-region"><MapPin size={11} /> {REGION_LABEL[n.region]}</span>}
          {n.lang !== 'es' && <span className="news-lang">{n.lang.toUpperCase()}</span>}
          {n.forYou && <span className="news-foryou"><Sparkles size={12} /> Para ti</span>}
        </p>
        <h3><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a></h3>
        {n.summary && <p className="news-summary">{n.summary}</p>}
        <div className="news-actions">
          <a className="news-read" href={n.url} target="_blank" rel="noopener noreferrer">{n.kind === 'video' ? 'Ver en YouTube' : `Leer en ${n.source}`} <ExternalLink size={15} /></a>
          {onShare && <button className="news-share" onClick={(e) => onShare(e, n)} aria-label="Compartir noticia"><Share2 size={18} /></button>}
        </div>
      </div>
    </article>
  );
}

export default function NewsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [topic, setTopic] = useState('');
  const [wall, setWall] = useState<Region>('arequipa');
  const [toast, setToast] = useState<string | null>(null);
  const q = isRegionTab(tab) ? `group=all&region=${tab}` : `group=${tab}`;
  const { data, loading, error } = useApi<Resp>(`/news?${q}${topic ? `&topic=${topic}` : ''}&limit=40`);
  function pick(t: Tab) { setTab(t); if (isRegionTab(t)) setWall(t); }

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); }, [toast]);

  async function share(_e: MouseEvent, n: News) {
    const r = await shareLink(n.title, '/noticias');
    if (r === 'copied') setToast('Enlace copiado');
  }

  return (
    <div className="page news-page">
      <header className="news-head">
        <span className="post-ico gold"><Newspaper size={20} /></span>
        <div>
          <h1>La Salle hoy</h1>
          <p className="muted">Noticias y videos de las universidades y obras La Salle del mundo.</p>
        </div>
        <Link className="news-reels-btn" to="/noticias/reels"><Smartphone size={16} /> Modo vertical</Link>
      </header>

      <div className="news-tabs" role="tablist">
        {TABS.filter((t) => t.id !== 'video' || data?.hasVideos || tab === 'video').map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => pick(id)}><Icon size={16} /> {label}</button>
        ))}
      </div>

      {tab !== 'video' && tab !== 'lasalle' && <SocialWall region={wall} onRegion={(r) => { setWall(r); if (isRegionTab(tab) && r !== 'mundo') setTab(r); }} />}

      {data && (
        <div className="filters news-topics">
          <button className={!topic ? 'on' : ''} onClick={() => setTopic('')}>Todo</button>
          {data.topics.map((t) => <button key={t.id} className={`${topic === t.id ? 'on' : ''} ${t.mine ? 'mine' : ''}`} onClick={() => setTopic(t.id)}>{t.label}</button>)}
        </div>
      )}

      {loading && !data ? <Loading rows={3} /> : error ? <Empty title="No pudimos cargar las noticias">{error}</Empty> : data?.items.length ? (
        <div className="news-list">{data.items.map((n) => <NewsCard key={n.id} n={n} onShare={share} />)}</div>
      ) : (
        isRegionTab(tab)
          ? <Empty title={`Aún no hay notas web de ${REGION_LABEL[tab]}`}>Mientras tanto, mira sus publicaciones en las redes oficiales de arriba.</Empty>
          : <Empty title="Las noticias se están actualizando">Vuelve en unos minutos o prueba otra pestaña.</Empty>
      )}

      {data && (
        <p className="news-credits">
          {data.featured ? 'Destacados de la red La Salle. ' : 'Fuentes: '}{(data.featured ? [] : data.sources).map((s, i) => <span key={s.id}>{i ? ', ' : ''}<a href={s.site} target="_blank" rel="noopener noreferrer">{s.name}</a></span>)}{data.featured ? '' : '. '}
          Solo contenido oficial de la red La Salle. Parche muestra titulares y resúmenes breves y enlaza siempre a la publicación original.
        </p>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
