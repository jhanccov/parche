process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://parche:parche@localhost:5432/parche_test';

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const { buildApp } = await import('../src/app.js');
const { migrate } = await import('../src/migrate.js');
const { resetAndSeed } = await import('../src/seed.js');
const { pool } = await import('../src/db.js');
const { parseActions } = await import('../src/routes/assistant.js');
const { config } = await import('../src/config.js');
const { clearNewsCache, refreshAll } = await import('../src/news/fetcher.js');

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

  test('Tech hoy junta Xataka, DEV y Hacker News, limpia el texto y sobrevive a una fuente caída', async () => {
    const { token } = await login('noticias.prueba@ulasalle.edu.pe');
    const realFetch = globalThis.fetch;
    const rss = `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Xataka</title>
      <item><title>La inteligencia artificial llega a las aulas — y cambia todo</title><link>https://www.xataka.com/nota-ia</link>
        <description><![CDATA[<p>Un <b>modelo</b> nuevo &amp; gratuito para estudiantes.</p><img src="https://i.blogs.es/foto.jpg">]]></description>
        <pubDate>Wed, 18 Nov 2026 10:00:00 GMT</pubDate></item>
      <item><title>Enlace peligroso</title><link>javascript:alert(1)</link><description>x</description></item>
    </channel></rss>`;
    let enterFalla = true;
    globalThis.fetch = (async (url: any) => {
      const u = String(url);
      if (u.includes('xataka')) return new Response(rss, { status: 200 });
      if (u.includes('enter.co')) return enterFalla ? new Response('error', { status: 500 }) : new Response(rss.replace(/xataka/g, 'enter'), { status: 200 });
      if (u.includes('dev.to')) return new Response(JSON.stringify([{ id: 1, title: 'Build a REST API with Python', description: 'Step by step', url: 'https://dev.to/a/api', cover_image: 'https://media.dev.to/c.png', tag_list: ['python', 'webdev'], published_at: '2026-11-18T08:00:00Z', positive_reactions_count: 50 }]), { status: 200 });
      if (u.includes('topstories')) return new Response(JSON.stringify([101]), { status: 200 });
      if (u.includes('/item/101')) return new Response(JSON.stringify({ id: 101, type: 'story', title: 'New open source database', url: 'https://example.com/db', score: 320, descendants: 80, time: 1795000000 }), { status: 200 });
      return new Response('no', { status: 404 });
    }) as any;
    try {
      clearNewsCache();
      await call(token, 'PUT', '/api/me', { name: 'Noticias Prueba', campus_id: (await pool.query("select c.id from campuses c join universities u on u.id = c.university_id where u.short_name = 'ULASALLE' limit 1")).rows[0].id, career: 'Ingeniería de Software', semester: 3, interests: ['Inteligencia artificial'], skills: [] });
      const r = await call(token, 'GET', '/api/news?group=all');
      assert.equal(r.statusCode, 200, r.body);
      const j = r.json();
      const ids = j.items.map((i: any) => i.sourceId);
      assert.ok(ids.includes('xataka') && ids.includes('devto') && ids.includes('hn'));
      const ia = j.items.find((i: any) => i.sourceId === 'xataka');
      assert.equal(ia.title, 'La inteligencia artificial llega a las aulas - y cambia todo');
      assert.equal(ia.summary, 'Un modelo nuevo & gratuito para estudiantes.');
      assert.equal(ia.image, 'https://i.blogs.es/foto.jpg');
      assert.ok(ia.topics.includes('ia') && ia.forYou, 'se marca para ti según lo que quiere aprender');
      assert.ok(!j.items.some((i: any) => i.url.startsWith('javascript:')), 'descarta enlaces peligrosos');
      assert.equal(j.sources.find((s: any) => s.id === 'enter').ok, false);

      // Si todas las fuentes fallan, se mantienen las últimas noticias.
      globalThis.fetch = (async () => new Response('caído', { status: 503 })) as any;
      await refreshAll(true);
      const r2 = await call(token, 'GET', '/api/news?group=es');
      assert.ok(r2.json().items.some((i: any) => i.sourceId === 'xataka'));
    } finally {
      globalThis.fetch = realFetch;
      clearNewsCache();
    }
  });
});
