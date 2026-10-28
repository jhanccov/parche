import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError, requireProfile } from '../app.js';
import { one, q, tx } from '../db.js';
import { award } from '../points.js';

const list = `
  select ch.*, (select count(*) from teams t where t.challenge_id = ch.id)::int as teams,
         (select count(*) from team_members tm join teams t on t.id = tm.team_id where t.challenge_id = ch.id)::int as participants,
         (select count(distinct u.university_id) from team_members tm join teams t on t.id = tm.team_id join users u on u.id = tm.user_id where t.challenge_id = ch.id)::int as universities
    from challenges ch`;

export default async function challengeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    const { country } = z.object({ country: z.string().optional() }).parse(req.query);
    return country ? q(`${list} where ch.country = $1 order by ch.created_at desc`, [country]) : q(`${list} order by ch.created_at desc`);
  });

  app.get('/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const ch = await one<any>(`${list} where ch.id = $1`, [id]);
    if (!ch) throw new HttpError(404, 'Reto no encontrado');
    const teams = await q<any>(
      `select t.id, t.name, t.max_members, t.created_at,
              coalesce(json_agg(json_build_object('id', u.id, 'name', u.name, 'university', un.short_name, 'career', u.career)
                       order by tm.joined_at) filter (where u.id is not null), '[]') as members
         from teams t left join team_members tm on tm.team_id = t.id left join users u on u.id = tm.user_id
         left join universities un on un.id = u.university_id
        where t.challenge_id = $1 group by t.id order by t.created_at`,
      [id],
    );
    const teamIds = teams.map((t) => t.id);
    const updates = teamIds.length
      ? await q(
          `select tu.id, tu.team_id, tu.body, tu.created_at, u.name as author from team_updates tu left join users u on u.id = tu.author_id
            where tu.team_id = any($1::uuid[]) order by tu.created_at desc limit 30`,
          [teamIds],
        )
      : [];
    const myTeam = teams.find((t) => t.members.some((m: any) => m.id === req.user.sub))?.id ?? null;
    return { ...ch, teamsList: teams.map((t) => ({ ...t, crossUniversity: new Set(t.members.map((m: any) => m.university)).size > 1 })), updates, myTeam };
  });

  app.post('/', async (req) => {
    await requireProfile(req.user.sub);
    const b = z.object({
      title: z.string().trim().min(5).max(120),
      summary: z.string().trim().min(10).max(200),
      problem: z.string().trim().min(20).max(1500),
      organization: z.string().trim().min(2).max(120),
      territory: z.string().trim().min(2).max(120),
      country: z.enum(['Colombia', 'Perú']),
      lat: z.number().min(-60).max(15),
      lng: z.number().min(-90).max(-60),
      ods: z.array(z.number().int().min(1).max(17)).max(5).default([]),
      skills: z.array(z.string()).max(8).default([]),
    }).parse(req.body);
    return one(
      `insert into challenges (title, summary, problem, organization, territory, country, lat, lng, ods, skills, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [b.title, b.summary, b.problem, b.organization, b.territory, b.country, b.lat, b.lng, b.ods, b.skills, req.user.sub],
    );
  });

  async function myTeamIn(challengeId: string, userId: string) {
    return one<{ id: string }>(
      `select t.id from teams t join team_members tm on tm.team_id = t.id where t.challenge_id = $1 and tm.user_id = $2`,
      [challengeId, userId],
    );
  }

  app.post('/:id/teams', async (req) => {
    await requireProfile(req.user.sub);
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { name } = z.object({ name: z.string().trim().min(3).max(60) }).parse(req.body);
    if (await myTeamIn(id, req.user.sub)) throw new HttpError(400, 'Ya estás en un equipo de este reto');
    const teamId = await tx(async (c) => {
      const r = await c.query(`insert into teams (challenge_id, name, created_by) values ($1, $2, $3) returning id`, [id, name, req.user.sub]);
      await c.query(`insert into team_members (team_id, user_id) values ($1, $2)`, [r.rows[0].id, req.user.sub]);
      await c.query(`update challenges set status = 'en_progreso' where id = $1 and status = 'abierto'`, [id]);
      return r.rows[0].id as string;
    });
    await award(req.user.sub, 'crear_equipo', teamId);
    return { id: teamId };
  });

  app.post('/teams/:teamId/join', async (req) => {
    await requireProfile(req.user.sub);
    const { teamId } = z.object({ teamId: z.string().uuid() }).parse(req.params);
    const t = await one<any>(`select t.*, (select count(*) from team_members m where m.team_id = t.id)::int as n from teams t where t.id = $1`, [teamId]);
    if (!t) throw new HttpError(404, 'Equipo no encontrado');
    if (t.n >= t.max_members) throw new HttpError(400, 'El equipo está completo');
    if (await myTeamIn(t.challenge_id, req.user.sub)) throw new HttpError(400, 'Ya estás en un equipo de este reto');
    await q(`insert into team_members (team_id, user_id) values ($1, $2)`, [teamId, req.user.sub]);
    await award(req.user.sub, 'unirse_equipo', teamId);
    return { ok: true };
  });

  app.post('/teams/:teamId/updates', async (req) => {
    const { teamId } = z.object({ teamId: z.string().uuid() }).parse(req.params);
    const { body } = z.object({ body: z.string().trim().min(5).max(600) }).parse(req.body);
    const m = await one('select 1 from team_members where team_id = $1 and user_id = $2', [teamId, req.user.sub]);
    if (!m) throw new HttpError(403, 'Solo miembros del equipo pueden publicar avances');
    const r = await one(`insert into team_updates (team_id, author_id, body) values ($1, $2, $3) returning id`, [teamId, req.user.sub, body]);
    await award(req.user.sub, 'avance_equipo', teamId);
    return r;
  });
}
