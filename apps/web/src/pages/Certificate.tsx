import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi';
import { Loading } from '../components/ui';

export default function Certificate() {
  const { data } = useApi<any>('/me/certificate');
  if (!data) return <Loading />;
  const u = data.user;
  return (
    <div className="certificate">
      <div className="no-print row gap">
        <Link to="/perfil" className="btn ghost">Volver</Link>
        <button className="btn gold" onClick={() => window.print()}>Imprimir o guardar PDF</button>
      </div>
      <div className="cert-sheet">
        <img src="/logo.png" alt="Parche" className="cert-logo" />
        <h1>Constancia de mentoría entre pares</h1>
        <p>Se deja constancia de que <strong>{u.name}</strong>, estudiante de {u.career} de {u.university} ({u.campus}),
          brindó <strong>{data.totalHours} horas</strong> de mentoría académica voluntaria a otros estudiantes de la red La Salle a través de Parche.</p>
        <table>
          <thead><tr><th>Fecha</th><th>Tema</th><th>Estudiante</th><th>Horas</th></tr></thead>
          <tbody>
            {data.sessions.map((s: any, i: number) => (
              <tr key={i}><td>{new Date(s.resolved_at).toLocaleDateString('es-CO')}</td><td>{s.topic}: {s.title}</td><td>{s.student} ({s.university})</td><td>{Number(s.hours)}</td></tr>
            ))}
            {data.sessions.length === 0 && <tr><td colSpan={4}>Aún no hay mentorías cerradas.</td></tr>}
          </tbody>
        </table>
        {data.teams.length > 0 && (
          <p>Además participa en los retos del territorio: {data.teams.map((t: any) => `${t.challenge} (${t.territory}, equipo ${t.team})`).join('; ')}.</p>
        )}
        <p className="muted small">Cada hora fue confirmada por el estudiante que recibió la ayuda. Emitida el {new Date(data.issuedAt).toLocaleDateString('es-CO')}. Puede validarse ante Bienestar Universitario o Responsabilidad Social.</p>
      </div>
    </div>
  );
}
