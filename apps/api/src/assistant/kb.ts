// Base de conocimiento del asistente Juanita. Sirve para el modo guía (sin IA)
// y como contexto para el modo con IA, así ambos responden lo mismo sobre la app.

export type Action = { label: string; to: string };
type Entry = { id: string; keywords: string[]; answer: string; actions: Action[] };

// Rutas a las que el asistente puede llevar al usuario. Cualquier otra se descarta.
export const ROUTES: Record<string, string> = {
  '/': 'Inicio',
  '/comunidades': 'Comunidades',
  '/comunidades/nueva': 'Crear comunidad',
  '/mentoria': 'Mentoría',
  '/mentoria/nueva': 'Pedir ayuda',
  '/retos': 'Retos del territorio',
  '/mapa': 'Mapa',
  '/impacto': 'Impacto',
  '/perfil': 'Mi perfil',
  '/constancia': 'Constancia de mentoría',
  '/privacidad': 'Política de privacidad',
  '/noticias': 'Tech hoy',
};

const go = (to: string, label = ROUTES[to]): Action => ({ label, to });

export const KB: Entry[] = [
  {
    id: 'que-es',
    keywords: ['que es parche', 'para que sirve', 'que hace', 'de que trata', 'que es esto', 'explicame la app', 'como funciona la app'],
    answer: 'Parche es la app de los estudiantes La Salle de Perú y Colombia. Tiene tres pilares: comunidades (clubes, semilleros y grupos de estudio), mentoría entre pares (pides ayuda y le llega a quien sabe) y retos del territorio (problemas reales de comunidades rurales que resuelves en equipo).',
    actions: [go('/comunidades'), go('/mentoria'), go('/retos')],
  },
  {
    id: 'pedir-ayuda',
    keywords: ['pedir ayuda', 'necesito ayuda', 'no entiendo', 'me trabe', 'tengo una duda de un curso', 'ayuda con', 'tutoria', 'asesoria', 'explicacion de un tema'],
    answer: 'Toca "Pedir ayuda", elige el tema (por ejemplo Cálculo o Python), escribe qué necesitas y si prefieres virtual o presencial. Tu solicitud le llega primero a quienes marcaron que pueden ayudar en ese tema, en tu sede o en otro país. Cuando alguien acepta, se abre un chat privado entre ustedes.',
    actions: [go('/mentoria/nueva'), go('/mentoria', 'Ver mentorías')],
  },
  {
    id: 'dar-ayuda',
    keywords: ['ser mentor', 'quiero ayudar', 'ayudar a otros', 'dar ayuda', 'ofrecer ayuda', 'ensenar', 'como ayudo'],
    answer: 'En Mentoría, la pestaña "Puedo ayudar" muestra las solicitudes de los temas que marcaste en tu perfil. Abre una y toca "Ofrezco ayuda". Al terminar, quien recibió la ayuda confirma las horas y te califica, y esas horas suman a tu constancia y a la insignia Mentor.',
    actions: [go('/mentoria'), go('/perfil', 'Editar mis temas')],
  },
  {
    id: 'cerrar-mentoria',
    keywords: ['cerrar mentoria', 'cierro la mentoria', 'cierro', 'terminar mentoria', 'termino la mentoria', 'confirmar horas', 'calificar', 'califico', 'calificacion', 'finalizar ayuda'],
    answer: 'Quien pidió la ayuda cierra la mentoría desde el detalle de la solicitud: indica las horas recibidas y califica de 1 a 5. Así las horas quedan confirmadas y nadie puede inflarlas.',
    actions: [go('/mentoria', 'Mis mentorías')],
  },
  {
    id: 'crear-comunidad',
    keywords: ['crear comunidad', 'nueva comunidad', 'crear un club', 'semillero', 'grupo de estudio', 'fundar', 'armar un grupo'],
    answer: 'Toca "Crear comunidad", ponle nombre, categoría y propósito. Parche te guía con una ruta de formación: publicar el propósito, armar un equipo núcleo de 3 personas, programar el primer evento y llegar a la meta de miembros. La idea viene de cómo nacen los AWS Student Builder Groups.',
    actions: [go('/comunidades/nueva'), go('/comunidades', 'Ver comunidades')],
  },
  {
    id: 'unirse-comunidad',
    keywords: ['unirme a una comunidad', 'entrar a una comunidad', 'buscar comunidad', 'unirse', 'comunidades'],
    answer: 'En Comunidades puedes buscar por nombre o filtrar por categoría. Entra a la que te interese y toca "Unirme". Dentro tienes los eventos, el equipo núcleo y la conversación del grupo.',
    actions: [go('/comunidades')],
  },
  {
    id: 'eventos',
    keywords: ['evento', 'eventos', 'asistire', 'asistir', 'reunion', 'taller'],
    answer: 'Los eventos están dentro de cada comunidad y también aparecen en tu inicio. Toca "Asistiré" para confirmar; la comunidad ve cuántos van.',
    actions: [go('/'), go('/comunidades')],
  },
  {
    id: 'retos',
    keywords: ['reto', 'retos', 'territorio', 'rural', 'equipo', 'proyecto real', 'ods'],
    answer: 'Los retos son problemas reales de comunidades rurales de Colombia y Perú, como reservas de turismo en el Valle del Colca o el monitoreo de agua para riego. Puedes crear un equipo de hasta 6 personas o sumarte a uno; si mezcla universidades, lleva la marca de equipo interuniversitario. El equipo tiene bitácora de avances y chat.',
    actions: [go('/retos')],
  },
  {
    id: 'puntos',
    keywords: ['puntos', 'insignia', 'insignias', 'medalla', 'logros', 'nivel', 'gano'],
    answer: 'Sumas puntos al colaborar: ayudar en mentorías, fundar o sostener comunidades y participar en retos. Las insignias son Mentor, Fundador, Agente de territorio, Puente La Salle (conectar con otra universidad) y Conector. Las ves en tu perfil.',
    actions: [go('/perfil')],
  },
  {
    id: 'constancia',
    keywords: ['constancia', 'certificado', 'horas', 'imprimir', 'creditos extracurriculares'],
    answer: 'La constancia reúne tus horas de mentoría confirmadas por quienes recibieron tu ayuda. Tiene un folio para verificarla y se puede imprimir o guardar en PDF.',
    actions: [go('/constancia')],
  },
  {
    id: 'mapa',
    keywords: ['mapa', 'sedes', 'donde queda', 'ubicacion'],
    answer: 'El mapa muestra sedes, comunidades, eventos y retos de toda la red, con la vista "mi sede" o "toda la red". Nunca muestra dónde está una persona.',
    actions: [go('/mapa')],
  },
  {
    id: 'impacto',
    keywords: ['impacto', 'estadisticas', 'datos de la red', 'cuantos estudiantes', 'tablero'],
    answer: 'El tablero de impacto muestra en vivo cuántos estudiantes hay por universidad, horas de mentoría, satisfacción y equipos interuniversitarios. Son datos agregados y anónimos.',
    actions: [go('/impacto')],
  },
  {
    id: 'perfil',
    keywords: ['perfil', 'editar perfil', 'cambiar mi nombre', 'carrera', 'semestre', 'mis temas'],
    answer: 'En tu perfil editas nombre, sede, carrera, semestre, una bio corta, en qué puedes ayudar y qué quieres aprender. No hay fotos: Parche conecta por lo que sabes, no por cómo te ves.',
    actions: [go('/perfil')],
  },
  {
    id: 'privacidad',
    keywords: ['privacidad', 'mis datos', 'datos personales', 'quien ve', 'seguridad', 'ley 29733', 'borrar cuenta', 'eliminar cuenta', 'eliminar mis datos'],
    answer: 'Parche cumple la Ley N.° 29733 (Perú) y la Ley 1581 de 2012 (Colombia). No pide foto, teléfono ni ubicación. Puedes eliminar tu cuenta y tus datos desde Perfil, opción "Eliminar mi cuenta".',
    actions: [go('/privacidad'), go('/perfil', 'Ir a mi perfil')],
  },
  {
    id: 'acceso',
    keywords: ['iniciar sesion', 'codigo', 'no me llega', 'correo', 'entrar', 'login', 'registrarme', 'quien puede usar'],
    answer: 'Entras solo con tu correo institucional de la red La Salle (@ulasalle.edu.pe, @unisalle.edu.co, @lasalle.edu.co o @unilasallista.edu.co). Te llega un código de 6 dígitos que vence en 10 minutos. Si no llega, revisa spam y pide uno nuevo.',
    actions: [],
  },
  {
    id: 'invitar',
    keywords: ['invitar', 'compartir', 'amigos', 'companeros', 'whatsapp'],
    answer: 'Con el botón "+" elige "Invitar compañeros" y comparte el enlace por WhatsApp. Mientras más de tu salón entren, más rápido encuentras ayuda y equipo.',
    actions: [go('/', 'Ir al inicio')],
  },
  {
    id: 'reportar',
    keywords: ['reportar', 'denunciar', 'contenido inapropiado', 'acoso', 'moderacion'],
    answer: 'En solicitudes, comunidades y mensajes tienes la opción "Reportar". El equipo de moderación lo revisa. Parche no es una app de citas: los chats solo existen dentro de una mentoría, una comunidad o un reto.',
    actions: [],
  },
  {
    id: 'noticias',
    keywords: ['noticias', 'tech hoy', 'novedades', 'que hay de nuevo', 'tecnologia actual', 'enterarme', 'actualidad', 'tendencias'],
    answer: 'En "Tech hoy" (el ícono de periódico arriba) tienes noticias de tecnología de Xataka y ENTER.CO en español, artículos de DEV Community para devs y lo más comentado en Hacker News. Se ordenan según lo que marcaste en "Quiero aprender" y cada una enlaza a la nota original.',
    actions: [go('/noticias'), go('/perfil', 'Ajustar mis temas')],
  },
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey'],
    answer: '¡Hola! Soy Juanita, tu guía en Parche. Puedo explicarte cómo pedir ayuda, crear una comunidad, sumarte a un reto o cuidar tus datos. ¿Qué quieres hacer?',
    actions: [go('/mentoria/nueva'), go('/comunidades/nueva')],
  },
  {
    id: 'gracias',
    keywords: ['gracias', 'genial', 'perfecto', 'listo', 'ok'],
    answer: '¡Con gusto! Si tienes otra duda, aquí estoy.',
    actions: [],
  },
];

export const FALLBACK = {
  answer: 'Todavía no sé responder eso. Puedo ayudarte con pedir ayuda, ser mentor, crear o unirte a una comunidad, los retos del territorio, tus puntos y constancia, o tus datos personales.',
  actions: [go('/mentoria/nueva'), go('/comunidades'), go('/retos')],
};

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

export function answerFromKb(question: string) {
  const q = ` ${normalize(question)} `;
  let best: Entry | null = null;
  let bestScore = 0;
  for (const e of KB) {
    let score = 0;
    for (const k of e.keywords) {
      const nk = normalize(k);
      if (q.includes(` ${nk} `) || q.includes(` ${nk}`)) score += nk.split(' ').length * 2;
      else score += nk.split(' ').filter((w) => w.length > 3 && q.includes(` ${w}`)).length * 0.5;
    }
    if (score > bestScore) { bestScore = score; best = e; }
  }
  if (!best || bestScore < 1) return FALLBACK;
  return { answer: best.answer, actions: best.actions };
}

// Texto para el modo con IA: la misma información que usa el modo guía.
export function kbAsContext() {
  return KB.filter((e) => !['saludo', 'gracias'].includes(e.id)).map((e) => `- ${e.answer}`).join('\n');
}
