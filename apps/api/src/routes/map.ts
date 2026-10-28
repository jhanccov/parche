import { FastifyInstance } from 'fastify';
import { q } from '../db.js';

export default async function mapRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/', async () => {
    const [campuses, communities, events, challenges, help] = await Promise.all([
      q(`select c.id, c.name, c.city, c.country, c.lat, c.lng, c.rural, u.short_name as university from campuses c join universities u on u.id = c.university_id`),
      q(`select c.id, c.name, c.category, c.lat, c.lng, (select count(*) from community_members m where m.community_id = c.id)::int as members
           from communities c where c.lat is not null`),
      q(`select e.id, e.title, e.starts_at, e.place, e.lat, e.lng, e.community_id from events e
          where e.lat is not null and e.starts_at > now() - interval '3 hours' order by e.starts_at limit 100`),
      q(`select id, title, territory, country, lat, lng, status from challenges`),
      q(`select id, title, topic, lat, lng from help_requests where status = 'abierta' and lat is not null`),
    ]);
    return { campuses, communities, events, challenges, help };
  });
}
