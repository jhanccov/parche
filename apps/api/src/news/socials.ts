import { isRegion, parseList, Region, REGIONS } from './sources.js';

// Redes oficiales de la red La Salle, por región y en orden de prioridad.
// Facebook e Instagram no dejan leer publicaciones sin una app aprobada por Meta,
// así que Parche enlaza a los perfiles y, para páginas públicas de Facebook,
// ofrece el plugin oficial de página que el estudiante carga con un toque.
export type Network = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'linkedin' | 'web';
export type Social = { region: Region; network: Network; name: string; handle: string; url: string; embed: boolean };

const NETWORKS: Network[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'web'];
const s = (region: Region, network: Network, name: string, handle: string, url: string): Social => ({ region, network, name, handle, url, embed: network === 'facebook' });

const BASE: Social[] = [
  s('arequipa', 'facebook', 'Universidad La Salle', 'ulasalle', 'https://www.facebook.com/ulasalle'),
  s('arequipa', 'instagram', 'Universidad La Salle', 'ulasalleperu', 'https://www.instagram.com/ulasalleperu'),
  s('arequipa', 'web', 'ulasalle.edu.pe', 'ulasalle.edu.pe', 'https://www.ulasalle.edu.pe'),
  s('colombia', 'facebook', 'Egresados Unisalle', 'AlumniUnisalle', 'https://www.facebook.com/AlumniUnisalle'),
  s('colombia', 'instagram', 'Universidad de La Salle', 'unisallecol', 'https://www.instagram.com/unisallecol'),
  s('colombia', 'x', 'Unisalle', 'Unisalle', 'https://x.com/Unisalle'),
  s('colombia', 'instagram', 'Egresados Unisalle', 'alumniunisalle', 'https://www.instagram.com/alumniunisalle'),
  s('colombia', 'web', 'lasalle.edu.co', 'lasalle.edu.co', 'https://www.lasalle.edu.co'),
  s('mexico', 'web', 'lasalle.mx', 'lasalle.mx', 'https://lasalle.mx'),
  s('mundo', 'web', 'lasalle.org', 'lasalle.org', 'https://www.lasalle.org'),
];

function handleOf(url: URL) {
  return url.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '') || url.hostname.replace(/^www\./, '');
}

// Más redes sin tocar el código, desde Render:
// NEWS_SOCIAL_PAGES = "mexico|facebook|Universidad La Salle México|https://www.facebook.com/pagina; colombia|tiktok|Unisalle|https://www.tiktok.com/@cuenta"
export function loadSocials(env: NodeJS.ProcessEnv = process.env): Social[] {
  const extra = parseList(env.NEWS_SOCIAL_PAGES).flatMap(([region, network, name, raw]) => {
    if (!isRegion(region) || !NETWORKS.includes(network as Network) || !name || !raw) return [];
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:') return [];
      const fb = network === 'facebook';
      if (fb && !/(^|\.)facebook\.com$/.test(url.hostname)) return [];
      return [{ region, network: network as Network, name: name.slice(0, 60), handle: handleOf(url).slice(0, 40), url: url.toString(), embed: fb }];
    } catch { return []; }
  });
  const all = [...BASE, ...extra];
  const seen = new Set<string>();
  const order = REGIONS.map((r) => r.id);
  return all
    .filter((x) => { const k = x.url.toLowerCase().replace(/\/$/, ''); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => order.indexOf(a.region) - order.indexOf(b.region));
}
