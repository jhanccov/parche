import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { ErrorMsg } from '../components/ui';

export default function HelpNew() {
  const nav = useNavigate();
  const skills = useApi<string[]>('/skills');
  const [f, setF] = useState({ topic: '', title: '', detail: '', mode: 'virtual' });
  const [err, setErr] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api<{ id: string }>('/help', { body: f });
      nav(`/mentoria/${r.id}`);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Pedir ayuda</h1>
      <p className="muted">Tu solicitud llega primero a quienes dicen que saben del tema, en cualquier universidad de la red.</p>
      <form className="form card" onSubmit={save}>
        <label>Tema
          <select required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
            <option value="">Elige un tema</option>
            {skills.data?.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>¿Qué necesitas?<input required minLength={5} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ej. No entiendo integrales por partes" /></label>
        <label>Detalle<textarea maxLength={600} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} placeholder="Cuéntale a tu mentor por dónde vas" /></label>
        <label>Modalidad
          <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
            <option value="virtual">Virtual (cualquier sede o país)</option>
            <option value="presencial">Presencial en mi sede</option>
          </select>
        </label>
        <ErrorMsg msg={err} />
        <button className="btn gold block">Publicar solicitud</button>
      </form>
    </div>
  );
}
