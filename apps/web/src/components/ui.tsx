import { ReactNode } from 'react';
import { CATEGORIES, colorFor, initials } from '../lib/format';

export function Avatar({ name, size = 40 }: { name?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Chip({ children, tone = 'plain', color }: { children: ReactNode; tone?: 'plain' | 'gold' | 'navy' | 'soft'; color?: string }) {
  return (
    <span className={`chip chip-${tone}`} style={color ? { background: color + '1A', color, borderColor: color + '40' } : undefined}>
      {children}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const c = CATEGORIES[category];
  return <Chip color={c?.color}>{c?.label ?? category}</Chip>;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${Math.max(4, value)}%` }} />
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Loading() {
  return <div className="loading">Cargando...</div>;
}

export function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="error" role="alert">{msg}</div>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label, tone = 'navy' }: { value: ReactNode; label: string; tone?: 'navy' | 'gold' | 'green' }) {
  return (
    <div className={`stat stat-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function SkillPicker({ options, value, onChange, max = 8 }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="picker">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            className={`pick ${on ? 'on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : value.length < max ? [...value, o] : value)}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// Banderas en SVG: los emojis de bandera no se ven en Windows (salen como letras "CO" y "PE").
export function Flag({ country, size = 18 }: { country?: string | null; size?: number }) {
  const h = Math.round((size * 2) / 3);
  if (country === 'Colombia') {
    return (
      <svg className="flag" width={size} height={h} viewBox="0 0 3 2" role="img" aria-label="Bandera de Colombia">
        <rect width="3" height="1" fill="#FCD116" />
        <rect y="1" width="3" height="0.5" fill="#003893" />
        <rect y="1.5" width="3" height="0.5" fill="#CE1126" />
      </svg>
    );
  }
  if (country === 'Perú') {
    return (
      <svg className="flag" width={size} height={h} viewBox="0 0 3 2" role="img" aria-label="Bandera del Perú">
        <rect width="3" height="2" fill="#FFFFFF" />
        <rect width="1" height="2" fill="#D91023" />
        <rect x="2" width="1" height="2" fill="#D91023" />
      </svg>
    );
  }
  return null;
}
