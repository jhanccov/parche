import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronUp, ExternalLink, Heart, Maximize2, Newspaper, Play, Share2, Sparkles, Star, X } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { ago } from '../lib/format';
import { burst, shareLink } from '../lib/fx';
import type { News } from '../pages/News';
import { REGION_LABEL, Region } from './SocialWall';

const LIKES_KEY = 'parche.newsLikes';
function readLikes(): string[] {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) ?? '[]'); } catch { return []; }
}
function saveLikes(ids: string[]) {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify(ids.slice(-300))); } catch { /* sin almacenamiento */ }
}

const FILTERS: { id: '' | Region; label: string }[] = [
  { id: '', label: 'Para ti' },
  { id: 'arequipa', label: 'Arequipa' },
  { id: 'colombia', label: 'Colombia' },
  { id: 'mexico', label: 'México' },
];

function Reel({ n, liked, onLike, onShare, first }: { n: News; liked: boolean; onLike: (e: MouseEvent | null, n: News) => void; onShare: (n: News) => void; first: boolean }) {
  const [img, setImg] = useState(!!n.image);
  const [pop, setPop] = useState(false);
  const lastTap = useRef(0);
  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!liked) onLike(null, n);
      setPop(true); setTimeout(() => setPop(false), 700);
    }
    lastTap.current = now;
  }
  return (
    <article className={`reel ${img ? 'has-img' : 'no-img'}`} onClick={tap}>
      {img ? (
        <img className="reel-bg" src={n.image!} alt="" loading={first ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setImg(false)} />
      ) : (
        <div className="reel-ph" aria-hidden><Newspaper size={72} /></div>
      )}
      <div className="reel-shade" aria-hidden />
      {n.kind === 'video' && (
        <a className="reel-play" href={n.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver video: ${n.title}`} onClick={(e) => e.stopPropagation()}>
          <Play size={34} fill="currentColor" />
        </a>
      )}
      {pop && <Heart className="reel-heart" size={110} fill="currentColor" aria-hidden />}

      <div className="reel-info">
        <p className="reel-chips">
          {n.region && n.region !== 'mundo' && <span className="reel-chip gold">{REGION_LABEL[n.region]}</span>}
          {n.featured ? <span className="reel-chip"><Star size={11} fill="currentColor" /> Destacado</span> : <span className="reel-chip">{ago(n.publishedAt)}</span>}
          {n.lang !== 'es' && <span className="reel-chip">{n.lang.toUpperCase()}</span>}
          {n.forYou && <span className="reel-chip gold"><Sparkles size={11} /> Para ti</span>}
        </p>
        <strong className="reel-src">{n.source}</strong>
        <h3>{n.title}</h3>
        {n.summary && <p className="reel-sum">{n.summary}</p>}
        <a className="reel-read" href={n.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {n.kind === 'video' ? 'Ver en YouTube' : 'Leer la nota'} <ExternalLink size={15} />
        </a>
      </div>

      <div className="reel-rail" onClick={(e) => e.stopPropagation()}>
        <button className={`reel-btn ${liked ? 'on' : ''}`} onClick={(e) => onLike(e, n)} aria-pressed={liked} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}>
          <Heart size={26} fill={liked ? 'currentColor' : 'none'} /><small>{liked ? 'Te gusta' : 'Me gusta'}</small>
        </button>
        <button className="reel-btn" onClick={() => onShare(n)} aria-label="Compartir"><Share2 size={24} /><small>Compartir</small></button>
        <a className="reel-btn" href={n.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir la publicación original"><ExternalLink size={24} /><small>Abrir</small></a>
      </div>

      {first && <span className="reel-hint" aria-hidden><ChevronUp size={18} /> Desliza</span>}
    </article>
  );
}

// Noticias de la red La Salle en formato vertical, una por pantalla, como TikTok o Reels.
export default function NewsReels({ full = false, limit = 12 }: { full?: boolean; limit?: number }) {
  const nav = useNavigate();
  const [region, setRegion] = useState<'' | Region>('');
  const { data, loading } = useApi<{ items: News[] }>(`/news?group=all${region ? `&region=${region}` : ''}&limit=${limit}`);
  const [likes, setLikes] = useState<string[]>(readLikes);
  const [idx, setIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const items = data?.items ?? [];
  const total = items.length + (full ? 0 : 1);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { box.current?.scrollTo({ top: 0 }); setIdx(0); }, [region]);

  const go = useCallback((d: number) => {
    const el = box.current;
    if (el) el.scrollBy({ top: d * el.clientHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); go(-1); }
      if (e.key === 'Escape') nav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full, go, nav]);

  function onScroll() {
    const el = box.current;
    if (el) setIdx(Math.round(el.scrollTop / Math.max(1, el.clientHeight)));
  }

  function like(e: MouseEvent | null, n: News) {
    const on = !likes.includes(n.id);
    if (on && e?.currentTarget) burst(e.currentTarget as Element);
    const next = on ? [...likes, n.id] : likes.filter((x) => x !== n.id);
    setLikes(next); saveLikes(next);
  }

  async function share(n: News) {
    if ((await shareLink(n.title, '/noticias')) === 'copied') setToast('Enlace copiado');
  }

  return (
    <section className={`reels ${full ? 'full' : ''}`} aria-label="La Salle hoy en formato vertical">
      <div className="reels-top">
        {full ? (
          <button className="reels-close" onClick={() => nav(-1)} aria-label="Cerrar"><X size={22} /></button>
        ) : <strong className="reels-title"><Newspaper size={16} /> La Salle hoy</strong>}
        <div className="reels-filters" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.id || 'all'} role="tab" aria-selected={region === f.id} className={region === f.id ? 'on' : ''} onClick={() => setRegion(f.id)}>{f.label}</button>
          ))}
        </div>
        {!full && <Link className="reels-max" to="/noticias/reels" aria-label="Ver en pantalla completa"><Maximize2 size={18} /></Link>}
      </div>

      <div className="reels-track" ref={box} onScroll={onScroll} tabIndex={0}>
        {loading && !data ? (
          <article className="reel no-img"><div className="reel-ph"><Newspaper size={64} /><span>Cargando noticias...</span></div></article>
        ) : items.length ? (
          <>
            {items.map((n, i) => <Reel key={n.id} n={n} first={i === 0} liked={likes.includes(n.id)} onLike={like} onShare={share} />)}
            {!full && (
              <article className="reel no-img reel-end">
                <div className="reel-ph">
                  <Newspaper size={56} />
                  <span>Hay más noticias de la red La Salle</span>
                  <Link className="reel-read" to="/noticias/reels">Seguir viendo <Maximize2 size={15} /></Link>
                  <Link className="reel-link" to="/noticias">Ver como lista y redes oficiales</Link>
                </div>
              </article>
            )}
          </>
        ) : (
          <article className="reel no-img"><div className="reel-ph"><Newspaper size={56} /><span>Aún no hay notas aquí. Mira las redes oficiales en La Salle hoy.</span><Link className="reel-read" to="/noticias">Ir a La Salle hoy</Link></div></article>
        )}
      </div>

      {items.length > 0 && <span className="reels-count" aria-live="polite">{Math.min(idx + 1, total)} / {total}</span>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
