import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError, requireProfile } from '../app.js';
import { one, q } from '../db.js';
import { award } from '../points.js';

export default async function eventRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    return q(
      `select e.id, e.title, e.description, e.starts_at, e.place, e.virtual_url, e.lat, e.lng,
              c.id as community_id, c.name as community, c.category,
              (select count(*) from event_rsvps r where r.event_id = e.id)::int as going,
              exists(select 1 from event_rsvps r where r.event_id = e.id and r.user_id = $1) as rsvp
         from events e left join communities c on c.id = e.community_id
        where e.starts_at > now() - interval '3 hours'
        order by e.starts_at limit 50`,
      [req.user.sub],
    );
  });

  app.post('/', async (req) => {
    await requireProfile(req.user.sub);
    const b = z.object({
      community_id: z.string().uuid(),
      title: z.string().trim().min(3).max(100),
      description: z.string().trim().max(500).default(''),
      starts_at: z.string().datetime({ offset: true }),
      place: z.string().trim().max(120).default(''),
      virtual_url: z.string().url().optional(),
    }).parse(req.body);
    const m = await one<{ role: string }>('select role from community_members where community_id = $1 and user_id = $2', [b.community_id, req.user.sub]);
    if (!m || m.role === 'miembro') throw new HttpError(403, 'Solo el equipo núcleo puede crear eventos');
    const c = await one<{ lat: number; lng: number }>('select lat, lng from communities where id = $1', [b.community_id]);
    const r = await one<{ id: string }>(
      `insert into events (community_id, title, description, starts_at, place, virtual_url, lat, lng, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [b.community_id, b.title, b.description, b.starts_at, b.place, b.virtual_url ?? null, c?.lat ?? null, c?.lng ?? null, req.user.sub],
    );
    await award(req.user.sub, 'crear_evento', r!.id);
    return r;
  });

  app.post('/:id/rsvp', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const ex = await one('select 1 from event_rsvps where event_id = $1 and user_id = $2', [id, req.user.sub]);
    if (ex) await q('delete from event_rsvps where event_id = $1 and user_id = $2', [id, req.user.sub]);
    else await q('insert into event_rsvps (event_id, user_id) values ($1, $2)', [id, req.user.sub]);
    return { rsvp: !ex };
  });
}
