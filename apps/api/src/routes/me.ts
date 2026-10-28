import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUser, HttpError } from '../app.js';
import { one, q } from '../db.js';
import { badges, totalPoints } from '../points.js';

const perfil = z.object({
  name: z.string().trim().min(2).max(60),
  campus_id: z.string(),
  career: z.string().trim().min(2).max(80),
  semester: z.number().int().min(1).max(12),
  bio: z.string().trim().max(160).optional().default(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  interests: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export default async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    const u = await getUser(req.user.sub);
    return { ...u, points: await totalPoints(req.user.sub), badges: await badges(req.user.sub) };
  });

  app.put('/', async (req) => {
    const b = perfil.parse(req.body);
    const me = await one<{ university_id: string }>('select university_id from users where id = $1', [req.user.sub]);
    const campus = await one<{ university_id: string }>('select university_id from campuses where id = $1', [b.campus_id]);
    if (!campus || campus.university_id !== me?.university_id) throw new HttpError(400, 'La sede no pertenece a tu universidad');
    await q(
      `update users set name = $2, campus_id = $3, career = $4, semester = $5, bio = $6, skills = $7, interests = $8 where id = $1`,
      [req.user.sub, b.name, b.campus_id, b.career, b.semester, b.bio, b.skills, b.interests],
    );
    return getUser(req.user.sub);
  });

  app.get('/activity', async (req) => {
    const id = req.user.sub;
    const [communities, help, teams] = await Promise.all([
      q(`select c.id, c.name, c.category, cm.role from community_members cm join communities c on c.id = cm.community_id where cm.user_id = $1 order by cm.joined_at desc`, [id]),
      q(`select id, title, topic, status, author_id = $1 as mine from help_requests where (author_id = $1 or mentor_id = $1) and status <> 'resuelta' order by created_at desc`, [id]),
      q(`select t.id, t.name, ch.id as challenge_id, ch.title as challenge from team_members tm join teams t on t.id = tm.team_id join challenges ch on ch.id = t.challenge_id where tm.user_id = $1`, [id]),
    ]);
    return { communities, help, teams };
  });

  app.get('/certificate', async (req) => {
    const u = await getUser(req.user.sub);
    const sessions = await q(
      `select h.title, h.topic, h.hours, h.resolved_at, a.name as student, un.short_name as university
         from help_requests h join users a on a.id = h.author_id left join universities un on un.id = a.university_id
        where h.mentor_id = $1 and h.status = 'resuelta' order by h.resolved_at`,
      [req.user.sub],
    );
    const teams = await q(
      `select ch.title as challenge, ch.territory, t.name as team from team_members tm join teams t on t.id = tm.team_id
         join challenges ch on ch.id = t.challenge_id where tm.user_id = $1`,
      [req.user.sub],
    );
    const total = sessions.reduce((s: number, r: any) => s + Number(r.hours ?? 0), 0);
    return { user: u, sessions, teams, totalHours: total, issuedAt: new Date().toISOString() };
  });
}
