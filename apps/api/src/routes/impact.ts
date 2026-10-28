import { FastifyInstance } from 'fastify';
import { one, q } from '../db.js';

export default async function impactRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const totals = await one<any>(`
      select
        (select count(*) from users where name is not null)::int as students,
        (select count(distinct university_id) from users where name is not null)::int as universities,
        (select count(distinct c.country) from users u join campuses c on c.id = u.campus_id)::int as countries,
        (select count(*) from communities)::int as communities,
        (select count(*) from community_members)::int as memberships,
        (select count(*) from events)::int as events,
        (select count(*) from help_requests where status = 'resuelta')::int as mentorships,
        (select coalesce(sum(hours), 0) from help_requests where status = 'resuelta')::float as mentoring_hours,
        (select round(avg(rating)::numeric, 1) from help_requests where rating is not null)::float as avg_rating,
        (select count(*) from challenges)::int as challenges,
        (select count(*) from teams)::int as teams,
        (select count(*) from (
           select t.id from teams t join team_members tm on tm.team_id = t.id join users u on u.id = tm.user_id
            group by t.id having count(distinct u.university_id) > 1) x)::int as cross_university_teams,
        (select count(distinct territory) from challenges)::int as territories`);
    const byUniversity = await q(`
      select un.short_name as university, un.country,
             count(distinct u.id)::int as students,
             coalesce(sum(h.hours) filter (where h.status = 'resuelta'), 0)::float as hours
        from universities un left join users u on u.university_id = un.id and u.name is not null
        left join help_requests h on h.mentor_id = u.id
       group by un.id order by students desc`);
    const topics = await q(`
      select topic, count(*)::int as requests, count(*) filter (where status = 'resuelta')::int as solved
        from help_requests group by topic order by requests desc limit 8`);
    const topMentors = await q(`
      select u.name, un.short_name as university, coalesce(sum(h.hours), 0)::float as hours, count(*)::int as sessions
        from help_requests h join users u on u.id = h.mentor_id left join universities un on un.id = u.university_id
       where h.status = 'resuelta' group by u.id, un.short_name order by hours desc limit 5`);
    return { totals, byUniversity, topics, topMentors };
  });
}
