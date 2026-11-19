import { XMLParser } from 'fast-xml-parser';
import { SKILL_TOPICS, SOURCES, Source, TOPICS, Group } from './sources.js';
import { FEATURED } from './featured.js';

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  source: string;
  sourceId: string;
  group: Group;
  kind?: 'video';
  featured?: boolean;
  lang: 'es' | 'en' | 'pt';
  publishedAt: string;
  topics: string[];
  score?: number;
};

const UA = 'Mozilla/5.0 (compatible; ParcheBot/1.0; +https://github.com/jhanccov/parche) app academica de la red La Salle';
const TTL_MS = 45 * 60 * 1000;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text', cdataPropName: false as any });

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '...', ndash: '-', mdash: '-', laquo: '"', raquo: '"', ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'" };
export function cleanText(html: unknown, max = 220): string {
  let s = typeof html === 'string' ? html : html && typeof html === 'object' && '#text' in (html as any) ? String((html as any)['#text']) : '';
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  s = s.replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCharCode(parseInt(n, 16)));
  s = s.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
  s = s.replace(/\s+/g, ' ').trim();
  // Sin rayas largas ni comillas angulares en la interfaz
  s = s.replace(/[\u2014\u2013]/g, '-').replace(/[\u00ab\u00bb\u201c\u201d]/g, '"');
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '...';
  return s;
}

export function safeUrl(u: unknown): string | null {
  if (typeof u !== 'string') return null;
  try {
    const url = new URL(u.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function classify(text: string): string[] {
  const t = ` ${norm(text)} `;
  return Object.entries(TOPICS).filter(([, v]) => v.words.some((w) => t.includes(norm(w)))).map(([k]) => k);
}

export function topicsForInterests(interests: string[] = []): string[] {
  return [...new Set(interests.flatMap((i) => SKILL_TOPICS[norm(i)] ?? []))];
}

async function get(url: string, kind: 'text' | 'json') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, accept: kind === 'json' ? 'application/json' : 'application/rss+xml, application/xml, text/xml, */*' } });
    if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
    return kind === 'json' ? res.json() : res.text();
  } finally {
    clearTimeout(t);
  }
}

const arr = <T>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

function imageFrom(it: any): string | null {
  const cands = [
    ...arr(it['media:content']).map((m: any) => m?.['@url']),
    ...arr(it['media:thumbnail']).map((m: any) => m?.['@url']),
    ...arr(it.enclosure).filter((e: any) => !e?.['@type'] || String(e['@type']).startsWith('image')).map((e: any) => e?.['@url']),
  ];
  const html = String(it['content:encoded'] ?? it.description ?? it.content?.['#text'] ?? it.content ?? '');
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) cands.push(m[1]);
  for (const c of cands) { const u = safeUrl(c); if (u) return u; }
  return null;
}

export function parseFeed(xml: string, src: Pick<Source, 'id' | 'name' | 'group' | 'lang'>): NewsItem[] {
  const doc = parser.parse(xml);
  const rssItems = arr(doc?.rss?.channel?.item);
  const atomItems = arr(doc?.feed?.entry);
  const items = rssItems.length ? rssItems : atomItems;
  return items.slice(0, 30).flatMap((it: any) => {
    const link = safeUrl(typeof it.link === 'string' ? it.link : it.link?.['@href'] ?? arr(it.link).find((l: any) => l?.['@rel'] !== 'self')?.['@href']);
    const title = cleanText(it.title, 160);
    if (!link || !title) return [];
    const summary = cleanText(it.description ?? it.summary ?? it['content:encoded'] ?? it.content, 220);
    const date = new Date(it.pubDate ?? it.published ?? it.updated ?? it['dc:date'] ?? Date.now());
    return [{
      id: `${src.id}:${link}`, title, summary, url: link, image: imageFrom(it), source: src.name, sourceId: src.id,
      group: src.group, lang: src.lang, publishedAt: (isNaN(+date) ? new Date() : date).toISOString(), topics: classify(`${title} ${summary}`),
    }];
  });
}

async function fetchRss(src: Extract<Source, { kind: 'rss' }>): Promise<NewsItem[]> {
  return parseFeed(String(await get(src.url, 'text')), src);
}

async function fetchWp(src: Extract<Source, { kind: 'wp' }>): Promise<NewsItem[]> {
  const errors: string[] = [];
  // Prueba la API de WordPress y luego el RSS, en cada dirección del sitio.
  for (const base of src.bases) {
    try {
      const posts = (await get(`${base}/wp-json/wp/v2/posts?per_page=15&_embed=1`, 'json')) as any[];
      if (!Array.isArray(posts) || !posts.length) throw new Error('sin entradas');
      const items = posts.flatMap((p) => {
        const url = safeUrl(p.link);
        const title = cleanText(p.title?.rendered, 160);
        if (!url || !title) return [];
        const media = p._embedded?.['wp:featuredmedia']?.[0];
        const sizes = media?.media_details?.sizes ?? {};
        const image = safeUrl(sizes.medium_large?.source_url ?? sizes.large?.source_url ?? media?.source_url);
        const summary = cleanText(p.excerpt?.rendered, 220);
        return [{ id: `${src.id}:${p.id}`, title, summary, url, image, source: src.name, sourceId: src.id, group: src.group, lang: src.lang,
          publishedAt: new Date(p.date_gmt ? `${p.date_gmt}Z` : p.date ?? Date.now()).toISOString(), topics: classify(`${title} ${summary}`) }];
      });
      if (items.length) return items;
    } catch (e: any) { errors.push(String(e?.message ?? e)); }
    try {
      const items = parseFeed(String(await get(`${base}/feed/`, 'text')), src);
      if (items.length) return items;
    } catch (e: any) { errors.push(String(e?.message ?? e)); }
  }
  throw new Error(errors.join(' | ').slice(0, 200) || 'sin noticias');
}

async function fetchYoutube(src: Extract<Source, { kind: 'youtube' }>): Promise<NewsItem[]> {
  const doc = parser.parse(String(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(src.channelId)}`, 'text')));
  return arr(doc?.feed?.entry).slice(0, 10).flatMap((e: any) => {
    const vid = String(e['yt:videoId'] ?? '').replace(/[^\w-]/g, '');
    const url = safeUrl(arr(e.link)[0]?.['@href'] ?? (vid ? `https://www.youtube.com/watch?v=${vid}` : ''));
    const title = cleanText(e.title, 160);
    if (!url || !title) return [];
    const group = e['media:group'] ?? {};
    return [{ id: `${src.id}:${vid || url}`, title, summary: cleanText(group['media:description'], 160), url,
      image: safeUrl(group['media:thumbnail']?.['@url']) ?? (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null),
      source: src.name, sourceId: src.id, group: src.group, kind: 'video' as const, lang: src.lang,
      publishedAt: new Date(e.published ?? Date.now()).toISOString(), topics: classify(title) }];
  });
}

type Entry = { items: NewsItem[]; fetchedAt: number; ok: boolean; error?: string };
const cache = new Map<string, Entry>();
let refreshing: Promise<void> | null = null;

export async function refreshAll(force = false) {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    await Promise.all(SOURCES.map(async (src) => {
      const prev = cache.get(src.id);
      if (!force && prev && Date.now() - prev.fetchedAt < TTL_MS) return;
      try {
        const items = src.kind === 'rss' ? await fetchRss(src) : src.kind === 'wp' ? await fetchWp(src) : await fetchYoutube(src);
        if (!items.length) throw new Error('sin noticias');
        cache.set(src.id, { items, fetchedAt: Date.now(), ok: true });
      } catch (e: any) {
        // Si una fuente falla se conservan sus últimas noticias.
        cache.set(src.id, { items: prev?.items ?? [], fetchedAt: Date.now(), ok: false, error: String(e?.message ?? e).slice(0, 120) });
      }
    }));
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export function clearNewsCache() { cache.clear(); }

export function newsStatus() {
  return SOURCES.map((s) => {
    const e = cache.get(s.id);
    return { id: s.id, name: s.name, ok: e?.ok ?? false, count: e?.items.length ?? 0, checkedAt: e ? new Date(e.fetchedAt).toISOString() : null, error: e?.error ?? null };
  });
}

export async function getNews(opts: { group?: Group | 'all'; topic?: string; interests?: string[]; limit?: number }) {
  const stale = SOURCES.some((s) => { const e = cache.get(s.id); return !e || Date.now() - e.fetchedAt > TTL_MS; });
  const empty = SOURCES.every((s) => !cache.get(s.id)?.items.length);
  if (empty) await refreshAll();
  else if (stale) void refreshAll();

  const mine = topicsForInterests(opts.interests);
  let items = [...cache.values()].flatMap((e) => e.items);
  // Si ninguna fuente respondió, se muestran destacados fijos de la red La Salle con enlaces reales.
  const usingFeatured = !items.some((i) => i.group === 'lasalle');
  if (usingFeatured) items = [...items, ...FEATURED.map((f) => ({ ...f, topics: classify(`${f.title} ${f.summary}`) }))];
  if (opts.group && opts.group !== 'all') items = items.filter((i) => i.group === opts.group);
  if (opts.topic) items = items.filter((i) => i.topics.includes(opts.topic!));
  const ranked = items.map((i) => {
    const forYou = i.topics.some((t) => mine.includes(t));
    const ageH = (Date.now() - new Date(i.publishedAt).getTime()) / 36e5;
    // Prioridad: lo que le interesa al estudiante, luego lo que está en español y con foto, y lo reciente.
    // La popularidad (puntos o reacciones) solo suma un poco para no tapar a los medios en español.
    const popular = Math.min(1.5, Math.log10(1 + (i.score ?? 0)) / 2);
    const rank = (forYou ? 4 : 0) + (i.lang === 'es' ? 3 : 0) + (i.image ? 1 : 0) + popular - ageH / 24;
    return { ...i, forYou, rank };
  });
  ranked.sort((a, b) => b.rank - a.rank);
  // Variedad: no más de 3 seguidas del mismo medio
  const out: typeof ranked = [];
  const rest = [...ranked];
  while (rest.length && out.length < (opts.limit ?? 30)) {
    const lastSrc = out.slice(-2).map((x) => x.sourceId);
    const idx = rest.findIndex((x) => !(lastSrc.length === 2 && lastSrc.every((s) => s === x.sourceId)));
    out.push(rest.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return {
    items: out.map(({ rank, score, ...i }) => i),
    topics: Object.entries(TOPICS).map(([id, t]) => ({ id, label: t.label, mine: mine.includes(id) })),
    // Solo se acreditan las fuentes que de verdad aportan noticias.
    sources: SOURCES.filter((s) => (cache.get(s.id)?.items.length ?? 0) > 0 || !s.optional).map((s) => ({ id: s.id, name: s.name, site: s.site, group: s.group, ok: cache.get(s.id)?.ok ?? false, count: cache.get(s.id)?.items.length ?? 0 })),
    hasVideos: SOURCES.some((s) => s.kind === 'youtube'),
    featured: usingFeatured,
    updatedAt: Math.max(0, ...[...cache.values()].map((e) => e.fetchedAt)) || null,
  };
}
