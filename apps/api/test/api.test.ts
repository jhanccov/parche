process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.NEWS_YOUTUBE_CHANNELS = 'La Salle Prueba TV|UCabcdefghijklmnopqrstuv';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://parche:parche@localhost:5432/parche_test';

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const { buildApp } = await import('../src/app.js');
const { migrate } = await import('../src/migrate.js');
const { resetAndSeed } = await import('../src/seed.js');
const { pool } = await import('../src/db.js');
const { parseActions } = await import('../src/routes/assistant.js');
const { config } = await import('../src/config.js');
const { clearNewsCache } = await import('../src/news/fetcher.js');

let app: Awaited<ReturnType<typeof buildApp>>;

async function login(email: string) {
  const r1 = await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email } });
  assert.equal(r1.statusCode, 200, r1.body);
  const code = r1.json().devCode;
  const r2 = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { email, code, consent: true } });
  assert.equal(r2.statusCode, 200, r2.body);
  return r2.json() as { token: string; needsProfile: boolean };
}

const call = (token: string, method: string, url: string, payload?: unknown) =>
  app.inject({ method: method as any, url, payload: payload as any, headers: { authorization: `Bearer ${token}` } });

before(async () => {
  await migrate();
  await resetAndSeed();
  app = await buildApp();
});

after(async () => {
  await app.close();
  await pool.end();
});

describe('Parche API', () => {
  let ana: string;
  let beto: string;

  test('health responde con la base de datos', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/health' });
    assert.equal(r.json().ok, true);
  });

  test('rechaza correos fuera de la red La Salle', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email: 'alguien@gmail.com' } });
    assert.equal(r.statusCode, 403);
  });

  test('sin consentimiento de datos no se crea la cuenta', async () => {
    const email = 'sin.consentimiento@ulasalle.edu.pe';
    const r1 = await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email } });
    const r2 = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { email, code: r1.json().devCode } });
    assert.equal(r2.statusCode, 400);
    const row = await pool.query('select 1 from users where email = $1', [email]);
    assert.equal(row.rowCount, 0);
  });

  test('el límite de códigos es por correo: muchos estudiantes en la misma red wifi pueden entrar', async () => {
    for (let i = 0; i < 8; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email: `feria${i}@ulasalle.edu.pe` } });
      assert.equal(r.statusCode, 200, r.body);
    }
  });

  test('un código incorrecto no inicia sesión', async () => {
    await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email: 'x@unisalle.edu.co' } });
    const r = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { email: 'x@unisalle.edu.co', code: '000000' } });
    assert.equal(r.statusCode, 400);
  });

  test('inicio de sesión con código y perfil obligatorio', async () => {
    const a = await login('ana.test@unisalle.edu.co');
    assert.equal(a.needsProfile, true);
    ana = a.token;
    const blocked = await call(ana, 'POST', '/api/communities', { name: 'Test', category: 'tecnologia', description: 'x'.repeat(30) });
    assert.equal(blocked.statusCode, 403);
    const p = await call(ana, 'PUT', '/api/me', { name: 'Ana Test', campus_id: 'chapinero', career: 'Ingeniería de Software', semester: 4, skills: ['Cálculo'], interests: ['Cloud (AWS)'] });
    assert.equal(p.statusCode, 200, p.body);
    const wrongCampus = await call(ana, 'PUT', '/api/me', { name: 'Ana Test', campus_id: 'arequipa', career: 'X y', semester: 4 });
    assert.equal(wrongCampus.statusCode, 400);
    const b = await login('beto.test@ulasalle.edu.pe');
    beto = b.token;
    await call(beto, 'PUT', '/api/me', { name: 'Beto Test', campus_id: 'arequipa', career: 'Ingeniería de Software', semester: 2, skills: ['Python'], interests: ['Cálculo'] });
  });

  test('crear comunidad, sumar miembros y ver el avance de formación', async () => {
    const c = await call(ana, 'POST', '/api/communities', {
      name: 'Comunidad de prueba', category: 'tecnologia', description: 'Una comunidad para probar Parche de punta a punta.', scope: 'red', goal_members: 5,
    });
    assert.equal(c.statusCode, 200, c.body);
    const id = c.json().id;
    await call(beto, 'POST', `/api/communities/${id}/join`);
    const d = await call(ana, 'GET', `/api/communities/${id}`);
    const body = d.json();
    assert.equal(body.memberList.length, 2);
    assert.equal(body.members, 2);
    assert.equal(body.universities, 2);
    assert.equal(body.progress.status, 'en_formacion');
    const ev = await call(beto, 'POST', '/api/events', { community_id: id, title: 'Evento', starts_at: new Date(Date.now() + 86400000).toISOString() });
    assert.equal(ev.statusCode, 403);
    const ok = await call(ana, 'POST', '/api/events', { community_id: id, title: 'Primer encuentro', starts_at: new Date(Date.now() + 86400000).toISOString() });
    assert.equal(ok.statusCode, 200, ok.body);
    const chat = await call(beto, 'POST', `/api/messages/community:${id}`, { body: 'Hola desde Arequipa' });
    assert.equal(chat.statusCode, 200);
  });

  test('mentoría entre pares: pedir, ofrecer, cerrar y sumar horas', async () => {
    const h = await call(beto, 'POST', '/api/help', { topic: 'Cálculo', title: 'Límites al infinito', mode: 'virtual' });
    assert.equal(h.statusCode, 200, h.body);
    const id = h.json().id;
    const paraMi = await call(ana, 'GET', '/api/help?scope=para-mi');
    assert.ok(paraMi.json().some((x: any) => x.id === id), 'la solicitud aparece para quien sabe Cálculo');
    const self = await call(beto, 'POST', `/api/help/${id}/offer`);
    assert.equal(self.statusCode, 409);
    const offer = await call(ana, 'POST', `/api/help/${id}/offer`);
    assert.equal(offer.statusCode, 200);
    const outsider = await login('carla.test@unisalle.edu.co');
    const denied = await call(outsider.token, 'GET', `/api/messages/help:${id}`);
    assert.equal(denied.statusCode, 403);
    const wrong = await call(ana, 'POST', `/api/help/${id}/resolve`, { hours: 2, rating: 5 });
    assert.equal(wrong.statusCode, 403);
    const done = await call(beto, 'POST', `/api/help/${id}/resolve`, { hours: 2, rating: 5 });
    assert.equal(done.statusCode, 200);
    const me = await call(ana, 'GET', '/api/me');
    assert.ok(me.json().points >= 20);
    assert.ok(me.json().badges.some((b: any) => b.id === 'mentor'));
    const cert = await call(ana, 'GET', '/api/me/certificate');
    assert.equal(cert.json().totalHours, 2);
  });

  test('retos del territorio con equipos de varias universidades', async () => {
    const list = await call(ana, 'GET', '/api/challenges?country=Perú');
    assert.ok(list.json().length >= 1);
    const chId = list.json()[0].id;
    const t = await call(ana, 'POST', `/api/challenges/${chId}/teams`, { name: 'Equipo Puente' });
    assert.equal(t.statusCode, 200, t.body);
    const j = await call(beto, 'POST', `/api/challenges/teams/${t.json().id}/join`);
    assert.equal(j.statusCode, 200);
    const again = await call(beto, 'POST', `/api/challenges/${chId}/teams`, { name: 'Otro' });
    assert.equal(again.statusCode, 400);
    const d = await call(ana, 'GET', `/api/challenges/${chId}`);
    const team = d.json().teamsList.find((x: any) => x.id === t.json().id);
    assert.equal(team.crossUniversity, true);
    const me = await call(beto, 'GET', '/api/me');
    assert.ok(me.json().badges.some((b: any) => b.id === 'puente'));
  });

  test('el tablero de impacto es público y suma lo hecho', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/impact' });
    const t = r.json().totals;
    assert.ok(t.mentoring_hours >= 2);
    assert.ok(t.cross_university_teams >= 1);
    assert.equal(t.countries, 2);
  });

  test('el mapa no expone ubicación de personas', async () => {
    const r = await call(ana, 'GET', '/api/map');
    const keys = Object.keys(r.json());
    assert.deepEqual(keys.sort(), ['campuses', 'challenges', 'communities', 'events', 'help']);
    assert.ok(!JSON.stringify(r.json()).includes('email'));
  });

  test('el estudiante puede eliminar su cuenta y sus datos', async () => {
    const { token } = await login('borrar.cuenta@unisalle.edu.co');
    const r = await call(token, 'DELETE', '/api/me');
    assert.equal(r.statusCode, 204);
    const row = await pool.query('select 1 from users where email = $1', ['borrar.cuenta@unisalle.edu.co']);
    assert.equal(row.rowCount, 0);
  });

  test('el asistente Juanita responde en modo guía y lleva a la pantalla correcta', async () => {
    const { token } = await login('asistente.prueba@ulasalle.edu.pe');
    const sin = await app.inject({ method: 'POST', url: '/api/assistant', payload: { messages: [{ role: 'user', content: 'hola' }] } });
    assert.equal(sin.statusCode, 401);
    const r = await call(token, 'POST', '/api/assistant', { messages: [{ role: 'user', content: '¿Cómo pido ayuda en Cálculo?' }], page: '/' });
    assert.equal(r.statusCode, 200, r.body);
    const j = r.json();
    assert.equal(j.mode, 'guia');
    assert.ok(j.actions.some((a: any) => a.to === '/mentoria/nueva'));
  });

  test('el asistente solo acepta botones hacia pantallas de la app', () => {
    const r = parseActions('Ve a pedir ayuda. [[ir:/mentoria/nueva|Pedir ayuda]] [[ir:https://malicioso.com|Clic]] [[ir:/admin|Admin]]');
    assert.deepEqual(r.actions, [{ to: '/mentoria/nueva', label: 'Pedir ayuda' }]);
    assert.equal(r.reply, 'Ve a pedir ayuda.');
  });

  test('con clave usa la IA y, si la IA falla, vuelve al modo guía', async () => {
    const { token } = await login('asistente.ia@ulasalle.edu.pe');
    const realFetch = globalThis.fetch;
    config.anthropicApiKey = 'clave-de-prueba';
    try {
      let enviado: any = null;
      globalThis.fetch = (async (_url: any, init: any) => {
        enviado = JSON.parse(init.body);
        return new Response(JSON.stringify({ content: [{ type: 'text', text: 'Claro, crea tu semillero así. [[ir:/comunidades/nueva|Crear comunidad]]' }] }), { status: 200 });
      }) as any;
      const ok = await call(token, 'POST', '/api/assistant', { messages: [{ role: 'user', content: 'quiero un semillero de IA' }] });
      assert.equal(ok.json().mode, 'ia');
      assert.deepEqual(ok.json().actions, [{ to: '/comunidades/nueva', label: 'Crear comunidad' }]);
      assert.ok(!JSON.stringify(enviado).includes('asistente.ia@'), 'no se envía el correo del usuario a la IA');

      globalThis.fetch = (async () => new Response('caído', { status: 529 })) as any;
      const caida = await call(token, 'POST', '/api/assistant', { messages: [{ role: 'user', content: 'como pido ayuda' }] });
      assert.equal(caida.statusCode, 200);
      assert.equal(caida.json().mode, 'guia');
    } finally {
      globalThis.fetch = realFetch;
      config.anthropicApiKey = '';
    }
  });

  test('La Salle hoy solo usa la red La Salle, prueba varias rutas y nunca queda vacía', async () => {
    const { token } = await login('noticias.prueba@ulasalle.edu.pe');
    const realFetch = globalThis.fetch;
    const pedidas: string[] = [];
    globalThis.fetch = (async (url: any) => {
      const u = String(url);
      pedidas.push(u);
      // lasalle.org: la ruta principal falla y responde la versión /en
      if (u.startsWith('https://www.lasalle.org/wp-json') || u === 'https://www.lasalle.org/feed/') return new Response('bloqueado', { status: 403 });
      if (u.startsWith('https://www.lasalle.org/en/wp-json')) return new Response(JSON.stringify([{ id: 7, link: 'https://www.lasalle.org/en/nota-red', date_gmt: '2026-11-18T09:00:00', title: { rendered: 'Young Lasallians from 12 countries meet in Rome &#8211; a new chapter' }, excerpt: { rendered: '<p>International gathering of the network.</p>' }, _embedded: { 'wp:featuredmedia': [{ source_url: 'https://www.lasalle.org/img.jpg' }] } }]), { status: 200 });
      if (u.startsWith('https://www.lasalle.edu/wp-json')) return new Response(JSON.stringify([{ id: 9, link: 'javascript:alert(1)', title: { rendered: 'Enlace peligroso' } }, { id: 10, link: 'https://www.lasalle.edu/news/x', date_gmt: '2026-11-17T09:00:00', title: { rendered: 'La Salle University welcomes new students' }, excerpt: { rendered: 'Campus news' } }]), { status: 200 });
      if (u.includes('youtube.com/feeds')) return new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom"><entry><yt:videoId>abc123XYZ_-</yt:videoId><title>Bienvenida a cachimbos 2027</title><link rel="alternate" href="https://www.youtube.com/watch?v=abc123XYZ_-"/><published>2026-11-17T15:00:00+00:00</published><media:group><media:thumbnail url="https://i.ytimg.com/vi/abc123XYZ_-/hqdefault.jpg"/><media:description>Video oficial</media:description></media:group></entry></feed>`, { status: 200 });
      return new Response('no', { status: 404 });
    }) as any;
    try {
      clearNewsCache();
      const r = await call(token, 'GET', '/api/news?group=all');
      assert.equal(r.statusCode, 200, r.body);
      const j = r.json();
      assert.ok(pedidas.every((u) => /lasalle\.org|lasalle\.edu|lasalle\.mx|dlsu\.edu\.ph|lasalle\.edu\.co|salleurl\.edu|youtube\.com/.test(u)), 'solo consulta sitios de la red La Salle');
      const red = j.items.find((i: any) => i.sourceId === 'lasalleorg');
      assert.equal(red.title, 'Young Lasallians from 12 countries meet in Rome - a new chapter');
      assert.equal(red.image, 'https://www.lasalle.org/img.jpg');
      assert.ok(j.items.some((i: any) => i.sourceId === 'lasalle-philadelphia'));
      assert.ok(!j.items.some((i: any) => i.url.startsWith('javascript:')), 'descarta enlaces peligrosos');
      const video = j.items.find((i: any) => i.kind === 'video');
      assert.equal(video.url, 'https://www.youtube.com/watch?v=abc123XYZ_-');
      assert.equal(video.source, 'La Salle Prueba TV');
      assert.equal(j.featured, false);
      assert.ok(!j.sources.some((s: any) => s.id === 'dlsu-manila' || s.id === 'unisalle'), 'no acredita sitios que no respondieron');
      const st = await call(token, 'GET', '/api/news/status');
      assert.equal(st.json().find((s: any) => s.id === 'dlsu-manila').ok, false);

      // Si ninguna fuente responde desde el inicio, aparecen los destacados de la red La Salle.
      clearNewsCache();
      globalThis.fetch = (async () => new Response('caído', { status: 503 })) as any;
      const d = (await call(token, 'GET', '/api/news?group=lasalle')).json();
      assert.equal(d.featured, true);
      assert.ok(d.items.length >= 5 && d.items.every((i: any) => i.featured && /^https:\/\//.test(i.url)));
    } finally {
      globalThis.fetch = realFetch;
      clearNewsCache();
    }
  });

  test('La Salle hoy prioriza Arequipa, Colombia y México y lista sus redes oficiales', async () => {
    const { token } = await login('regiones.prueba@ulasalle.edu.pe');
    const realFetch = globalThis.fetch;
    const wp = (id: number, link: string, title: string, date: string) => new Response(JSON.stringify([{ id, link, date_gmt: date, title: { rendered: title }, excerpt: { rendered: 'Nota oficial' } }]), { status: 200 });
    globalThis.fetch = (async (url: any) => {
      const u = String(url);
      if (u.startsWith('https://www.lasalle.org/wp-json')) return wp(1, 'https://www.lasalle.org/nota', 'Noticia de la red mundial', '2026-11-19T10:00:00');
      if (u.startsWith('https://www.ulasalle.edu.pe/wp-json')) return wp(2, 'https://www.ulasalle.edu.pe/nota', 'ULASALLE presenta proyectos en la feria', '2026-11-10T10:00:00');
      if (u.startsWith('https://academia.lasalle.mx/wp-json')) return wp(3, 'https://academia.lasalle.mx/nota', 'La Salle México abre convocatoria', '2026-11-12T10:00:00');
      return new Response('no', { status: 404 });
    }) as any;
    try {
      clearNewsCache();
      const j = (await call(token, 'GET', '/api/news?group=all')).json();
      assert.equal(j.items[0].region, 'arequipa', 'Arequipa va primero aunque sea más antigua');
      assert.equal(j.items[1].region, 'mexico');
      assert.equal(j.items.at(-1).region, 'mundo');
      const mx = (await call(token, 'GET', '/api/news?group=all&region=mexico')).json();
      assert.ok(mx.items.length === 1 && mx.items[0].sourceId === 'lasalle-mx');
      const bad = await call(token, 'GET', '/api/news?region=marte');
      assert.equal(bad.statusCode, 400);
      const so = (await call(token, 'GET', '/api/news/socials')).json();
      assert.equal(so.items[0].region, 'arequipa');
      const fb = so.items.find((x: any) => x.url === 'https://www.facebook.com/ulasalle');
      assert.ok(fb && fb.embed === true, 'el Facebook de ULASALLE se puede ver con el plugin oficial');
      assert.ok(so.items.some((x: any) => x.url === 'https://www.instagram.com/ulasalleperu' && !x.embed));
      assert.ok(so.items.every((x: any) => x.url.startsWith('https://')));
    } finally {
      globalThis.fetch = realFetch;
      clearNewsCache();
    }
  });

  test('Las redes extra desde Render se validan', async () => {
    const { loadSocials } = await import('../src/news/socials.js');
    const list = loadSocials({ NEWS_SOCIAL_PAGES: 'mexico|facebook|La Salle MX|https://www.facebook.com/pagina; mexico|facebook|Falso|https://evil.example/x; luna|instagram|X|https://www.instagram.com/x; colombia|tiktok|Unisalle|http://www.tiktok.com/@u' } as any);
    assert.ok(list.some((x) => x.region === 'mexico' && x.embed && x.handle === 'pagina'));
    assert.ok(!list.some((x) => x.url.includes('evil') || x.url.includes('tiktok') || x.name === 'X'));
  });
});
