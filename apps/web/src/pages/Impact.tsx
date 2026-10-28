import { useApi } from '../lib/useApi';
import { flag } from '../lib/format';
import { Loading, Section, Stat } from '../components/ui';

export default function Impact() {
  const { data } = useApi<any>('/impact');
  if (!data) return <Loading />;
  const t = data.totals;
  const maxReq = Math.max(1, ...data.topics.map((x: any) => x.requests));
  const maxStu = Math.max(1, ...data.byUniversity.map((x: any) => x.students));
  return (
    <div className="page">
      <h1>Impacto de la red</h1>
      <p className="muted">Datos agregados y anónimos, en vivo. Sirven a Bienestar Universitario para ver qué funciona.</p>
      <div className="stats">
        <Stat value={t.students} label="estudiantes" />
        <Stat value={`${t.universities} · ${t.countries}`} label="universidades · países" tone="gold" />
        <Stat value={t.communities} label="comunidades" />
        <Stat value={t.mentoring_hours} label="horas de mentoría" tone="gold" />
        <Stat value={t.mentorships} label="mentorías cerradas" />
        <Stat value={t.avg_rating ?? '-'} label="satisfacción (1 a 5)" tone="gold" />
        <Stat value={t.challenges} label="retos del territorio" tone="green" />
        <Stat value={t.cross_university_teams} label="equipos interuniversitarios" tone="green" />
      </div>

      <Section title="Estudiantes por universidad">
        <div className="card bars">
          {data.byUniversity.map((u: any) => (
            <div key={u.university} className="bar-row">
              <span className="bar-label">{flag(u.country)} {u.university}</span>
              <span className="bar"><span style={{ width: `${(u.students / maxStu) * 100}%` }} /></span>
              <span className="bar-val">{u.students}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Temas donde más se pide ayuda">
        <div className="card bars">
          {data.topics.map((x: any) => (
            <div key={x.topic} className="bar-row">
              <span className="bar-label">{x.topic}</span>
              <span className="bar gold"><span style={{ width: `${(x.requests / maxReq) * 100}%` }} /></span>
              <span className="bar-val">{x.solved}/{x.requests}</span>
            </div>
          ))}
          <p className="muted small">Resueltas sobre solicitadas. Muestra a la universidad dónde reforzar tutorías.</p>
        </div>
      </Section>

      <Section title="Mentores que más aportan">
        <div className="list card">
          {data.topMentors.map((m: any, i: number) => (
            <div key={m.name} className="list-row"><strong className="rank">{i + 1}</strong><span>{m.name} <small className="muted">· {m.university}</small></span><span className="right">{m.hours} h</span></div>
          ))}
        </div>
      </Section>
    </div>
  );
}
