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

Desde noviembre de 2026 la paleta toma la identidad de la Universidad de La Salle (Bogotá, Colombia): azul índigo `#2B3682`, azul noche `#1E2344` y dorado `#F49C18`, medidos sobre su pieza oficial con la mascota Juanita. Las banderas del Perú y de Colombia se dibujan en SVG con sus colores oficiales (Colombia: amarillo `#FCD116`, azul `#003893`, rojo `#CE1126`; Perú: rojo `#D91023` y blanco), porque los emojis de bandera no se ven en Windows.

| Token | Valor | Uso |
| --- | --- | --- |
| `--navy` | `#2B3682` | Superficies principales, texto sobre claro |
| `--navy2` | `#3D4BA8` | Variantes, iconos secundarios |
| `--night` | `#1E2344` | Fondo oscuro (home, topbar, tabbar) |
| `--gold` / `--sun` | `#F49C18` / `#FFB21E` | Solo sobre superficies oscuras |
| `--gold-ink` | `#8A5F00` | Texto e iconos ámbar sobre fondos claros (AA) |
| `--gold-soft` | `#FDEFD6` | Fondos de aviso |
| `--green` | `#2F7D5C` | Territorio, rural |
| `--bg` / `--card` | `#FBF7EE` / `#FFFFFF` | Fondo claro / tarjetas |
| `--danger` | `#B5482E` | Errores |

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
