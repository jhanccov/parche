# Marca Parche

## Nombre y descriptor

- Nombre: **parche** (minúscula en wordmark). Doble sentido: arreglo + grupo
  de amigos (parche colombiano).
- Descriptor obligatorio: **Parche · Comunidades La Salle**.
- Tagline: **Aprende, crea y transforma con tu red La Salle**.

## Logo

- Wordmark: Nunito ExtraBold, azul La Salle `#2B3682`, con spark ámbar montado sobre
  la "e". Fuente de verdad: `logo/render_logo.py` (`logo-parche*.png`).
- Isotipo: spark ámbar sobre rounded-square navy, con aire para recorte
  maskable. Fuente de verdad: `render_icon()` en el mismo script.
  Es lo único que va en `icon-192.png` / `icon-512.png` (el wordmark es
  ilegible a tamaño de icono).
- No estirar, no cambiar colores, no poner el wordmark sobre foto sin
  overlay oscuro.

## Colores

La paleta vive en un solo lugar: el bloque `:root` de `apps/web/src/styles.css`. Fuera de ese bloque no se escribe ningún color en hexadecimal ni rgba, ni en CSS ni en TypeScript; todo usa `var(--...)` o una mezcla con `color-mix()` de esas mismas variables. La identidad es la de la Universidad de La Salle (Bogotá, Colombia), medida sobre su pieza oficial con la mascota Juanita.

| Variable | Valor | Uso |
| --- | --- | --- |
| `--navy` | `#2B3682` | Azul índigo La Salle: superficies, botones, texto sobre claro |
| `--navy2` | `#3D4BA8` | Azul índigo claro: variantes e iconos |
| `--night` | `#1E2344` | Azul noche La Salle: fondo oscuro, barras de navegación |
| `--gold` | `#F49C18` | Dorado La Salle: acciones principales, puntos |
| `--sun` | `#FFB21E` | Dorado claro, solo sobre fondos oscuros |
| `--gold-ink` | `#8A5F00` | Dorado oscuro para texto sobre claro (contraste AA) |
| `--white` / `--bg` | `#FFFFFF` / `#FBF7EE` | Tarjetas / fondo claro |
| `--line` | `#E8E1CF` | Bordes y separadores |
| `--ink` / `--muted` | `#1B2433` / `#5F6B7A` | Texto principal / secundario |
| `--danger` | `#B42318` | Solo errores y eliminar cuenta |

Derivados (mezclas de la paleta, no colores nuevos): `--gold-soft`, `--navy-soft`, `--navy-mist`, `--on-dark-muted`, `--danger-soft`, `--surface` y todas las transparencias, que se escriben como `color-mix(in srgb, var(--night) 55%, transparent)`.

Las banderas usan sus colores oficiales (`--flag-co-yellow`, `--flag-co-blue`, `--flag-co-red`, `--flag-pe-red`) y solo dentro del componente `Flag`. Son SVG porque los emojis de bandera no se ven en Windows.

Excepciones que no pueden leer variables CSS: `theme_color` del manifiesto y la etiqueta `theme-color` de `index.html` llevan el valor de `--navy` escrito; en tiempo de ejecución `setThemeColor` lo lee de la paleta. El logo y los íconos PNG se generan con `logo/render_logo.py` usando los mismos valores.

## Tipografía

- Display: Nunito ExtraBold (800), tracking −0.5 a −1px en titulares.
- Cuerpo: system-ui. Jerarquía: h1 26–40px / h2 20–22px / cuerpo 15px /
  small 12–13px.

## Fotografía

- Feed e historias: fotos reales (ver `docs/creditos-imagenes.md`), siempre
  con overlay oscuro inferior para lectura. Si la foto falla, fondo navy.
- Emojis solo en contenido de usuarios; la UI usa Lucide.
- Mapa: markers de color por capa (no fotos a ese tamaño).

## Voz

- Afirmativa, no defensiva: "Cada conexión nace de un propósito: un tema,
  una comunidad, un reto".
- Verbos: aprende, crea, conecta, transforma.
