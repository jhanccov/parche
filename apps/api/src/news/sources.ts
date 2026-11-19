// Fuentes gratuitas y sin clave para la sección "Tech hoy".
// Solo se muestran título, resumen corto, medio y enlace a la nota original.
export type Group = 'es' | 'dev' | 'trend';
export type Source =
  | { id: string; name: string; site: string; group: Group; lang: 'es' | 'en'; kind: 'rss'; url: string }
  | { id: string; name: string; site: string; group: Group; lang: 'es' | 'en'; kind: 'devto'; tags: string[] }
  | { id: string; name: string; site: string; group: Group; lang: 'es' | 'en'; kind: 'hn' };

export const SOURCES: Source[] = [
  { id: 'xataka', name: 'Xataka', site: 'https://www.xataka.com', group: 'es', lang: 'es', kind: 'rss', url: 'https://www.xataka.com/feedburner.xml' },
  { id: 'enter', name: 'ENTER.CO', site: 'https://www.enter.co', group: 'es', lang: 'es', kind: 'rss', url: 'https://www.enter.co/feed/' },
  { id: 'devto', name: 'DEV Community', site: 'https://dev.to', group: 'dev', lang: 'en', kind: 'devto', tags: ['', 'ai', 'webdev', 'python', 'security', 'spanish'] },
  { id: 'hn', name: 'Hacker News', site: 'https://news.ycombinator.com', group: 'trend', lang: 'en', kind: 'hn' },
];

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
