import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db.js';
import { getNews } from '../news/fetcher.js';

const query = z.object({
  group: z.enum(['es', 'dev', 'trend', 'all']).optional().default('all'),
  topic: z.string().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional().default(30),
});

export default async function newsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    const q = query.parse(req.query);
    const u = await one<{ interests: string[]; skills: string[] }>('select interests, skills from users where id = $1', [req.user.sub]);
    // "Para ti" se basa en lo que el estudiante quiere aprender; si no marcó nada, en lo que sabe.
    const interests = u?.interests?.length ? u.interests : u?.skills ?? [];
    return getNews({ ...q, interests });
  });
}
