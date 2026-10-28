import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../app.js';
import { one, q } from '../db.js';

export default async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.post('/', async (req) => {
    const b = z.object({
      target_type: z.enum(['community', 'help', 'challenge', 'message', 'user']),
      target_id: z.string().min(1).max(64),
      reason: z.string().trim().min(5).max(300),
    }).parse(req.body);
    await q(`insert into reports (reporter_id, target_type, target_id, reason) values ($1,$2,$3,$4)`, [req.user.sub, b.target_type, b.target_id, b.reason]);
    return { ok: true };
  });

  app.get('/', async (req) => {
    const me = await one<{ role: string }>('select role from users where id = $1', [req.user.sub]);
    if (me?.role !== 'admin') throw new HttpError(403, 'Solo moderadores');
    return q(`select * from reports order by created_at desc limit 100`);
  });
}
