import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError, requireProfile } from '../app.js';
import { one, q, tx } from '../db.js';
import { award } from '../points.js';

const CATS = ['tecnologia', 'investigacion', 'territorio', 'cultura', 'deporte', 'bienestar'] as const;

const listSql = `
  select c.id, c.name, c.category, c.description, c.scope, c.goal_members, c.lat, c.lng, c.created_at,
         un.short_name as university, ca.name as campus, ca.city,
         (select count(*) from community_members m where m.community_id = c.id)::int as members,
         (select count(*) from community_members m where m.community_id = c.id and m.role in ('fundador','core'))::int as core,
         (select count(*) from events e where e.community_id = c.id)::int as events,
         (select count(distinct u.university_id) from community_members m join users u on u.id = m.user_id where m.community_id = c.id)::int as universities,
         exists(select 1 from community_members m where m.community_id = c.id and m.user_id = $1) as joined
    from communities c
    left join universities un on un.id = c.university_id
    left join campuses ca on ca.id = c.campus_id`;

export function progress(c: { members: number; core: number; events: number; goal_members: number }) {
  const steps = [
    { id: 'proposito', label: 'Propósito y descripción publicados', done: true },
    { id: 'core', label: 'Equipo núcleo de 3 o más personas', done: c.core >= 3, value: `${c.core}/3` },
    { id: 'evento', label: 'Primer evento programado', done: c.events >= 1, value: c.events >= 1 ? `${c.events} eventos` : '0/1' },
    { id: 'miembros', label: `Meta de ${c.goal_members} miembros`, done: c.members >= c.goal_members, value: `${c.members}/${c.goal_members}` },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, percent: Math.round((done / steps.length) * 100), status: done === steps.length ? 'activa' : 'en_formacion' };
}

export default async function communityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    const f = z.object({ category: z.enum(CATS).optional(), mine: z.coerce.boolean().optional(), q: z.string().optional() }).parse(req.query);
    const where: string[] = [];
    const params: unknown[] = [req.user.sub];
    if (f.category) { params.push(f.category); where.push(`c.category = $${params.length}`); }
    if (f.mine) where.push(`exists(select 1 from community_members m where m.community_id = c.id and m.user_id = $1)`);
    if (f.q) { params.push(`%${f.q}%`); where.push(`(c.name ilike $${params.length} or c.description ilike $${params.length})`); }
    const rows = await q(`${listSql} ${where.length ? 'where ' + where.join(' and ') : ''} order by members desc, c.created_at desc`, params);
    return rows.map((r: any) => ({ ...r, progress: progress(r) }));
  });

  app.get('/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const c = await one<any>(`${listSql} where c.id = $2`, [req.user.sub, id]);
    if (!c) throw new HttpError(404, 'Comunidad no encontrada');
    const members = await q(
      `select u.id, u.name, u.career, un.short_name as university, m.role from community_members m
         join users u on u.id = m.user_id left join universities un on un.id = u.university_id
        where m.community_id = $1 order by case m.role when 'fundador' then 0 when 'core' then 1 else 2 end, m.joined_at`,
      [id],
    );
    const events = await q(
      `select e.*, (select count(*) from event_rsvps r where r.event_id = e.id)::int as going,
              exists(select 1 from event_rsvps r where r.event_id = e.id and r.user_id = $2) as rsvp
         from events e where e.community_id = $1 order by e.starts_at`,
      [id, req.user.sub],
    );
    const myRole = members.find((m: any) => m.id === req.user.sub)?.role ?? null;
    return { ...c, progress: progress(c), memberList: members, events, myRole };
  });

  app.post('/', async (req) => {
    await requireProfile(req.user.sub);
    const b = z.object({
      name: z.string().trim().min(3).max(80),
      category: z.enum(CATS),
      description: z.string().trim().min(20).max(600),
      scope: z.enum(['campus', 'red']).default('campus'),
      goal_members: z.number().int().min(5).max(200).default(18),
    }).parse(req.body);
    const me = await one<any>(`select u.university_id, u.campus_id, c.lat, c.lng from users u left join campuses c on c.id = u.campus_id where u.id = $1`, [req.user.sub]);
    const id = await tx(async (c) => {
      const r = await c.query(
        `insert into communities (name, category, description, scope, goal_members, university_id, campus_id, lat, lng, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [b.name, b.category, b.description, b.scope, b.goal_members, b.scope === 'red' ? null : me.university_id, me.campus_id, me.lat, me.lng, req.user.sub],
      );
      await c.query(`insert into community_members (community_id, user_id, role) values ($1, $2, 'fundador')`, [r.rows[0].id, req.user.sub]);
      return r.rows[0].id as string;
    });
    await award(req.user.sub, 'crear_comunidad', id);
    return { id };
  });

  app.post('/:id/join', async (req) => {
    await requireProfile(req.user.sub);
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const r = await q(`insert into community_members (community_id, user_id) values ($1, $2) on conflict do nothing returning user_id`, [id, req.user.sub]);
    if (r.length) await award(req.user.sub, 'unirse_comunidad', id);
    return { ok: true };
  });

  app.post('/:id/leave', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const m = await one<{ role: string }>('select role from community_members where community_id = $1 and user_id = $2', [id, req.user.sub]);
    if (m?.role === 'fundador') throw new HttpError(400, 'Quien fundó la comunidad no puede salir; transfiere el rol primero');
    await q('delete from community_members where community_id = $1 and user_id = $2', [id, req.user.sub]);
    return { ok: true };
  });

  app.post('/:id/core', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const m = await one<{ role: string }>('select role from community_members where community_id = $1 and user_id = $2', [id, req.user.sub]);
    if (m?.role !== 'fundador') throw new HttpError(403, 'Solo quien fundó puede sumar al equipo núcleo');
    await q(`update community_members set role = 'core' where community_id = $1 and user_id = $2 and role = 'miembro'`, [id, userId]);
    return { ok: true };
  });
}
