import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { Action, ROUTES, answerFromKb, kbAsContext } from '../assistant/kb.js';

const body = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(800) })).min(1).max(12),
  page: z.string().max(80).optional(),
});

const SYSTEM = () => `Eres Juanita, la guía de Parche, una app web para estudiantes de la red La Salle de Perú y Colombia (comunidades, mentoría entre pares y retos del territorio).
Respondes en español, con tono cercano y breve (máximo 90 palabras), solo sobre cómo usar Parche y la vida estudiantil relacionada.
Si te preguntan algo ajeno a la app, dilo con amabilidad y vuelve a lo que puedes hacer en Parche. No inventes funciones que no estén en esta lista.
No pidas datos personales (DNI, teléfono, dirección, contraseñas) y recuerda no compartirlos si el usuario los escribe.
Puedes resolver dudas académicas cortas, pero invita a pedir ayuda en Mentoría para algo más largo.

Lo que hace Parche:
${kbAsContext()}

Pantallas a las que puedes llevar al usuario: ${Object.entries(ROUTES).map(([to, l]) => `${to} (${l})`).join(', ')}.
Si una pantalla ayuda, termina tu respuesta con una o dos líneas con este formato exacto: [[ir:/ruta|Texto del botón]]`;

// Extrae los botones [[ir:/ruta|Texto]] y descarta cualquier ruta que no esté en la lista permitida.
export function parseActions(text: string): { reply: string; actions: Action[] } {
  const actions: Action[] = [];
  const reply = text.replace(/\[\[ir:([^|\]]+)\|([^\]]+)\]\]/g, (_m, to: string, label: string) => {
    const path = to.trim();
    if (ROUTES[path] && actions.length < 3 && !actions.some((a) => a.to === path)) actions.push({ to: path, label: label.trim().slice(0, 40) });
    return '';
  }).trim();
  return { reply, actions };
}

async function askClaude(messages: { role: 'user' | 'assistant'; content: string }[], page?: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': config.anthropicApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: config.anthropicModel,
        max_tokens: 400,
        system: SYSTEM() + (page ? `\nEl usuario está en la pantalla ${page}.` : ''),
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data: any = await res.json();
    const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    if (!text) throw new Error('Respuesta vacía');
    return parseActions(text);
  } finally {
    clearTimeout(t);
  }
}

export default async function assistantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/status', async () => ({ ai: !!config.anthropicApiKey }));

  app.post('/', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute', hook: 'preHandler', keyGenerator: (req) => String((req.user as any)?.sub ?? req.ip) } },
  }, async (req) => {
    const { messages, page } = body.parse(req.body);
    const last = [...messages].reverse().find((m) => m.role === 'user')!.content;
    if (config.anthropicApiKey) {
      try {
        const r = await askClaude(messages[0].role === 'user' ? messages : messages.slice(1), page);
        return { mode: 'ia', ...r };
      } catch (err) {
        req.log.warn({ err }, 'Asistente con IA no disponible; se responde en modo guía');
      }
    }
    const g = answerFromKb(last);
    return { mode: 'guia', reply: g.answer, actions: g.actions };
  });
}
