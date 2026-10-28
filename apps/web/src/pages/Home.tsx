import { Link } from 'react-router-dom';
import { CalendarDays, HandHelping, Mountain, Plus, Users, MapPin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { flag, when } from '../lib/format';
import { Chip, Empty, Section } from '../components/ui';
import { HelpCard } from './Mentoring';
import { ChallengeCard } from './Challenges';

export default function Home() {
  const { me } = useAuth();
  const help = useApi<any[]>('/help?scope=para-mi');
  const events = useApi<any[]>('/events');
  const challenges = useApi<any[]>('/challenges');
  const act = useApi<any>('/me/activity');

  return (
    <div className="page">
      <div className="hello">
        <h1>Hola, {me?.name?.split(' ')[0]}</h1>
        <p className="muted">{me?.campus} · {me?.university}</p>
      </div>

      <div className="quick">
        <Link to="/mentoria/nueva" className="quick-btn navy"><HandHelping size={22} /><span>Pedir ayuda</span></Link>
        <Link to="/comunidades/nueva" className="quick-btn gold"><Plus size={22} /><span>Crear comunidad</span></Link>
        <Link to="/retos" className="quick-btn green"><Mountain size={22} /><span>Retos reales</span></Link>
      </div>

      <Section title="Puedes ayudar" action={<Link to="/mentoria" className="link">Ver todo</Link>}>
        {help.data?.length ? (
          help.data.slice(0, 3).map((h) => <HelpCard key={h.id} h={h} />)
        ) : (
          <Empty title="Nada pendiente en tus temas">Agrega más temas en los que puedes ayudar desde tu perfil.</Empty>
        )}
      </Section>

      <Section title="Próximos eventos">
        <div className="hscroll">
          {events.data?.slice(0, 6).map((e) => (
            <Link to={e.community_id ? `/comunidades/${e.community_id}` : '/'} key={e.id} className="card event-card">
              <span className="event-date"><CalendarDays size={14} /> {when(e.starts_at)}</span>
              <strong>{e.title}</strong>
              <span className="muted small">{e.community}</span>
              <span className="muted small"><MapPin size={12} /> {e.place || 'Por definir'}</span>
              <Chip tone="soft">{e.going} van</Chip>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Retos del territorio" action={<Link to="/retos" className="link">Ver todos</Link>}>
        {challenges.data?.slice(0, 2).map((c) => <ChallengeCard key={c.id} c={c} />)}
      </Section>

      <Section title="Tus comunidades" action={<Link to="/comunidades" className="link">Explorar</Link>}>
        {act.data?.communities?.length ? (
          <div className="list">
            {act.data.communities.map((c: any) => (
              <Link key={c.id} to={`/comunidades/${c.id}`} className="list-row">
                <Users size={18} /> <span>{c.name}</span> <Chip tone="soft">{c.role}</Chip>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="Aún no estás en ninguna">Únete a una comunidad o crea la tuya {flag(me?.university === 'ULASALLE' ? 'Perú' : 'Colombia')}</Empty>
        )}
      </Section>
    </div>
  );
}
