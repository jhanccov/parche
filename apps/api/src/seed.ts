import { fileURLToPath } from 'node:url';
import { one, pool, q } from './db.js';
import { migrate } from './migrate.js';
import { award, PUNTOS } from './points.js';

const UNIVERSITIES = [
  { id: 'unisalle', name: 'Universidad de La Salle', short: 'Unisalle', country: 'Colombia', domains: ['unisalle.edu.co', 'lasalle.edu.co'] },
  { id: 'unilasallista', name: 'Unilasallista Corporación Universitaria', short: 'Unilasallista', country: 'Colombia', domains: ['unilasallista.edu.co'] },
  { id: 'ulasalle', name: 'Universidad La Salle', short: 'ULASALLE', country: 'Perú', domains: ['ulasalle.edu.pe'] },
];

const CAMPUSES = [
  { id: 'chapinero', u: 'unisalle', name: 'Sede Chapinero', city: 'Bogotá', country: 'Colombia', lat: 4.6427, lng: -74.064, rural: false },
  { id: 'candelaria', u: 'unisalle', name: 'Sede La Candelaria', city: 'Bogotá', country: 'Colombia', lat: 4.5966, lng: -74.0697, rural: false },
  { id: 'norte', u: 'unisalle', name: 'Sede Norte', city: 'Bogotá', country: 'Colombia', lat: 4.756, lng: -74.028, rural: false },
  { id: 'utopia', u: 'unisalle', name: 'Sede Utopía', city: 'Yopal', country: 'Colombia', lat: 5.3378, lng: -72.3959, rural: true },
  { id: 'caldas', u: 'unilasallista', name: 'Campus Caldas', city: 'Caldas, Antioquia', country: 'Colombia', lat: 6.0911, lng: -75.6357, rural: false },
  { id: 'arequipa', u: 'ulasalle', name: 'Campus Arequipa', city: 'Arequipa', country: 'Perú', lat: -16.3952, lng: -71.5449, rural: false },
];

export async function seedCatalog() {
  for (const u of UNIVERSITIES) {
    await q(
      `insert into universities (id, name, short_name, country, domains) values ($1,$2,$3,$4,$5)
       on conflict (id) do update set name = excluded.name, short_name = excluded.short_name, domains = excluded.domains`,
      [u.id, u.name, u.short, u.country, u.domains],
    );
  }
  for (const c of CAMPUSES) {
    await q(
      `insert into campuses (id, university_id, name, city, country, lat, lng, rural) values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set name = excluded.name, lat = excluded.lat, lng = excluded.lng`,
      [c.id, c.u, c.name, c.city, c.country, c.lat, c.lng, c.rural],
    );
  }
}

const USERS = [
  ['valeria', 'Valeria Rodríguez', 'unisalle', 'chapinero', 'Ingeniería de Software', 6, ['Cloud (AWS)', 'Desarrollo web', 'Bases de datos'], ['Inteligencia artificial', 'Emprendimiento'], 'Co-organizo la comunidad AWS de La Salle. Me encanta enseñar cloud.'],
  ['santiago', 'Santiago Pérez', 'unisalle', 'chapinero', 'Ingeniería de Software', 3, ['Python', 'Programación'], ['Cálculo', 'Cloud (AWS)'], 'Aprendiendo backend. Busco equipo para hackathons.'],
  ['laura', 'Laura Martínez', 'unisalle', 'candelaria', 'Ingeniería Civil', 5, ['Cálculo', 'Física'], ['Gestión de proyectos'], 'Monitora de Cálculo. Si te cuesta derivar, escríbeme.'],
  ['camila', 'Camila Restrepo', 'unisalle', 'norte', 'Ingeniería Ambiental', 7, ['Química', 'IoT y sensores'], ['Ciencia de datos'], 'Calidad del agua y sensores de bajo costo.'],
  ['andres', 'Andrés Moreno', 'unisalle', 'norte', 'Ingeniería Agronómica', 8, ['Agronomía', 'Estadística'], ['Apps móviles'], 'Del campo a la ciudad. Trabajo con productores de Cundinamarca.'],
  ['yeison', 'Yeison Cárdenas', 'unisalle', 'utopia', 'Ingeniería Agronómica', 6, ['Agronomía', 'Emprendimiento'], ['Apps móviles', 'IoT y sensores'], 'Vengo de Arauca. Mi proyecto productivo es de ganadería sostenible.'],
  ['daniela', 'Daniela Ospina', 'unilasallista', 'caldas', 'Ingeniería Informática', 4, ['Diseño UX', 'Apps móviles'], ['Emprendimiento'], 'Diseño apps que la gente de verdad entiende.'],
  ['mateo', 'Mateo Giraldo', 'unilasallista', 'caldas', 'Ingeniería Ambiental', 5, ['Ciencia de datos', 'Estadística'], ['Inteligencia artificial'], 'Datos para decidir mejor en el campo.'],
  ['jose', 'José Luis H. V.', 'ulasalle', 'arequipa', 'Ingeniería de Software', 3, ['Cálculo', 'Economía', 'Álgebra lineal'], ['Cloud (AWS)', 'Inteligencia artificial'], 'Economista y estudiante de software. Mentor de matemática.'],
  ['roger', 'Roger I.', 'ulasalle', 'arequipa', 'Ingeniería de Software', 3, ['Desarrollo web', 'Programación'], ['Cloud (AWS)'], 'Full stack. Construyendo Parche.'],
  ['luciana', 'Luciana Quispe', 'ulasalle', 'arequipa', 'Ingeniería Industrial', 4, ['Gestión de proyectos', 'Redacción académica'], ['Ciencia de datos'], 'Organizo proyectos con impacto en el Colca.'],
  ['diego', 'Diego Mamani', 'ulasalle', 'arequipa', 'Ingeniería de Software', 2, ['Robótica', 'C++'], ['IoT y sensores'], 'Robótica y sensores. Primer año, muchas ganas.'],
] as const;

const HOUR = 3600_000;
const at = (h: number) => new Date(Date.now() + h * HOUR).toISOString();
const eventAt = (days: number, hourCol: number) => {
  const d = new Date(Date.now() + days * 24 * HOUR);
  d.setUTCHours(hourCol + 5, 0, 0, 0);
  return d.toISOString();
};

export async function seedDemo() {
  const ids: Record<string, string> = {};
  for (const [k, name, u, campus, career, sem, skills, interests, bio] of USERS) {
    const domain = UNIVERSITIES.find((x) => x.id === u)!.domains[0];
    const r = await one<{ id: string }>(
      `insert into users (email, name, university_id, campus_id, career, semester, skills, interests, bio, role)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (email) do update set name = excluded.name returning id`,
      [`${k}.demo@${domain}`, name, u, campus, career, sem, skills, interests, bio, k === 'roger' ? 'admin' : 'student'],
    );
    ids[k] = r!.id;
  }
  const camp = Object.fromEntries(CAMPUSES.map((c) => [c.id, c]));

  async function community(founder: string, name: string, category: string, description: string, scope: 'campus' | 'red', campusId: string, goal: number, core: string[], members: string[]) {
    const c = camp[campusId];
    const u = CAMPUSES.find((x) => x.id === campusId)!.u;
    const r = await one<{ id: string }>(
      `insert into communities (name, category, description, scope, university_id, campus_id, goal_members, lat, lng, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [name, category, description, scope, scope === 'red' ? null : u, campusId, goal, c.lat + 0.001, c.lng + 0.001, ids[founder]],
    );
    await q(`insert into community_members (community_id, user_id, role) values ($1,$2,'fundador')`, [r!.id, ids[founder]]);
    await award(ids[founder], 'crear_comunidad', r!.id);
    for (const m of core) await q(`insert into community_members (community_id, user_id, role) values ($1,$2,'core')`, [r!.id, ids[m]]);
    for (const m of members) {
      await q(`insert into community_members (community_id, user_id) values ($1,$2)`, [r!.id, ids[m]]);
      await award(ids[m], 'unirse_comunidad', r!.id);
    }
    return r!.id;
  }

  const aws = await community('valeria', 'AWS Student Builder Group La Salle', 'tecnologia',
    'Comunidad estudiantil para aprender cloud computing poniendo en práctica más que teoría. Talleres, bootcamps y preparación para certificaciones AWS con estudiantes de toda la red La Salle.',
    'red', 'chapinero', 18, ['santiago', 'roger'], ['jose', 'daniela', 'mateo', 'diego', 'luciana']);
  const ia = await community('mateo', 'Semillero IA para el Agro', 'investigacion',
    'Investigamos cómo la inteligencia artificial y los datos abiertos pueden ayudar a productores rurales a decidir qué sembrar, cuándo regar y cómo vender.',
    'red', 'caldas', 15, ['camila', 'andres'], ['yeison', 'jose', 'valeria']);
  const robo = await community('diego', 'Club de Robótica ULASALLE', 'tecnologia',
    'Construimos robots y prototipos con sensores de bajo costo. Abierto a primeros ciclos: aquí se aprende haciendo.',
    'campus', 'arequipa', 12, [], ['roger', 'luciana']);
  const agro = await community('yeison', 'Comunidad Agrotech Utopía', 'territorio',
    'Jóvenes de Utopía y de las sedes urbanas trabajando juntos en tecnología para los proyectos productivos que volvemos a llevar a nuestras regiones.',
    'red', 'utopia', 18, ['andres', 'camila'], ['mateo', 'daniela', 'luciana']);
  const calc = await community('laura', 'Círculo de Cálculo y Física', 'bienestar',
    'Grupo de estudio entre pares para primeros semestres. Resolvemos parciales anteriores y nadie se queda atrás.',
    'campus', 'candelaria', 10, [], ['santiago', 'camila']);
  const mujeres = await community('luciana', 'Mujeres en Ingeniería La Salle', 'cultura',
    'Red de estudiantes de ingeniería de Colombia y Perú: mentoría, referentes y espacios seguros para crecer en carreras STEM.',
    'red', 'arequipa', 20, ['daniela', 'camila'], ['valeria', 'laura']);

  async function event(cid: string, by: string, title: string, desc: string, when: string, place: string, url?: string) {
    const c = await one<any>('select lat, lng from communities where id = $1', [cid]);
    const r = await one<{ id: string }>(
      `insert into events (community_id, title, description, starts_at, place, virtual_url, lat, lng, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [cid, title, desc, when, place, url ?? null, c.lat, c.lng, ids[by]],
    );
    await award(ids[by], 'crear_evento', r!.id);
    return r!.id;
  }
  const e1 = await event(aws, 'valeria', 'Taller: tu primera API en AWS Lambda', 'Taller práctico de 2 horas. Trae tu laptop; cuentas de práctica incluidas.', eventAt(2, 16), 'Sede Chapinero, laboratorio 304 y transmisión virtual', 'https://meet.example.org/aws-lambda');
  await event(aws, 'roger', 'Ruta de certificación AWS Cloud Practitioner', 'Plan de estudio de 6 semanas y simulacros entre pares.', eventAt(7, 18), 'Virtual', 'https://meet.example.org/cloud-practitioner');
  await event(ia, 'mateo', 'Datatón: clima y cosechas', 'Analizamos datos abiertos de clima para predecir heladas.', eventAt(5, 9), 'Campus Caldas');
  await event(agro, 'yeison', 'Socialización en el Metaverso Unisalle', 'Presentación de proyectos de innovación tecnológica de la alianza La Salle en VRChat.', Date.parse('2026-11-04T16:00:00Z') > Date.now() ? '2026-11-04T16:00:00Z' : eventAt(3, 11), 'VRChat: Metaverso Unisalle', 'https://vrchat.com');
  await event(calc, 'laura', 'Repaso grupal: parcial de Cálculo I', 'Resolvemos el parcial del semestre pasado.', eventAt(1, 14), 'Sede La Candelaria, biblioteca');
  await event(robo, 'diego', 'Armado de seguidor de línea', 'Primer prototipo del club. Materiales compartidos.', eventAt(3, 15), 'Campus Arequipa, taller de electrónica');
  for (const u of ['santiago', 'jose', 'diego', 'mateo']) await q('insert into event_rsvps values ($1,$2) on conflict do nothing', [e1, ids[u]]);

  async function help(author: string, mentor: string | null, topic: string, title: string, detail: string, mode: string, status: string, hours?: number, rating?: number, agoH = 30) {
    const a = await one<any>('select u.campus_id, c.lat, c.lng from users u join campuses c on c.id = u.campus_id where u.id = $1', [ids[author]]);
    const pres = mode === 'presencial';
    const r = await one<{ id: string }>(
      `insert into help_requests (author_id, mentor_id, topic, title, detail, mode, campus_id, lat, lng, status, hours, rating, created_at, resolved_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now() - make_interval(hours => $13), case when $10 = 'resuelta' then now() - make_interval(hours => $13 / 2) end) returning id`,
      [ids[author], mentor ? ids[mentor] : null, topic, title, detail, mode, a.campus_id, pres ? a.lat + 0.0012 : null, pres ? a.lng - 0.0009 : null, status, hours ?? null, rating ?? null, agoH],
    );
    if (status === 'resuelta' && mentor) {
      await award(ids[mentor], 'mentoria_por_hora', r!.id, Math.round(PUNTOS.mentoria_por_hora * (hours ?? 1)));
      await award(ids[author], 'ayuda_resuelta', r!.id);
    }
    return r!.id;
  }
  await help('santiago', 'jose', 'Cálculo', 'No entiendo la regla de la cadena', 'Tengo parcial el viernes y me pierdo con funciones compuestas.', 'virtual', 'resuelta', 1.5, 5, 120);
  await help('diego', 'jose', 'Álgebra lineal', 'Matrices inversas y determinantes', 'Me cuesta el método de Gauss-Jordan.', 'virtual', 'resuelta', 2, 5, 96);
  await help('jose', 'valeria', 'Cloud (AWS)', 'Desplegar una API en AWS por primera vez', 'Quiero subir un backend de Node a AWS y no sé por dónde empezar.', 'virtual', 'resuelta', 2, 5, 72);
  await help('yeison', 'daniela', 'Apps móviles', 'Prototipo de app para registrar ganado', 'Necesito armar un prototipo para mi proyecto productivo en Arauca.', 'virtual', 'resuelta', 3, 5, 60);
  await help('camila', 'mateo', 'Ciencia de datos', 'Limpiar datos de sensores de agua', 'Tengo lecturas con ruido de un sensor de turbidez.', 'virtual', 'resuelta', 1.5, 4, 48);
  await help('luciana', 'roger', 'Desarrollo web', 'Formulario de reservas para turismo rural', 'Para una asociación de Coporaque.', 'virtual', 'resuelta', 2.5, 5, 40);
  await help('santiago', 'laura', 'Física', 'Ejercicios de dinámica', 'Plano inclinado con fricción.', 'presencial', 'resuelta', 1, 5, 36);
  const hc = await help('diego', 'valeria', 'Cloud (AWS)', 'Configurar mi cuenta de AWS sin pagar de más', 'Quiero practicar sin sorpresas en la factura.', 'virtual', 'en_curso', undefined, undefined, 8);
  await help('andres', null, 'Apps móviles', 'Necesito ayuda con Flutter para un registro de cosechas', 'Algo sencillo que funcione sin internet.', 'virtual', 'abierta', undefined, undefined, 5);
  await help('santiago', null, 'Cálculo', 'Integrales por partes para el parcial', 'Si alguien de Candelaria puede explicarme en la biblioteca.', 'presencial', 'abierta', undefined, undefined, 3);
  await help('daniela', null, 'Cloud (AWS)', '¿Cómo uso S3 para guardar fotos de mi app?', 'Estoy haciendo el proyecto de semestre.', 'virtual', 'abierta', undefined, undefined, 2);
  await help('luciana', null, 'Estadística', 'Diseño de encuesta para productores del Colca', 'Quiero validar el tamaño de muestra.', 'virtual', 'abierta', undefined, undefined, 6);
  await help('mateo', null, 'Inglés', 'Revisión de abstract en inglés', 'Para un artículo del semillero.', 'virtual', 'abierta', undefined, undefined, 1);

  async function challenge(by: string, title: string, summary: string, problem: string, organization: string, territory: string, country: string, lat: number, lng: number, ods: number[], skills: string[]) {
    const r = await one<{ id: string }>(
      `insert into challenges (title, summary, problem, organization, territory, country, lat, lng, ods, skills, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [title, summary, problem, organization, territory, country, lat, lng, ods, skills, ids[by]],
    );
    return r!.id;
  }
  const r1 = await challenge('yeison', 'Trazabilidad de ganado para pequeños productores',
    'Registrar vacunas, pesos y movimientos del ganado desde el celular, aun sin señal.',
    'Los pequeños ganaderos llevan los registros en cuadernos que se pierden o se mojan. Sin trazabilidad no acceden a mejores precios ni a programas de apoyo. Se necesita una herramienta muy simple, que funcione sin internet y sincronice cuando haya señal.',
    'Productores de Casanare (reto de ejemplo)', 'Yopal, Casanare', 'Colombia', 5.35, -72.41, [2, 8, 9], ['Apps móviles', 'Bases de datos', 'IoT y sensores']);
  const r2 = await challenge('luciana', 'Alerta temprana de heladas para papa y quinua',
    'Avisar por SMS a los agricultores cuando se acerque una helada.',
    'En el valle del Colca las heladas pueden arruinar una campaña en una sola noche. Los agricultores no reciben avisos a tiempo y muchos no tienen smartphone. Se busca una alerta con sensores de bajo costo y mensajes de texto.',
    'Comunidad campesina del Colca (reto de ejemplo)', 'Coporaque, Arequipa', 'Perú', -15.6286, -71.6449, [2, 13], ['IoT y sensores', 'Ciencia de datos']);
  const r3 = await challenge('daniela', 'Venta directa de cosechas sin intermediarios',
    'Conectar productores con compradores de la ciudad.',
    'Los productores venden a intermediarios que fijan precios bajos. Un catálogo sencillo por WhatsApp y web podría acercarlos a restaurantes y familias de la ciudad.',
    'Asociación de productores de Antioquia (reto de ejemplo)', 'Caldas, Antioquia', 'Colombia', 6.08, -75.62, [8, 12], ['Desarrollo web', 'Emprendimiento', 'Diseño UX']);
  await challenge('camila', 'Monitoreo de agua para riego en la ruralidad de Bogotá',
    'Medir turbidez y pH del agua de riego con sensores de bajo costo.',
    'Las familias campesinas no saben si el agua que usan para regar está contaminada. Un kit de sensores y un tablero abierto ayudaría a tomar decisiones.',
    'Acueducto veredal (reto de ejemplo)', 'Sumapaz, Bogotá rural', 'Colombia', 4.15, -74.2, [6, 3], ['IoT y sensores', 'Química', 'Ciencia de datos']);
  await challenge('luciana', 'Reservas digitales para turismo rural comunitario',
    'Que las familias anfitrionas reciban reservas sin depender de agencias.',
    'Las familias que ofrecen turismo vivencial pierden reservas porque no tienen presencia digital. Se necesita una página de reservas simple y un calendario compartido.',
    'Emprendimientos de turismo comunitario (reto de ejemplo)', 'Valle del Colca, Arequipa', 'Perú', -15.64, -71.6, [8, 11], ['Desarrollo web', 'Diseño UX', 'Gestión de proyectos']);

  async function team(ch: string, name: string, members: string[], updates: [string, string][]) {
    const r = await one<{ id: string }>(`insert into teams (challenge_id, name, created_by) values ($1,$2,$3) returning id`, [ch, name, ids[members[0]]]);
    await award(ids[members[0]], 'crear_equipo', r!.id);
    for (const [i, m] of members.entries()) {
      await q(`insert into team_members (team_id, user_id) values ($1,$2)`, [r!.id, ids[m]]);
      if (i > 0) await award(ids[m], 'unirse_equipo', r!.id);
    }
    for (const [who, body] of updates) {
      await q(`insert into team_updates (team_id, author_id, body) values ($1,$2,$3)`, [r!.id, ids[who], body]);
      await award(ids[who], 'avance_equipo', r!.id);
    }
    await q(`update challenges set status = 'en_progreso' where id = $1`, [ch]);
    return r!.id;
  }
  const t1 = await team(r1, 'Hato Digital', ['yeison', 'daniela', 'roger', 'andres'], [
    ['daniela', 'Prototipo en Figma validado con 3 productores de Utopía.'],
    ['roger', 'Primera versión offline: guarda registros en el celular y sincroniza con señal.'],
  ]);
  await team(r2, 'Helada Cero', ['luciana', 'mateo', 'diego', 'camila'], [
    ['mateo', 'Modelo inicial con 10 años de datos abiertos de temperatura.'],
    ['diego', 'Sensor de temperatura armado con ESP32 por menos de US$ 15.'],
  ]);
  await team(r3, 'Del Campo a tu Mesa', ['daniela', 'santiago'], [['santiago', 'Catálogo web publicado en modo prueba.']]);

  const msgs: [string, string, string][] = [
    [`community:${aws}`, 'valeria', '¡Bienvenidos! Este jueves arrancamos con el taller de Lambda.'],
    [`community:${aws}`, 'jose', 'Desde Arequipa nos conectamos varios. ¿Habrá grabación?'],
    [`community:${aws}`, 'roger', 'Sí, la subimos a recursos. También armamos la ruta de certificación.'],
    [`community:${agro}`, 'yeison', 'Subí fotos del hato para el reto de trazabilidad.'],
    [`team:${t1}`, 'daniela', 'Probé el prototipo con don Ramiro y entendió todo sin ayuda.'],
    [`team:${t1}`, 'yeison', 'Lo llevo el fin de semana a la vereda.'],
    [`help:${hc}`, 'valeria', 'Hola Diego, activa las alertas de facturación primero. Te muestro en 10 minutos.'],
    [`help:${hc}`, 'diego', '¡Gracias! Te escribo apenas salga de clase.'],
  ];
  for (const [ch, who, body] of msgs) await q('insert into messages (channel, author_id, body) values ($1,$2,$3)', [ch, ids[who], body]);
}

export async function seedIfEmpty() {
  await seedCatalog();
  const n = await one<{ n: number }>(`select count(*)::int as n from users where email like '%.demo@%'`);
  if (!n?.n) await seedDemo();
}

export async function resetAndSeed() {
  await q(`truncate reports, points_log, messages, team_updates, team_members, teams, challenges, help_requests, event_rsvps, events,
           community_members, communities, login_codes, users, campuses, universities restart identity cascade`);
  await seedCatalog();
  await seedDemo();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate()
    .then(resetAndSeed)
    .then(() => { console.log('Datos de demostración cargados'); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
