import { FastifyInstance } from 'fastify';
import { createHash, randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { config } from '../config.js';
import { one, q } from '../db.js';
import { HttpError } from '../app.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

async function universityForEmail(email: string) {
  const domain = email.split('@')[1] ?? '';
  return one<{ id: string; short_name: string }>(
    'select id, short_name from universities where $1 = any(domains)',
    [domain],
  );
}

async function sendCode(email: string, code: string) {
  if (!config.smtpUrl) return false;
  const t = nodemailer.createTransport(config.smtpUrl);
  await t.sendMail({
    from: config.mailFrom,
    to: email,
    subject: `Tu código de Parche: ${code}`,
    text: `Tu código para entrar a Parche es ${code}. Vence en 10 minutos.`,
  });
  return true;
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/request-code', {
    config: { rateLimit: { max: 5, timeWindow: '10 minutes', keyGenerator: (req) => String((req.body as any)?.email ?? req.ip).toLowerCase() } },
  }, async (req) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const e = email.trim().toLowerCase();
    const uni = await universityForEmail(e);
    if (!uni) throw new HttpError(403, 'Parche es solo para estudiantes de la red La Salle. Usa tu correo institucional.');
    const code = String(randomInt(100000, 1000000));
    await q(
      `insert into login_codes (email, code_hash, expires_at, attempts) values ($1, $2, now() + interval '10 minutes', 0)
       on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`,
      [e, hash(code)],
    );
    let sent = false;
    try {
      sent = await sendCode(e, code);
    } catch (err) {
      req.log.error(err, 'No se pudo enviar el correo');
    }
    if (!sent && !config.demoMode) throw new HttpError(503, 'No pudimos enviar el código a tu correo. Intenta de nuevo en unos minutos.');
    return { ok: true, university: uni.short_name, sent, devCode: !sent && config.demoMode ? code : undefined };
  });

  app.post('/verify', async (req) => {
    const { email, code } = z.object({ email: z.string().email(), code: z.string().length(6) }).parse(req.body);
    const e = email.trim().toLowerCase();
    const row = await one<{ code_hash: string; expires_at: Date; attempts: number }>('select * from login_codes where email = $1', [e]);
    if (!row || row.expires_at < new Date()) throw new HttpError(400, 'El código venció. Pide uno nuevo.');
    if (row.attempts >= 5) throw new HttpError(429, 'Demasiados intentos. Pide un código nuevo.');
    if (row.code_hash !== hash(code)) {
      await q('update login_codes set attempts = attempts + 1 where email = $1', [e]);
      throw new HttpError(400, 'Código incorrecto');
    }
    await q('delete from login_codes where email = $1', [e]);
    const uni = await universityForEmail(e);
    const user = await one<{ id: string; name: string | null }>(
      `insert into users (email, university_id) values ($1, $2)
       on conflict (email) do update set last_seen = now() returning id, name`,
      [e, uni?.id ?? null],
    );
    const token = app.jwt.sign({ sub: user!.id, email: e });
    return { token, needsProfile: !user!.name };
  });

  app.get('/demo-users', async () => {
    if (!config.demoMode) return [];
    return q(
      `select id, name, career, university, campus from (
         select u.id, u.name, u.career, un.short_name as university, c.name as campus, u.created_at,
                row_number() over (partition by u.university_id order by u.created_at) as n
           from users u join universities un on un.id = u.university_id left join campuses c on c.id = u.campus_id
          where u.email like '%.demo@%') x
        where n <= 2 order by created_at`,
    );
  });

  app.post('/demo-login', async (req) => {
    if (!config.demoMode) throw new HttpError(404, 'No disponible');
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const u = await one<{ id: string; email: string }>(`select id, email from users where id = $1 and email like '%.demo@%'`, [userId]);
    if (!u) throw new HttpError(404, 'Usuario demo no encontrado');
    return { token: app.jwt.sign({ sub: u.id, email: u.email }), needsProfile: false };
  });
}
