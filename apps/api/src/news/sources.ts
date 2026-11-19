// Fuentes gratuitas y sin clave para la sección "Tech hoy".
// Solo se muestran título, resumen corto, medio y enlace a la nota original.
export type Group = 'lasalle' | 'video' | 'es' | 'dev' | 'trend';
type Base = { id: string; name: string; site: string; group: Group; lang: 'es' | 'en'; optional?: boolean };
export type Source =
  | (Base & { kind: 'rss'; url: string })
  | (Base & { kind: 'wp'; base: string })
  | (Base & { kind: 'youtube'; channelId: string })
  | (Base & { kind: 'devto'; tags: string[] })
  | (Base & { kind: 'hn' });

// Grupo "tech" de la interfaz = es + dev + trend.
export const TECH_GROUPS: Group[] = ['es', 'dev', 'trend'];

const BASE_SOURCES: Source[] = [
  // Red La Salle en el mundo: sitio oficial de los Hermanos de las Escuelas Cristianas (WordPress, API pública).
  { id: 'lasalleorg', name: 'La Salle (lasalle.org)', site: 'https://www.lasalle.org', group: 'lasalle', lang: 'es', kind: 'wp', base: 'https://www.lasalle.org' },
  // Sitios de universidades La Salle: se prueban en cada actualización y solo se muestran si responden.
  { id: 'unisalle', name: 'Universidad de La Salle (Colombia)', site: 'https://www.lasalle.edu.co', group: 'lasalle', lang: 'es', kind: 'rss', url: 'https://www.lasalle.edu.co/rss.xml', optional: true },
  { id: 'salleurl', name: 'La Salle Campus Barcelona', site: 'https://www.salleurl.edu', group: 'lasalle', lang: 'es', kind: 'rss', url: 'https://www.salleurl.edu/es/rss.xml', optional: true },
  // Tecnología
  { id: 'xataka', name: 'Xataka', site: 'https://www.xataka.com', group: 'es', lang: 'es', kind: 'rss', url: 'https://www.xataka.com/feedburner.xml' },
  { id: 'enter', name: 'ENTER.CO', site: 'https://www.enter.co', group: 'es', lang: 'es', kind: 'rss', url: 'https://www.enter.co/feed/' },
  { id: 'devto', name: 'DEV Community', site: 'https://dev.to', group: 'dev', lang: 'en', kind: 'devto', tags: ['', 'ai', 'webdev', 'python', 'security', 'spanish'] },
  { id: 'hn', name: 'Hacker News', site: 'https://news.ycombinator.com', group: 'trend', lang: 'en', kind: 'hn' },
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
    .map(([name, url]) => ({ id: `rss-${slug(name)}`, name, site: new URL(url).origin, group: 'lasalle', lang: 'es', kind: 'rss', url }));
  return [...BASE_SOURCES, ...rss, ...yt];
}

export const SOURCES: Source[] = loadSources();

// Temas para clasificar y para cruzar con lo que el estudiante quiere aprender.
export const TOPICS: Record<string, { label: string; words: string[] }> = {
  ia: { label: 'IA', words: ['inteligencia artificial', ' ia ', 'ia.', 'ia,', ' ai ', 'ai,', ' llm', 'chatgpt', 'openai', 'claude', 'gemini', 'machine learning', 'aprendizaje automatico', 'deep learning', 'red neuronal', 'neural', 'agente', 'agents', 'genai', 'copilot'] },
  programacion: { label: 'Programación', words: ['programacion', 'programming', 'javascript', 'typescript', 'python', ' java ', 'react', 'node', 'codigo', ' code', 'developer', 'desarrollador', 'github', ' api', 'framework', 'rust', 'golang', 'webdev', 'frontend', 'backend', 'software', 'open source', 'codigo abierto', 'linux'] },
  ciberseguridad: { label: 'Ciberseguridad', words: ['ciberseguridad', 'seguridad informatica', 'vulnerabilidad', 'malware', 'ransomware', 'phishing', 'contrasena', 'password', 'hackeo', 'hackers ', 'security', 'cve-', 'breach', 'filtracion', 'ciberataque', 'cyber'] },
  datos: { label: 'Datos', words: ['datos', ' data', 'big data', 'analitica', 'analytics', ' sql', 'base de datos', 'database', 'datascience', 'estadistica'] },
  cloud: { label: 'Cloud', words: ['la nube', ' cloud', ' aws', 'azure', 'google cloud', 'servidor', 'server', 'kubernetes', 'docker', 'devops', 'centro de datos', 'data center'] },
  moviles: { label: 'Móviles', words: ['iphone', 'android', 'smartphone', 'movil', 'celular', 'samsung', 'xiaomi', ' ios', 'galaxy', 'pixel', 'app '] },
  startups: { label: 'Startups', words: ['startup', 'emprend', 'fintech', 'inversion', 'financiacion', 'unicornio', 'funding', 'venture', 'founder', 'fundador'] },
  hardware: { label: 'Hardware', words: ['chip', 'procesador', ' gpu', 'nvidia', ' intel', ' amd', 'robot', ' iot', 'sensor', 'hardware', 'semiconductor', 'portatil', 'laptop', 'dron'] },
};

// Lo que el estudiante marca en "Quiero aprender" o "Puedo ayudar en" -> temas de noticias.
export const SKILL_TOPICS: Record<string, string[]> = {
  'inteligencia artificial': ['ia'],
  'ciencia de datos': ['datos', 'ia'],
  'estadistica': ['datos'],
  'bases de datos': ['datos', 'programacion'],
  'programacion': ['programacion'],
  'python': ['programacion', 'datos'],
  'java': ['programacion'],
  'c++': ['programacion'],
  'desarrollo web': ['programacion'],
  'apps moviles': ['moviles', 'programacion'],
  'cloud (aws)': ['cloud'],
  'ciberseguridad': ['ciberseguridad'],
  'iot y sensores': ['hardware'],
  'robotica': ['hardware'],
  'emprendimiento': ['startups'],
  'diseno ux': ['programacion'],
};
