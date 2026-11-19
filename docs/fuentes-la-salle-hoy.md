# Fuentes de "La Salle hoy"

"La Salle hoy" usa solo contenido oficial de la red La Salle. Arequipa va primero, luego Colombia, luego México y al final el resto de la red. La app muestra el titular y un resumen corto, y siempre enlaza a la publicación original.

## Orden de prioridad

| Región | Peso en el orden | Pestaña |
|---|---|---|
| Arequipa | 20 | Arequipa |
| Colombia | 16 | Colombia |
| México | 12 | México |
| Mundo | 0 | Red La Salle |

Al peso de la región se suman puntos si la nota coincide con los temas del estudiante (4), si está en español (3) y si tiene foto (1). Se resta un punto por cada día de antigüedad, hasta un máximo de 14. Así una nota de Arequipa de hace un mes sigue apareciendo antes que una de otra parte del mundo publicada hoy.

Código: `apps/api/src/news/sources.ts` (fuentes y pesos) y `apps/api/src/news/fetcher.ts` (descarga y orden).

## Sitios web oficiales (noticias)

El servidor las descarga cada 45 minutos. Para los sitios hechos en WordPress prueba primero su API y luego su RSS. Una fuente marcada como opcional que no responde no se muestra ni se menciona en los créditos.

| Fuente | Región | Dirección | Tipo | Opcional |
|---|---|---|---|---|
| Universidad La Salle (Arequipa) | Arequipa | https://www.ulasalle.edu.pe | WordPress | Sí |
| Universidad de La Salle (Bogotá) | Colombia | https://www.lasalle.edu.co/rss.xml | RSS | Sí |
| Universidad La Salle México | México | https://lasalle.mx y https://academia.lasalle.mx | WordPress | Sí |
| La Salle (lasalle.org) | Mundo | https://www.lasalle.org y https://www.lasalle.org/en | WordPress | No |
| La Salle University (Filadelfia) | Mundo | https://www.lasalle.edu | WordPress | Sí |
| De La Salle University (Manila) | Mundo | https://www.dlsu.edu.ph | WordPress | Sí |
| La Salle Campus Barcelona | Mundo | https://www.salleurl.edu/es/rss.xml | RSS | Sí |

Si ninguna fuente responde, se muestran 8 destacados con enlaces reales a lasalle.org, Unisalle, La Salle Campus Barcelona, IALU y otras universidades La Salle (`apps/api/src/news/featured.ts`). Así la sección nunca queda vacía.

Estado de cada fuente en vivo: `GET /api/news/status` (público).

## Redes oficiales

Facebook e Instagram no dejan leer publicaciones desde otra app sin una cuenta de empresa vinculada y la revisión de Meta. Por eso Parche hace dos cosas:

1. Para páginas públicas de Facebook usa el plugin oficial de página de Facebook (`facebook.com/plugins/page.php` con `tabs=timeline`, ancho de 180 a 500 px). El recuadro solo se carga cuando el estudiante lo toca, porque en ese momento su navegador se conecta con Facebook, que puede usar sus propias cookies.
2. Las demás redes son enlaces que se abren fuera de Parche.

| Región | Red | Cuenta | Enlace | En la app | De dónde sale |
|---|---|---|---|---|---|
| Arequipa | Facebook | Universidad La Salle | https://www.facebook.com/ulasalle | Recuadro de Facebook | Página oficial indicada por el equipo |
| Arequipa | Instagram | ulasalleperu | https://www.instagram.com/ulasalleperu | Enlace | Página oficial de Facebook de ULASALLE |
| Arequipa | Sitio web | ulasalle.edu.pe | https://www.ulasalle.edu.pe | Enlace | Sitio oficial |
| Colombia | Facebook | Egresados Unisalle | https://www.facebook.com/AlumniUnisalle | Recuadro de Facebook | Guía de servicios VPDH 2026 de Unisalle |
| Colombia | Instagram | unisallecol | https://www.instagram.com/unisallecol | Enlace | Guía de servicios VPDH 2026 de Unisalle |
| Colombia | X | @Unisalle | https://x.com/Unisalle | Enlace | Guía de servicios VPDH 2026 de Unisalle |
| Colombia | Instagram | alumniunisalle | https://www.instagram.com/alumniunisalle | Enlace | Guía de servicios VPDH 2026 de Unisalle |
| Colombia | Sitio web | lasalle.edu.co | https://www.lasalle.edu.co | Enlace | Sitio oficial |
| México | Sitio web | lasalle.mx | https://lasalle.mx | Enlace | Sitio oficial |
| Mundo | Sitio web | lasalle.org | https://www.lasalle.org | Enlace | Sitio oficial del Instituto |

Endpoint: `GET /api/news/socials` (requiere sesión). Código: `apps/api/src/news/socials.ts` y `apps/web/src/components/SocialWall.tsx`.

### Pendientes por confirmar

- La Salle México: su cuenta de X se presenta como la cuenta oficial de La Salle México y su Instagram se llama "Universidad La Salle MX", pero no se confirmó el usuario exacto de ninguno. No se agregaron para no enlazar cuentas equivocadas.
- YouTube de ULASALLE: el canal existe (668 suscriptores, 42 videos), pero falta su ID (empieza con `UC`) para mostrar sus videos.
- Página principal de Facebook de Unisalle: no se confirmó la dirección exacta. Por ahora el recuadro de Colombia usa la página de egresados.

## Agregar fuentes sin tocar el código

En Render, en Environment del servicio:

| Variable | Formato | Ejemplo |
|---|---|---|
| `NEWS_SOCIAL_PAGES` | `region\|red\|Nombre\|https://url` | `mexico\|facebook\|La Salle México\|https://www.facebook.com/pagina` |
| `NEWS_YOUTUBE_CHANNELS` | `Nombre\|UC...\|region` | `ULASALLE\|UCxxxxxxxxxxxxxxxxxxxxxx\|arequipa` |
| `NEWS_EXTRA_FEEDS` | `Nombre\|https://feed\|region` | `La Salle Cuernavaca\|https://sitio/feed/\|mexico` |

Separa varias entradas con `;`. Las regiones válidas son `arequipa`, `colombia`, `mexico` y `mundo` (si no pones región, cuenta como `mundo`). Las redes válidas son `facebook`, `instagram`, `tiktok`, `youtube`, `x`, `linkedin` y `web`.

El servidor descarta entradas con región o red desconocida, con enlaces que no sean `https`, y entradas de Facebook que no apunten a `facebook.com`. Después de cambiar una variable hay que guardar; Render vuelve a desplegar solo.

## Privacidad

- El servidor descarga las noticias sin enviar ningún dato del estudiante.
- Para ordenar "Para ti" solo se usan, dentro de Parche, los temas que el estudiante marcó en su perfil.
- Nadie se conecta con Facebook sin decidirlo: el recuadro se carga solo con un toque.
- Parche no lee ni guarda datos de Facebook, Instagram, TikTok ni X.

Más detalle en `docs/privacidad-y-seguridad.md` y en la página `/privacidad` de la app.

## Pruebas

En `apps/api/test/api.test.ts`:

- Solo se consultan sitios de la red La Salle; si una ruta falla se prueba la siguiente; los enlaces inseguros se descartan; si todo falla aparecen los destacados.
- Arequipa va primero aunque su nota sea más antigua, el filtro por región funciona y se rechaza una región inválida.
- `/api/news/socials` empieza por Arequipa e incluye el Facebook de ULASALLE con recuadro y su Instagram como enlace.
- `NEWS_SOCIAL_PAGES` descarta entradas inválidas.

## Fuentes consultadas para identificar las cuentas

- Universidad de La Salle, "Servicios VPDH 2026" (PDF): https://cmspreprod.lasalle.edu.co/sites/default/files/2026-02/Servicios%20VPDH%202026..pdf
- uniRank, X de Universidad La Salle México: https://www.unirank.org/mx/uni/universidad-la-salle/x/
- uniRank, Instagram de Universidad La Salle México: https://www.unirank.org/mx/uni/universidad-la-salle/instagram/
- uniRank, YouTube de Universidad La Salle (Perú): https://www.unirank.org/pe/uni/universidad-la-salle-peru/youtube/
- Meta for Developers, Page Plugin: https://developers.facebook.com/docs/plugins/page-plugin
