const COLORS = ['#FFB800', '#18C6B3', '#FF4D8D', '#FFFFFF', '#5AA9FF'];

export const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

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
