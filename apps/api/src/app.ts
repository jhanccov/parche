import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import { one, q } from './db.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import catalogRoutes from './routes/catalog.js';
import communityRoutes from './routes/communities.js';
import eventRoutes from './routes/events.js';
import helpRoutes from './routes/help.js';
import challengeRoutes from './routes/challenges.js';
import messageRoutes from './routes/messages.js';
import mapRoutes from './routes/map.js';
import impactRoutes from './routes/impact.js';
import reportRoutes from './routes/reports.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' } });

  await app.register(cors, { origin: config.webOrigin });
  await app.register(jwt, { secret: config.jwtSecret, sign: { expiresIn: '30d' } });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.decorate('auth', async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new HttpError(401, 'Inicia sesión para continuar');
    }
    const u = await one('update users set last_seen = now() where id = $1 returning id', [req.user.sub]);
    if (!u) throw new HttpError(401, 'Usuario no encontrado');
  });

  app.setErrorHandler((err: any, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: 'Datos inválidos', detalles: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    }
    if (err instanceof HttpError) return reply.status(err.status).send({ error: err.message });
    if (err.statusCode && err.statusCode < 500) return reply.status(err.statusCode).send({ error: err.message });
    app.log.error(err);
    return reply.status(500).send({ error: 'Error interno' });
  });

  app.get('/api/health', async () => {
    const r = await one<{ now: string }>('select now()');
    return { ok: true, db: !!r, demo: config.demoMode, ts: r?.now };
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(meRoutes, { prefix: '/api/me' });
  await app.register(catalogRoutes, { prefix: '/api' });
  await app.register(communityRoutes, { prefix: '/api/communities' });
  await app.register(eventRoutes, { prefix: '/api/events' });
  await app.register(helpRoutes, { prefix: '/api/help' });
  await app.register(challengeRoutes, { prefix: '/api/challenges' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(mapRoutes, { prefix: '/api/map' });
  await app.register(impactRoutes, { prefix: '/api/impact' });
  await app.register(reportRoutes, { prefix: '/api/reports' });

  return app;
}

export async function getUser(id: string) {
  return one(
    `select u.id, u.email, u.name, u.university_id, un.short_name as university, u.campus_id, c.name as campus,
            c.city, u.career, u.semester, u.bio, u.skills, u.interests, u.role
       from users u
       left join universities un on un.id = u.university_id
       left join campuses c on c.id = u.campus_id
      where u.id = $1`,
    [id],
  );
}

export async function requireProfile(userId: string) {
  const u = await one<{ name: string | null }>('select name from users where id = $1', [userId]);
  if (!u?.name) throw new HttpError(403, 'Completa tu perfil primero');
}

export { q, one };
