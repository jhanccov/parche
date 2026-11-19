import { MouseEvent, useEffect, useState } from 'react';
import { ExternalLink, Flame, Code2, Globe2, Newspaper, Share2, Sparkles } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { ago } from '../lib/format';
import { shareLink } from '../lib/fx';
import { Empty, Loading } from '../components/ui';

export type News = {
  id: string; title: string; summary: string; url: string; image: string | null; source: string; sourceId: string;
  group: 'es' | 'dev' | 'trend'; lang: 'es' | 'en'; publishedAt: string; topics: string[]; forYou: boolean;
};
type Resp = { items: News[]; topics: { id: string; label: string; mine: boolean }[]; sources: { id: string; name: string; site: string; ok: boolean; count: number }[]; updatedAt: number | null };

const TABS = [
  { id: 'all', label: 'Para ti', icon: Sparkles },
  { id: 'es', label: 'En español', icon: Globe2 },
  { id: 'dev', label: 'Para devs', icon: Code2 },
  { id: 'trend', label: 'Tendencias', icon: Flame },
] as const;

// Imagen externa del medio: si no carga, la tarjeta queda sin foto.
export function NewsImage({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  const [ok, setOk] = useState(!!src);
  if (!src || !ok) return null;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setOk(false)} />;
}

export function NewsCard({ n, onShare }: { n: News; onShare?: (e: MouseEvent, n: News) => void }) {
  return (
    <article className="news-card">
      <NewsImage src={n.image} alt="" className="news-img" />
      <div className="news-body">
        <p className="news-meta">
          <strong>{n.source}</strong> · {ago(n.publishedAt)}
          {n.lang === 'en' && <span className="news-lang">EN</span>}
          {n.forYou && <span className="news-foryou"><Sparkles size={12} /> Para ti</span>}
        </p>
        <h3><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a></h3>
        {n.summary && <p className="news-summary">{n.summary}</p>}
        <div className="news-actions">
          <a className="news-read" href={n.url} target="_blank" rel="noopener noreferrer">Leer en {n.source} <ExternalLink size={15} /></a>
          {onShare && <button className="news-share" onClick={(e) => onShare(e, n)} aria-label="Compartir noticia"><Share2 size={18} /></button>}
        </div>
      </div>
    </article>
  );
}

export default function NewsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [topic, setTopic] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const { data, loading, error } = useApi<Resp>(`/news?group=${tab}${topic ? `&topic=${topic}` : ''}&limit=40`);

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
          <h1>Tech hoy</h1>
          <p className="muted">Lo nuevo en tecnología, ordenado según lo que quieres aprender.</p>
        </div>
      </header>

      <div className="news-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Icon size={16} /> {label}</button>
        ))}
      </div>

      {data && (
        <div className="filters news-topics">
          <button className={!topic ? 'on' : ''} onClick={() => setTopic('')}>Todo</button>
          {data.topics.map((t) => <button key={t.id} className={`${topic === t.id ? 'on' : ''} ${t.mine ? 'mine' : ''}`} onClick={() => setTopic(t.id)}>{t.label}</button>)}
        </div>
      )}

      {loading && !data ? <Loading rows={3} /> : error ? <Empty title="No pudimos cargar las noticias">{error}</Empty> : data?.items.length ? (
        <div className="news-list">{data.items.map((n) => <NewsCard key={n.id} n={n} onShare={share} />)}</div>
      ) : (
        <Empty title="Las noticias se están actualizando">Vuelve en unos minutos o prueba otra pestaña.</Empty>
      )}

      {data && (
        <p className="news-credits">
          Fuentes: {data.sources.map((s, i) => <span key={s.id}>{i ? ', ' : ''}<a href={s.site} target="_blank" rel="noopener noreferrer">{s.name}</a></span>)}.
          Parche muestra titulares y resúmenes breves y enlaza siempre a la nota original.
        </p>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
