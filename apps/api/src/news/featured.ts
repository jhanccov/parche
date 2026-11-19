import type { NewsItem } from './fetcher.js';

// Destacados de la red La Salle con enlaces reales a sus sitios oficiales.
// Se muestran solo si ninguna fuente en vivo responde, para que la sección nunca quede vacía.
// Los resúmenes son propios; el contenido completo está en cada enlace.
type Featured = Omit<NewsItem, 'topics'>;
const now = () => new Date().toISOString();
const f = (id: string, title: string, summary: string, url: string, source: string, lang: 'es' | 'en'): Featured => ({
  id: `featured:${id}`, title, summary, url, image: null, source, sourceId: `featured-${id}`, group: 'lasalle', lang,
  region: url.includes('lasalle.edu.co') ? 'colombia' : url.includes('ulasalle.edu.pe') ? 'arequipa' : url.includes('lasalle.mx') ? 'mexico' : 'mundo', featured: true, publishedAt: now(),
});

export const FEATURED: Featured[] = [
  f('ialu-ciclo', 'IALU inicia un nuevo ciclo para fortalecer la misión y la colaboración de las universidades lasalianas',
    'La asociación internacional de universidades La Salle renovó su equipo de gobierno y fijó prioridades de colaboración para la red mundial.',
    'https://www.lasalle.org/ialu-inicia-un-nuevo-ciclo-orientado-a-fortalecer-la-mision-la-colaboracion-y-el-impacto-de-las-universidades-lasalianas-en-el-mundo/', 'La Salle (lasalle.org)', 'es'),
  f('ialu-nairobi', 'El XIV Encuentro de IALU en Nairobi impulsa la cooperación entre universidades lasalianas',
    'Líderes de universidades La Salle de todo el mundo se reunieron en Kenia para trazar el trabajo conjunto de los próximos años.',
    'https://www.salleurl.edu/en/node/29229', 'La Salle Campus Barcelona', 'en'),
  f('relal-comunicacion', 'La RELAL actualiza su plan de comunicación al servicio de la misión lasallista',
    'Responsables de comunicación de la región latinoamericana se reunieron en Porto Alegre para compartir experiencias y planear juntos.',
    'https://www.lasalle.org/la-relal-actualiza-su-plan-de-comunicacion-al-servicio-de-la-mision-lasallista/', 'La Salle (lasalle.org)', 'es'),
  f('unisalle-movilidad', 'La Universidad de La Salle recibe estudiantes de intercambio de todo el mundo',
    'La sede de Bogotá dio la bienvenida a estudiantes internacionales y nacionales que viven una experiencia académica y multicultural.',
    'https://lasalle.edu.co/noticias/our-university-received-incoming-students-all-around-world', 'Universidad de La Salle (Bogotá)', 'en'),
  f('usls-roma', 'Líderes de la University of St. La Salle se suman al diálogo lasaliano global en Roma',
    'Educadores y directivos de universidades La Salle de varios países participaron en el programa de formación de IALU en Roma.',
    'https://www.usls.edu.ph/news/view/USLS-Leaders-Join-Global-Lasallian-Dialogue-in-Rome', 'University of St. La Salle (Filipinas)', 'en'),
  f('relal-levadura', 'RELAL: Conferencia de Visitadores y encuentro de las comunidades Levadura',
    'La región latinoamericana lasallista reunió a sus responsables para fortalecer su compromiso con las periferias, incluido el campus de Utopía.',
    'https://www.lasalle.org/relal-conferencia-de-visitadores-y-encuentro-de-directores-de-comunidades-levadura/', 'La Salle (lasalle.org)', 'es'),
  f('dlsud-manila', 'DLSU-Dasmariñas y DLSU-Manila estrechan su colaboración dentro de la red lasaliana',
    'Las dos universidades La Salle de Filipinas exploraron proyectos conjuntos tras una visita de campus.',
    'https://www.dlsud.edu.ph/campuslife/news/33.htm', 'De La Salle University-Dasmariñas', 'en'),
  f('ialu-canoas', 'Universidades La Salle de 12 países se reúnen en Canoas para el XVI Encuentro de IALU',
    'Representantes de 32 instituciones lasalianas se dieron cita en la Universidade La Salle de Brasil.',
    'https://ialu.org/', 'IALU', 'en'),
];
