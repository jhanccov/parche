import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../app.js';
import { one, q } from '../db.js';

export async function canAccess(channel: string, userId: string) {
  const [kind, id] = channel.split(':');
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return false;
  if (kind === 'community') return !!(await one('select 1 from community_members where community_id = $1 and user_id = $2', [id, userId]));
  if (kind === 'team') return !!(await one('select 1 from team_members where team_id = $1 and user_id = $2', [id, userId]));
  if (kind === 'help') return !!(await one('select 1 from help_requests where id = $1 and (author_id = $2 or mentor_id = $2)', [id, userId]));
  return false;
}

export default async function messageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/:channel', async (req) => {
    const { channel } = z.object({ channel: z.string() }).parse(req.params);
    const { after } = z.object({ after: z.coerce.number().int().default(0) }).parse(req.query);
    if (!(await canAccess(channel, req.user.sub))) throw new HttpError(403, 'No tienes acceso a esta conversación');
    return q(
      `select m.id, m.body, m.created_at, m.author_id, u.name as author, un.short_name as university
         from messages m left join users u on u.id = m.author_id left join universities un on un.id = u.university_id
        where m.channel = $1 and m.id > $2 order by m.id limit 200`,
      [channel, after],
    );
  });

  app.post('/:channel', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req) => {
    const { channel } = z.object({ channel: z.string() }).parse(req.params);
    const { body } = z.object({ body: z.string().trim().min(1).max(1000) }).parse(req.body);
    if (!(await canAccess(channel, req.user.sub))) throw new HttpError(403, 'No tienes acceso a esta conversación');
    return one(`insert into messages (channel, author_id, body) values ($1, $2, $3) returning id, created_at`, [channel, req.user.sub, body]);
  });
}
