# Arquitectura

```
Navegador / PWA instalada
   │  HTTPS (JSON)
   ▼
Nginx (web) ── sirve la PWA y redirige /api ──► API Fastify (Node.js 22)
                                                   │ SQL
                                                   ▼
                                              PostgreSQL 16
```

## Componentes

| Componente | Tecnología | Responsabilidad |
| --- | --- | --- |
| `apps/web` | React 18, Vite, TypeScript, React Router, Leaflet, vite-plugin-pwa | Interfaz móvil, mapa, caché sin conexión, instalación como app |
| `apps/api` | Fastify 5, TypeScript, pg, Zod, @fastify/jwt, @fastify/rate-limit, Nodemailer | Autenticación, reglas de negocio, puntos, impacto |
| Base de datos | PostgreSQL 16 (`pgcrypto`) | Datos y agregados de impacto |
| Contenedores | Docker Compose | `db`, `api` y `web` con un solo comando |
| Monorepo | pnpm workspaces | Un repositorio, dependencias compartidas |

## Modelo de datos

- `universities`, `campuses`: red La Salle y sus sedes (incluida la sede rural Utopía).
- `users`: perfil por saberes (`skills`, `interests`), sin foto.
- `communities`, `community_members` (fundador, núcleo, miembro), `events`, `event_rsvps`.
- `help_requests`: estado `abierta`, `en_curso` o `resuelta`, con mentor, horas y calificación.
- `challenges`, `teams`, `team_members`, `team_updates`.
- `messages`: canales `community:<id>`, `team:<id>` y `help:<id>`; el acceso se valida por pertenencia.
- `points_log`: puntos por acción; las insignias se calculan a partir de la actividad.
- `reports`, `login_codes`.

## API principal

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/request-code` | Envía un código de 6 dígitos (solo dominios de la red) |
| POST | `/api/auth/verify` | Valida el código y devuelve un JWT |
| GET, PUT | `/api/me` | Perfil, puntos e insignias |
| GET | `/api/me/certificate` | Constancia de horas de mentoría |
| GET, POST | `/api/communities` | Listar (filtros) y crear |
| POST | `/api/communities/:id/join`, `/leave`, `/core` | Membresía y equipo núcleo |
| GET, POST | `/api/events`, `/api/events/:id/rsvp` | Eventos y asistencia |
| GET, POST | `/api/help` | Solicitudes (`scope=para-mi`, `todas`, `mias`) |
| POST | `/api/help/:id/offer`, `/resolve` | Ofrecer ayuda y cerrar con horas |
| GET, POST | `/api/challenges`, `/:id/teams`, `/teams/:id/join`, `/teams/:id/updates` | Retos y equipos |
| GET, POST | `/api/messages/:channel` | Chat por canal con sondeo incremental |
| GET | `/api/map` | Capas del mapa sin ubicación de personas |
| GET | `/api/impact` | Indicadores agregados públicos |

## Decisiones

- **PWA en vez de app nativa**: un solo código, se instala desde el navegador y pesa poco, clave donde la conexión es limitada.
- **SQL directo**: consultas de impacto claras y fáciles de auditar.
- **Chat por sondeo cada 3 s**: simple y robusto para el piloto; puede pasar a WebSocket sin cambiar el modelo.
- **Ubicación**: solo se guardan coordenadas de sedes, comunidades, eventos y retos. La ayuda presencial usa la sede con un desplazamiento aleatorio de unos 150 m.

## Pruebas

- `apps/api/test/api.test.ts`: 9 pruebas de integración contra PostgreSQL (dominios, código, perfil, comunidades, eventos, mentoría, retos, permisos de chat, impacto y privacidad del mapa).
- Recorrido de extremo a extremo con Playwright: registro real con código, perfil, solicitud de ayuda, unión a comunidad, chat, oferta y cierre de mentoría.
