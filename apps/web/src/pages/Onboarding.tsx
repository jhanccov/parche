import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { ErrorMsg, SkillPicker } from '../components/ui';

type Uni = { id: string; short_name: string; country: string; campuses: { id: string; name: string; city: string }[] };

export function ProfileForm({ onDone, submitLabel }: { onDone: () => void; submitLabel: string }) {
  const { me, refresh } = useAuth();
  const unis = useApi<Uni[]>('/universities');
  const skills = useApi<string[]>('/skills');
  const [f, setF] = useState({ name: '', campus_id: '', career: '', semester: 1, bio: '', skills: [] as string[], interests: [] as string[] });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me) setF({ name: me.name ?? '', campus_id: me.campus_id ?? '', career: me.career ?? '', semester: me.semester ?? 1, bio: me.bio ?? '', skills: me.skills ?? [], interests: me.interests ?? [] });
  }, [me]);

  const uni = unis.data?.find((u) => u.id === me?.university_id);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api('/me', { method: 'PUT', body: f });
      await refresh();
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={save}>
      <label>Nombre y apellido<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label>Sede ({uni?.short_name}, {uni?.country})
        <select required value={f.campus_id} onChange={(e) => setF({ ...f, campus_id: e.target.value })}>
          <option value="">Elige tu sede</option>
          {uni?.campuses.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}
        </select>
      </label>
      <div className="row2">
        <label>Carrera<input required value={f.career} onChange={(e) => setF({ ...f, career: e.target.value })} /></label>
        <label>Semestre<input type="number" min={1} max={12} required value={f.semester} onChange={(e) => setF({ ...f, semester: Number(e.target.value) })} /></label>
      </div>
      <label>Bio corta<input maxLength={160} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Qué te mueve, en una línea" /></label>
      <fieldset>
        <legend>Puedo ayudar en <small>(así te llegan solicitudes de mentoría)</small></legend>
        <SkillPicker options={skills.data ?? []} value={f.skills} onChange={(v) => setF({ ...f, skills: v })} />
      </fieldset>
      <fieldset>
        <legend>Quiero aprender</legend>
        <SkillPicker options={skills.data ?? []} value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
      </fieldset>
      <ErrorMsg msg={err} />
      <button className="btn gold block" disabled={busy}>{busy ? 'Guardando...' : submitLabel}</button>
    </form>
  );
}

export default function Onboarding() {
  const nav = useNavigate();
  return (
    <div className="page narrow">
      <img src="/logo.png" alt="Parche" className="login-logo" />
      <h1>Arma tu perfil</h1>
      <p className="muted">Tu perfil muestra lo que sabes y lo que quieres aprender, no fotos. Así conectamos por propósito.</p>
      <ProfileForm onDone={() => nav('/')} submitLabel="Empezar" />
    </div>
  );
}
