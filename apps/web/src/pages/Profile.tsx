import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, LogOut, Pencil, Trash2, BadgeCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar, Chip, Section, Stat } from '../components/ui';
import { ProfileForm } from './Onboarding';

export default function Profile() {
  const { me, signOut } = useAuth();
  const [edit, setEdit] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!me) return null;

  async function removeAccount() {
    await api('/me', { method: 'DELETE' });
    signOut();
  }
  return (
    <div className="page">
      <div className="profile-head card">
        <Avatar name={me.name} size={72} />
        <div>
          <Chip tone="gold"><BadgeCheck size={13} /> Estudiante verificado · {me.university}</Chip>
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

      <Section title="Tus datos">
        <p className="muted small">Puedes ver la <Link to="/privacidad">política de privacidad</Link> o eliminar tu cuenta. Al eliminarla se borran tu perfil, tus mensajes y tus solicitudes de ayuda; lo que publicaste en comunidades y retos queda sin autor.</p>
        {!confirmDel ? (
          <button className="btn ghost" onClick={() => setConfirmDel(true)}><Trash2 size={16} /> Eliminar mi cuenta</button>
        ) : (
          <div className="row gap wrap">
            <button className="btn danger" onClick={removeAccount}><Trash2 size={16} /> Sí, eliminar mis datos</button>
            <button className="btn ghost" onClick={() => setConfirmDel(false)}>Cancelar</button>
          </div>
        )}
      </Section>
    </div>
  );
}
