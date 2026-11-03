import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Map, Users, HandHelping, Mountain, Plus, Sparkles, Share2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { shareLink } from '../lib/fx';
import { Avatar } from './ui';

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
  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Parche, inicio">
          <span className="wordmark">parche<i aria-hidden>✦</i></span>
        </Link>
        <div className="topbar-right">
          <Link to="/impacto" className="pill gold topbar-impact" aria-label="Impacto de la red">
            <Sparkles size={14} /><span>Impacto</span>
          </Link>
          <button className="icon-btn gold" onClick={() => setOpen(true)} aria-label="Crear" aria-expanded={open}>
            <Plus size={20} />
          </button>
          <Link to="/perfil" className="pts" title="Tus puntos">✦ {me?.points ?? 0}</Link>
          <Link to="/perfil" aria-label="Tu perfil">
            <Avatar name={me?.name} size={36} />
          </Link>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>

      {open && <button className="sheet-backdrop" aria-label="Cerrar" onClick={() => setOpen(false)} />}
      <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-label="Crear" aria-hidden={!open}>
        <Link to="/mentoria/nueva" className="sheet-item s1"><span>🆘</span><div><strong>Pedir ayuda</strong><small>Le llega a quien sabe del tema</small></div></Link>
        <Link to="/comunidades/nueva" className="sheet-item s2"><span>🚀</span><div><strong>Crear comunidad</strong><small>Club, semillero o grupo de estudio</small></div></Link>
        <Link to="/retos" className="sheet-item s3"><span>🏔️</span><div><strong>Unirme a un reto</strong><small>Problemas reales del territorio</small></div></Link>
        <button className="sheet-item s4" onClick={() => shareLink('Únete a mi parche')}><span><Share2 size={22} /></span><div><strong>Invitar compañeros</strong><small>Comparte el enlace por WhatsApp</small></div></button>
      </div>

      <nav className="tabbar" aria-label="Navegación principal">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
