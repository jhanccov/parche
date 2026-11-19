const COLORS = ['var(--gold)', 'var(--sun)', 'var(--navy2)', 'var(--white)', 'var(--navy-mist)'];

export const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

// El theme-color del navegador necesita un valor real: se lee de la paleta en styles.css.
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Mantiene el theme-color del navegador alineado con el fondo real
 *  (las páginas oscuras usan night, no navy) para evitar el flash. */
export function setThemeColor(mode: 'dark' | 'default') {
  if (typeof document === 'undefined') return;
  const color = cssVar(mode === 'dark' ? '--night' : '--navy');
  if (!color) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function burst(el?: Element | null) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const r = el?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('i');
    p.className = 'fx-bit';
    const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const d = 60 + Math.random() * 90;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    p.style.setProperty('--dy', `${Math.sin(a) * d - 40}px`);
    p.style.setProperty('--rot', `${Math.random() * 540}deg`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

export async function shareLink(title: string, path = '/') {
  const url = APP_URL + path;
  const text = `${title} en Parche, la app de estudiantes La Salle`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Parche', text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text}: ${url}`);
    return 'copied';
  } catch {
    return 'cancelled';
  }
}
