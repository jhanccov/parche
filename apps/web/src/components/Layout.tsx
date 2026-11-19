import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Map, Users, HandHelping, Mountain, Plus, Sparkles, Share2, LifeBuoy, Rocket, Sparkle, ChevronRight, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { shareLink } from '../lib/fx';
import { Avatar } from './ui';
import Assistant from './Assistant';
import { prefetch } from '../lib/useApi';

const PREFETCH: Record<string, string[]> = {
  '/': ['/events', '/communities', '/help', '/challenges'],
  '/comunidades': ['/communities?'],
  '/mapa': ['/map'],
  '/mentoria': ['/help?scope=para-mi'],
  '/retos': ['/challenges'],
};

const TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/comunidades', label: 'Comunidades', icon: Users },
  { to: '/mapa', label: 'Mapa', icon: Map },
  { to: '/mentoria', label: 'Mentoría', icon: HandHelping },
  { to: '/retos', label: 'Retos', icon: Mountain },
];

export default function Layout() {
  const { me } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const first = me?.name?.split(' ')[0] ?? '';

  // Precarga de las pestañas: al tocarlas el contenido ya está, como en Instagram.
  useEffect(() => {
    const t = setTimeout(() => Object.values(PREFETCH).flat().forEach(prefetch), 600);
    return () => clearTimeout(t);
  }, []);

  // Barra superior que se esconde al bajar y vuelve al subir.
  const [hideTop, setHideTop] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) > 6) { setHideTop(y > last && y > 120); last = y; }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setHideTop(false), [loc.pathname]);

  return (
    <div className="shell">
      <header className={`topbar ${hideTop && !open ? 'hide' : ''}`}>
        <Link to="/" className="brand" aria-label="Parche, inicio">
          <span className="wordmark">parche<i aria-hidden><Sparkle size={16} fill="currentColor" strokeWidth={0} /></i></span>
        </Link>
        <div className="topbar-right">
          <Link to="/impacto" className="pill gold topbar-impact" aria-label="Impacto de la red">
            <Sparkles size={14} /><span>Impacto</span>
          </Link>
          <button className="icon-btn gold" onClick={() => setOpen(true)} aria-label="Crear" aria-expanded={open}>
            <Plus size={20} />
          </button>
          <Link to="/perfil" className="pts" title="Tus puntos"><Sparkle size={13} fill="currentColor" strokeWidth={0} aria-hidden /> {me?.points ?? 0}</Link>
          <Link to="/perfil" aria-label="Tu perfil">
            <Avatar name={me?.name} size={36} />
          </Link>
        </div>
      </header>
      <main className="content">
        <div className="page-anim" key={loc.pathname}>
          <Outlet />
        </div>
      </main>

      {open && <button className="sheet-backdrop" aria-label="Cerrar" onClick={() => setOpen(false)} />}
      <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-hidden={!open}>
        <span className="sheet-handle" aria-hidden />
        <div className="sheet-head">
          <span className="sheet-mascot" aria-hidden><img src="/img/mascota-juanita.webp" alt="" /></span>
          <div>
            <h2 id="sheet-title">¿Qué hacemos hoy{first ? `, ${first}` : ''}?</h2>
            <p>Juanita te acompaña. Elige por dónde empezar.</p>
          </div>
          <button className="sheet-close" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>

        <Link to="/mentoria/nueva" className="sheet-hero">
          <span className="sheet-ico hero"><LifeBuoy size={26} /></span>
          <span className="sheet-text">
            <span className="sheet-kicker">Lo más rápido</span>
            <strong>Pedir ayuda</strong>
            <small>Le llega a quien sabe del tema, en tu sede o en Colombia</small>
          </span>
          <span className="sheet-go" aria-hidden><ArrowRight size={20} /></span>
        </Link>

        <div className="sheet-list">
          <Link to="/comunidades/nueva" className="sheet-row">
            <span className="sheet-ico gold"><Rocket size={22} /></span>
            <span className="sheet-text"><strong>Crear comunidad</strong><small>Club, semillero o grupo de estudio</small></span>
            <ChevronRight size={20} className="sheet-chev" aria-hidden />
          </Link>
          <Link to="/retos" className="sheet-row">
            <span className="sheet-ico navy"><Mountain size={22} /></span>
            <span className="sheet-text"><strong>Unirme a un reto</strong><small>Problemas reales del territorio</small></span>
            <ChevronRight size={20} className="sheet-chev" aria-hidden />
          </Link>
          <button className="sheet-row" onClick={() => shareLink('Únete a mi parche')}>
            <span className="sheet-ico soft"><Share2 size={22} /></span>
            <span className="sheet-text"><strong>Invitar compañeros</strong><small>Comparte el enlace por WhatsApp</small></span>
            <ChevronRight size={20} className="sheet-chev" aria-hidden />
          </button>
        </div>
      </div>

      <Assistant />

      <nav className="tabbar" aria-label="Navegación principal">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')} onPointerEnter={() => PREFETCH[to]?.forEach(prefetch)} onTouchStart={() => PREFETCH[to]?.forEach(prefetch)}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
