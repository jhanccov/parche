import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, LogOut, Pencil } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Avatar, Chip, Section, Stat } from '../components/ui';
import { ProfileForm } from './Onboarding';

export default function Profile() {
  const { me, signOut } = useAuth();
  const [edit, setEdit] = useState(false);
  if (!me) return null;
  return (
    <div className="page">
      <div className="profile-head card">
        <Avatar name={me.name} size={72} />
        <div>
          <Chip tone="gold">✦ Estudiante verificado · {me.university}</Chip>
          <h1 className="h2">{me.name}</h1>
          <p className="muted">{me.career} · semestre {me.semester} · {me.campus}</p>
          {me.bio && <p>{me.bio}</p>}
        </div>
      </div>

      <div className="stats">
        <Stat value={me.points} label="puntos de colaboración" tone="gold" />
        <Stat value={me.badges.length} label="insignias" />
      </div>

      <Section title="Insignias">
        {me.badges.length ? (
          <div className="badges">
            {me.badges.map((b) => (
              <div key={b.id} className="badge"><Award size={22} /><strong>{b.nombre}</strong><small>{b.descripcion}</small></div>
            ))}
          </div>
        ) : <p className="muted">Ayuda en una mentoría, crea una comunidad o súmate a un reto para ganar tu primera insignia.</p>}
      </Section>

      <Section title="Puedo ayudar en"><div className="picker">{me.skills.map((s) => <Chip key={s} tone="navy">{s}</Chip>)}</div></Section>
      <Section title="Quiero aprender"><div className="picker">{me.interests.map((s) => <Chip key={s} tone="soft">{s}</Chip>)}</div></Section>

      <div className="row gap wrap">
        <Link to="/constancia" className="btn navy"><FileText size={16} /> Constancia de mentoría</Link>
        <button className="btn ghost" onClick={() => setEdit(!edit)}><Pencil size={16} /> Editar perfil</button>
        <button className="btn ghost" onClick={signOut}><LogOut size={16} /> Salir</button>
      </div>

      {edit && <div className="card"><ProfileForm onDone={() => setEdit(false)} submitLabel="Guardar cambios" /></div>}
    </div>
  );
}
