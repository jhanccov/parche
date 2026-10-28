export const CATEGORIES: Record<string, { label: string; color: string }> = {
  tecnologia: { label: 'Tecnología', color: '#0B4A7E' },
  investigacion: { label: 'Investigación', color: '#6B4C9A' },
  territorio: { label: 'Territorio', color: '#2F7D5C' },
  cultura: { label: 'Cultura', color: '#B5482E' },
  deporte: { label: 'Deporte', color: '#B07A00' },
  bienestar: { label: 'Bienestar', color: '#1F7A8C' },
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
