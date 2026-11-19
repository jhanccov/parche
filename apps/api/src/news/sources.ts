// Fuentes gratuitas y sin clave para la sección "Tech hoy".
// Solo se muestran título, resumen corto, medio y enlace a la nota original.
export type Group = 'lasalle' | 'video';
type Base = { id: string; name: string; site: string; group: Group; lang: 'es' | 'en' | 'pt'; optional?: boolean };
export type Source =
  | (Base & { kind: 'rss'; url: string })
  | (Base & { kind: 'wp'; bases: string[] })
  | (Base & { kind: 'youtube'; channelId: string });

// Solo fuentes oficiales de la red La Salle. Cada una se prueba en cada actualización;
// las que no responden no se muestran ni se acreditan.
const BASE_SOURCES: Source[] = [
  { id: 'lasalleorg', name: 'La Salle (lasalle.org)', site: 'https://www.lasalle.org', group: 'lasalle', lang: 'es', kind: 'wp', bases: ['https://www.lasalle.org', 'https://www.lasalle.org/en'] },
  { id: 'lasalle-philadelphia', name: 'La Salle University (Filadelfia)', site: 'https://www.lasalle.edu', group: 'lasalle', lang: 'en', kind: 'wp', bases: ['https://www.lasalle.edu'], optional: true },
  { id: 'dlsu-manila', name: 'De La Salle University (Manila)', site: 'https://www.dlsu.edu.ph', group: 'lasalle', lang: 'en', kind: 'wp', bases: ['https://www.dlsu.edu.ph'], optional: true },
  { id: 'unisalle', name: 'Universidad de La Salle (Bogotá)', site: 'https://www.lasalle.edu.co', group: 'lasalle', lang: 'es', kind: 'rss', url: 'https://www.lasalle.edu.co/rss.xml', optional: true },
  { id: 'salleurl', name: 'La Salle Campus Barcelona', site: 'https://www.salleurl.edu', group: 'lasalle', lang: 'es', kind: 'rss', url: 'https://www.salleurl.edu/es/rss.xml', optional: true },
];

// Fuentes extra sin tocar el código, desde variables de entorno en Render:
// NEWS_YOUTUBE_CHANNELS = "Nombre|UCxxxxxxxx; Otro canal|UCyyyyyyyy"   (canales de YouTube de universidades La Salle)
// NEWS_EXTRA_FEEDS      = "Nombre|https://sitio/feed/; Otro|https://otro/rss.xml"   (RSS de universidades La Salle)
function parseList(v: string | undefined) {
  return (v ?? '').split(';').map((x) => x.trim()).filter(Boolean).map((x) => x.split('|').map((p) => p.trim())).filter((p) => p.length === 2 && p[0] && p[1]);
}
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export function loadSources(env: NodeJS.ProcessEnv = process.env): Source[] {
  const yt: Source[] = parseList(env.NEWS_YOUTUBE_CHANNELS)
    .filter(([, id]) => /^UC[\w-]{20,}$/.test(id))
    .map(([name, channelId]) => ({ id: `yt-${slug(name)}`, name, site: `https://www.youtube.com/channel/${channelId}`, group: 'video', lang: 'es', kind: 'youtube', channelId }));
  const rss: Source[] = parseList(env.NEWS_EXTRA_FEEDS)
    .filter(([, url]) => /^https?:\/\//.test(url))
    .map(([name, url]) => ({ id: `rss-${slug(name)}`, name, site: new URL(url).origin, group: 'lasalle', lang: 'es', kind: 'rss', url, optional: true }));
  return [...BASE_SOURCES, ...rss, ...yt];
}

export const SOURCES: Source[] = loadSources();

// Temas para clasificar las noticias de la red (español, inglés y portugués).
export const TOPICS: Record<string, { label: string; words: string[] }> = {
  internacional: { label: 'Internacional', words: ['internacional', 'international', 'movilidad', 'mobility', 'intercambio', 'exchange', 'ialu', 'alianza', 'alliance', 'convenio', 'global', 'paises', 'countries', 'mundo'] },
  investigacion: { label: 'Investigación', words: ['investigacion', 'research', 'pesquisa', 'ciencia', 'science', 'innovacion', 'innovation', 'tecnologia', 'technology', 'laboratorio', 'congreso', 'conference', 'publicacion'] },
  comunidad: { label: 'Comunidad y solidaridad', words: ['solidaridad', 'solidarity', 'comunidad', 'community', 'voluntari', 'volunteer', 'social', 'pobres', 'poor', 'rural', 'paz', 'peace', 'servicio', 'service'] },
  estudiantes: { label: 'Vida estudiantil', words: ['estudiantes', 'students', 'alunos', 'jovenes', 'young', 'youth', 'juventud', 'bienvenida', 'welcome', 'campus', 'freshmen', 'graduacion', 'graduation', 'commencement'] },
  mision: { label: 'Misión lasallista', words: ['lasallista', 'lasallian', 'lassalista', 'hermanos', 'brothers', 'irmaos', 'mision', 'mission', 'fe ', 'faith', 'espiritualidad', 'spirituality', 'san juan bautista', 'de la salle', 'capitulo', 'relal'] },
  deporte: { label: 'Deporte y cultura', words: ['deporte', 'sport', 'athletics', 'basketball', 'futbol', 'soccer', 'cultura', 'culture', 'arte', 'art', 'musica', 'music', 'teatro', 'festival'] },
};

// Lo que el estudiante marca en "Quiero aprender" o "Puedo ayudar en" -> temas de la red.
export const SKILL_TOPICS: Record<string, string[]> = {
  'inteligencia artificial': ['investigacion'], 'ciencia de datos': ['investigacion'], 'programacion': ['investigacion'], 'python': ['investigacion'],
  'desarrollo web': ['investigacion'], 'apps moviles': ['investigacion'], 'cloud (aws)': ['investigacion'], 'ciberseguridad': ['investigacion'],
  'iot y sensores': ['investigacion'], 'robotica': ['investigacion'], 'agronomia': ['comunidad'], 'emprendimiento': ['comunidad', 'internacional'],
  'ingles': ['internacional'], 'redaccion academica': ['investigacion'], 'gestion de proyectos': ['comunidad'],
};
