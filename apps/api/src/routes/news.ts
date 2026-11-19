import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db.js';
import { getNews } from '../news/fetcher.js';
import { loadSocials } from '../news/socials.js';

const SOCIALS = loadSocials();

const query = z.object({
  group: z.enum(['lasalle', 'video', 'all']).optional().default('all'),
  region: z.enum(['arequipa', 'colombia', 'mexico', 'mundo']).optional(),
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

  // Redes oficiales por región (Arequipa, Colombia, México y el resto de la red).
  app.get('/socials', async () => ({ items: SOCIALS }));

}
