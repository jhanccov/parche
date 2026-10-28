import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HttpError, requireProfile } from '../app.js';
import { one, q } from '../db.js';
import { award, PUNTOS } from '../points.js';

const base = `
  select h.id, h.topic, h.title, h.detail, h.mode, h.status, h.hours, h.rating, h.created_at, h.resolved_at, h.lat, h.lng,
         h.author_id, a.name as author, a.career as author_career, ua.short_name as author_university, ca.name as campus,
         h.mentor_id, m.name as mentor, um.short_name as mentor_university
    from help_requests h
    join users a on a.id = h.author_id
    left join universities ua on ua.id = a.university_id
    left join users m on m.id = h.mentor_id
    left join universities um on um.id = m.university_id
    left join campuses ca on ca.id = h.campus_id`;

function jitter(v: number) {
  return v + (Math.random() - 0.5) * 0.003;
}

export default async function helpRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async (req) => {
    const { scope } = z.object({ scope: z.enum(['para-mi', 'todas', 'mias']).default('todas') }).parse(req.query);
    const me = req.user.sub;
    if (scope === 'mias') return q(`${base} where h.author_id = $1 or h.mentor_id = $1 order by h.created_at desc`, [me]);
    if (scope === 'para-mi') {
      return q(
        `${base} where h.status = 'abierta' and h.author_id <> $1
           and h.topic = any((select skills from users where id = $1)::text[]) order by h.created_at desc`,
        [me],
      );
    }
    return q(`${base} where h.status = 'abierta' order by h.created_at desc limit 100`);
  });

  app.get('/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const h = await one(`${base} where h.id = $1`, [id]);
    if (!h) throw new HttpError(404, 'Solicitud no encontrada');
    return h;
  });

  app.post('/', async (req) => {
    await requireProfile(req.user.sub);
    const b = z.object({
      topic: z.string().trim().min(2).max(40),
      title: z.string().trim().min(5).max(120),
      detail: z.string().trim().max(600).default(''),
      mode: z.enum(['presencial', 'virtual']).default('virtual'),
    }).parse(req.body);
    const open = await one<{ n: number }>(`select count(*)::int as n from help_requests where author_id = $1 and status <> 'resuelta'`, [req.user.sub]);
    if ((open?.n ?? 0) >= 3) throw new HttpError(400, 'Tienes 3 solicitudes abiertas. Cierra alguna antes de pedir otra.');
    const me = await one<any>('select u.campus_id, c.lat, c.lng from users u left join campuses c on c.id = u.campus_id where u.id = $1', [req.user.sub]);
    const presencial = b.mode === 'presencial' && me?.lat != null;
    return one(
      `insert into help_requests (author_id, topic, title, detail, mode, campus_id, lat, lng) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [req.user.sub, b.topic, b.title, b.detail, b.mode, me?.campus_id ?? null, presencial ? jitter(me.lat) : null, presencial ? jitter(me.lng) : null],
    );
  });

  app.post('/:id/offer', async (req) => {
    await requireProfile(req.user.sub);
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const r = await one(
      `update help_requests set mentor_id = $2, status = 'en_curso' where id = $1 and status = 'abierta' and author_id <> $2 returning id`,
      [id, req.user.sub],
    );
    if (!r) throw new HttpError(409, 'Esta solicitud ya tiene mentor o no está disponible');
    await q(`insert into messages (channel, author_id, body) values ($1, $2, $3)`, [`help:${id}`, req.user.sub, 'Hola, puedo ayudarte con esto. ¿Cuándo te queda bien?']);
    return { ok: true };
  });

  app.post('/:id/resolve', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const b = z.object({ hours: z.number().min(0.5).max(8), rating: z.number().int().min(1).max(5) }).parse(req.body);
    const h = await one<any>(`select * from help_requests where id = $1`, [id]);
    if (!h || h.author_id !== req.user.sub) throw new HttpError(403, 'Solo quien pidió ayuda puede cerrarla');
    if (h.status !== 'en_curso') throw new HttpError(400, 'La solicitud no está en curso');
    await q(`update help_requests set status = 'resuelta', hours = $2, rating = $3, resolved_at = now() where id = $1`, [id, b.hours, b.rating]);
    await award(h.mentor_id, 'mentoria_por_hora', id, Math.round(PUNTOS.mentoria_por_hora * b.hours));
    await award(h.author_id, 'ayuda_resuelta', id);
    return { ok: true };
  });

  app.delete('/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const r = await one(`delete from help_requests where id = $1 and author_id = $2 and status = 'abierta' returning id`, [id, req.user.sub]);
    if (!r) throw new HttpError(400, 'Solo puedes borrar tus solicitudes abiertas');
    return { ok: true };
  });
}
