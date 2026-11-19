import { useEffect, useRef, useState } from 'react';
import { AtSign, ExternalLink, Facebook, Globe, Instagram, Linkedin, MapPin, Music2, ShieldCheck, Youtube } from 'lucide-react';
import { useApi } from '../lib/useApi';

export type Region = 'arequipa' | 'colombia' | 'mexico' | 'mundo';
type Network = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'linkedin' | 'web';
type Social = { region: Region; network: Network; name: string; handle: string; url: string; embed: boolean };

export const REGION_LABEL: Record<Region, string> = { arequipa: 'Arequipa', colombia: 'Colombia', mexico: 'México', mundo: 'Mundo' };
const ICON = { facebook: Facebook, instagram: Instagram, tiktok: Music2, youtube: Youtube, x: AtSign, linkedin: Linkedin, web: Globe };
const NET_LABEL: Record<Network, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn', web: 'Sitio web' };

// Plugin oficial de página de Facebook. No se carga hasta que el estudiante lo pide,
// porque Facebook puede usar cookies propias dentro del recuadro.
function FacebookPage({ page }: { page: Social }) {
  const [on, setOn] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setW(Math.max(180, Math.min(500, Math.floor(el.clientWidth))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(page.url)}&tabs=timeline&width=${w}&height=560&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=es_LA`;
  return (
    <div className="fb-box" ref={box}>
      {on ? (
        <iframe key={w} title={`Publicaciones de ${page.name} en Facebook`} src={src} width={w} height={560} loading="lazy"
          allow="encrypted-media; clipboard-write; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button className="fb-load" onClick={() => setOn(true)}>
          <span className="fb-load-ico"><Facebook size={22} /></span>
          <span>
            <strong>Ver publicaciones de {page.name}</strong>
            <small><ShieldCheck size={13} /> Se carga desde Facebook solo si tocas aquí</small>
          </span>
        </button>
      )}
    </div>
  );
}

export function SocialLinks({ items }: { items: Social[] }) {
  return (
    <div className="social-links">
      {items.map((s) => {
        const Icon = ICON[s.network];
        return (
          <a key={s.url} className={`social-link net-${s.network}`} href={s.url} target="_blank" rel="noopener noreferrer">
            <span className="social-ico"><Icon size={18} /></span>
            <span className="social-txt"><strong>{NET_LABEL[s.network]}</strong><small>{s.network === 'web' ? s.handle : `@${s.handle}`}</small></span>
            <ExternalLink size={14} className="social-go" />
          </a>
        );
      })}
    </div>
  );
}

// "Redes oficiales": Arequipa primero, luego Colombia y México.
export default function SocialWall({ region, onRegion }: { region: Region; onRegion: (r: Region) => void }) {
  const { data } = useApi<{ items: Social[] }>('/news/socials');
  const items = data?.items ?? [];
  const regions = (['arequipa', 'colombia', 'mexico', 'mundo'] as Region[]).filter((r) => items.some((s) => s.region === r));
  const mine = items.filter((s) => s.region === region);
  const pages = mine.filter((s) => s.embed);
  if (!items.length) return null;
  return (
    <section className="social-wall card" aria-label="Redes oficiales">
      <div className="social-head">
        <h2><MapPin size={18} /> Redes oficiales</h2>
        <div className="social-regions" role="tablist">
          {regions.map((r) => (
            <button key={r} role="tab" aria-selected={region === r} className={region === r ? 'on' : ''} onClick={() => onRegion(r)}>{REGION_LABEL[r]}</button>
          ))}
        </div>
      </div>
      {pages.map((p) => <FacebookPage key={p.url} page={p} />)}
      <SocialLinks items={mine} />
      {region === 'mexico' && !pages.length && <p className="social-note">Pronto más redes de La Salle México.</p>}
    </section>
  );
}
