export const CATEGORIES: Record<string, { label: string; color: string; emoji: string; grad: string }> = {
  tecnologia: { label: 'Tecnología', color: '#0B4A7E', emoji: '💻', grad: 'linear-gradient(155deg,#1E5BFF 0%,#0B2A6B 60%,#06162B 100%)' },
  investigacion: { label: 'Investigación', color: '#6B4C9A', emoji: '🔬', grad: 'linear-gradient(155deg,#8B5CF6 0%,#3B1D7A 60%,#140B2E 100%)' },
  territorio: { label: 'Territorio', color: '#2F7D5C', emoji: '🌄', grad: 'linear-gradient(155deg,#12C28A 0%,#0B5E47 60%,#062B22 100%)' },
  cultura: { label: 'Cultura', color: '#B5482E', emoji: '🎭', grad: 'linear-gradient(155deg,#FF4D8D 0%,#8E1E52 60%,#2E0A1C 100%)' },
  deporte: { label: 'Deporte', color: '#B07A00', emoji: '⚽', grad: 'linear-gradient(155deg,#FFB800 0%,#B85C00 60%,#3A1A00 100%)' },
  bienestar: { label: 'Bienestar', color: '#1F7A8C', emoji: '🌱', grad: 'linear-gradient(155deg,#18C6B3 0%,#0B6070 60%,#062A30 100%)' },
};

export const ODS: Record<number, string> = {
  1: 'Fin de la pobreza', 2: 'Hambre cero', 3: 'Salud y bienestar', 4: 'Educación de calidad', 5: 'Igualdad de género',
  6: 'Agua limpia', 7: 'Energía asequible', 8: 'Trabajo decente', 9: 'Industria e innovación', 10: 'Reducción de desigualdades',
  11: 'Ciudades sostenibles', 12: 'Consumo responsable', 13: 'Acción por el clima', 14: 'Vida submarina', 15: 'Vida de ecosistemas',
  16: 'Paz y justicia', 17: 'Alianzas',
};

export function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  if (m < 1440) return `hace ${Math.floor(m / 60)} h`;
  return `hace ${Math.floor(m / 1440)} d`;
}

export function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

const PALETTE = ['#033259', '#0B4A7E', '#2F7D5C', '#6B4C9A', '#B5482E', '#1F7A8C', '#B07A00'];
export function colorFor(s?: string | null) {
  let h = 0;
  for (const ch of s ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const flag = (country?: string | null) => (country === 'Perú' ? '🇵🇪' : country === 'Colombia' ? '🇨🇴' : '');
