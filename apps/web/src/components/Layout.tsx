import { NavLink, Link, Outlet } from 'react-router-dom';
import { Home, Map, Users, HandHelping, Mountain, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Avatar } from './ui';

const TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/mapa', label: 'Mapa', icon: Map },
  { to: '/comunidades', label: 'Comunidades', icon: Users },
  { to: '/mentoria', label: 'Mentoría', icon: HandHelping },
  { to: '/retos', label: 'Retos', icon: Mountain },
];

export default function Layout() {
  const { me } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Parche, inicio">
          <img src="/logo.png" alt="Parche" />
        </Link>
        <div className="topbar-right">
          <Link to="/impacto" className="pill" title="Impacto de la red">
            <Sparkles size={14} /> Impacto
          </Link>
          <Link to="/perfil" className="pill gold" title="Tus puntos">
            ✦ {me?.points ?? 0}
          </Link>
          <Link to="/perfil" aria-label="Tu perfil">
            <Avatar name={me?.name} size={36} />
          </Link>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Navegación principal">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
