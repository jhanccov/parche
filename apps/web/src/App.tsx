import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { useAuth } from './lib/auth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import CommunityNew from './pages/CommunityNew';
import Mentoring from './pages/Mentoring';
import HelpNew from './pages/HelpNew';
import HelpDetail from './pages/HelpDetail';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import Impact from './pages/Impact';
import Profile from './pages/Profile';
import Certificate from './pages/Certificate';

function Guard({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!me) return <Navigate to="/entrar" replace state={{ from: loc.pathname }} />;
  if (!me.name && loc.pathname !== '/bienvenida') return <Navigate to="/bienvenida" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<Login />} />
      <Route path="/bienvenida" element={<Guard><Onboarding /></Guard>} />
      <Route path="/constancia" element={<Guard><Certificate /></Guard>} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Home />} />
        <Route path="mapa" element={<MapPage />} />
        <Route path="comunidades" element={<Communities />} />
        <Route path="comunidades/nueva" element={<CommunityNew />} />
        <Route path="comunidades/:id" element={<CommunityDetail />} />
        <Route path="mentoria" element={<Mentoring />} />
        <Route path="mentoria/nueva" element={<HelpNew />} />
        <Route path="mentoria/:id" element={<HelpDetail />} />
        <Route path="retos" element={<Challenges />} />
        <Route path="retos/:id" element={<ChallengeDetail />} />
        <Route path="impacto" element={<Impact />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
