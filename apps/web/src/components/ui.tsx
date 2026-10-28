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
