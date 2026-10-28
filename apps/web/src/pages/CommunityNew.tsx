import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/format';
import { ErrorMsg } from '../components/ui';

export default function CommunityNew() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [f, setF] = useState({ name: '', category: 'tecnologia', description: '', scope: 'red', goal_members: 18 });
  const [err, setErr] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api<{ id: string }>('/communities', { body: f });
      await refresh();
      nav(`/comunidades/${r.id}`);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Crea tu comunidad</h1>
      <p className="muted">Parche te acompaña en 4 pasos: propósito, equipo núcleo, primer evento y meta de miembros. Ganas 20 puntos al crearla.</p>
      <form className="form card" onSubmit={save}>
        <label>Nombre<input required minLength={3} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ej. Comunidad de Ciberseguridad La Salle" /></label>
        <label>Categoría
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label>Propósito<textarea required minLength={20} maxLength={600} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Qué harán juntos y para quién es" /></label>
        <label>Alcance
          <select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
            <option value="red">Toda la red La Salle (Colombia y Perú)</option>
            <option value="campus">Solo mi sede</option>
          </select>
        </label>
        <label>Meta de miembros para activarla<input type="number" min={5} max={200} value={f.goal_members} onChange={(e) => setF({ ...f, goal_members: Number(e.target.value) })} /></label>
        <ErrorMsg msg={err} />
        <button className="btn gold block">Crear comunidad</button>
      </form>
    </div>
  );
}
