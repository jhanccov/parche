# Plan: mejoras de app y branding

Propuesta de revisión del 3 nov 2026. Objetivo: dejar Parche listo para el piloto de 8 semanas
(30 estudiantes, 2 comunidades, 50 h de mentoría, 2 retos) sin deuda visible de marca ni de UX.

Base que se conserva: PWA instalable, sistema navy/ámbar, motion con
`prefers-reduced-motion`, mensajes de privacidad, tagline en construcción
("Aprende / Crea / Conecta / Transforma con tu parche La Salle").

## P0 — Antes del piloto

Marca:

- [ ] Isotipo compacto: spark ✦ solo (o "p" + spark) en rounded-square navy.
- [ ] Regenerar `public/icon-192.png` e `icon-512.png` desde el isotipo (hoy el
      wordmark queda ilegible en el home del teléfono) y `logo/render_logo.py`.
- [ ] `theme-color` consistente con el fondo real (`#06162B` en páginas oscuras)
      o unificar fondo claro/oscuro para evitar el flash entre Home y el resto.
- [ ] Ámbar `#F7A800` solo sobre superficies oscuras; texto siempre navy
      (el ámbar sobre blanco no pasa contraste AA).
- [ ] Usar siempre el descriptor: `Parche · Comunidades La Salle` en
      `<title>`, manifest y documentos (solo "Parche" no es buscable).

App:

- [ ] `Home.tsx`: `fcard` como `<article>` + CTA Link + botones hermanos
      (hoy es `<Link>` con `<button>` dentro: HTML inválido y doble navegación).
- [ ] `Home.tsx` `rsvp()`: añadir try/catch como en `join`/`offer`.
- [ ] `useApi.ts`: `AbortController` para evitar setState post-unmount y carreras.
- [ ] Login: no renderizar `devCode` ni demo-users fuera de `DEMO_MODE`;
      mostrar "código expira en 10 min" e intentos restantes.
- [ ] Mapa: leyenda de markers (campus / rural / reto) y nota de
      "ubicaciones aproximadas".
- [ ] Impacto: decidir anonimato de `topMentors` (hoy expone nombres + horas)
      o pedir consentimiento en onboarding; documentar en
      `docs/privacidad-y-seguridad.md`.

## P1 — Durante el piloto

- [ ] Navegación: sacar Mapa e Impacto de los iconos sin etiqueta del topbar;
      5 tabs etiquetados + acceso visible a Mapa e Impacto.
- [ ] Mentoría: cierre como checklist visible
      ("1. Acepta · 2. Chatea · 3. Confirma horas + calificación").
- [ ] Retos: filtros por ODS y por estado.
- [ ] Constancia: folio/QR verificable (hoy es una tabla falsificable).
- [ ] `docs/marca.md`: tokens (colores, tipografía, tracking), escala y reglas
      de uso del isotipo/wordmark.
- [ ] PWA: `scope`, `id`, 2 screenshots y shortcut a `/mentoria/nueva`.

## P2 — Post-piloto

- [ ] Stickers propios por pilar (reemplazo progresivo de emojis en UI;
      emojis solo en contenido de usuarios).
- [ ] Ilustraciones de empty-states (hoy cajas punteadas genéricas).
- [ ] Feed con fallback offline real (hoy `NetworkFirst` sin vista sin conexión).
- [ ] Tipografía: Nunito 700+800 para display + cuerpo definido, documentado.

## Decisiones de marca

- Nombre: se conserva "parche" (doble sentido: arreglo + grupo de amigos).
- Tagline fijado: **"Aprende, crea y transforma con tu red La Salle"**.
- Copy: afirmación en vez de defensa — "Cada conexión nace de un propósito:
  un tema, una comunidad, un reto" (reemplaza el "no es una app de citas").
- Voz: verbs rotativos del login como base del tono (aprende, crea, conecta,
  transforma).
