process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://parche:parche@localhost:5432/parche_test';

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const { buildApp } = await import('../src/app.js');
const { migrate } = await import('../src/migrate.js');
const { resetAndSeed } = await import('../src/seed.js');
const { pool } = await import('../src/db.js');

let app: Awaited<ReturnType<typeof buildApp>>;

async function login(email: string) {
  const r1 = await app.inject({ method: 'POST', url: '/api/auth/request-code', payload: { email } });
  assert.equal(r1.statusCode, 200, r1.body);
  const code = r1.json().devCode;
  const r2 = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { email, code } });
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
});
