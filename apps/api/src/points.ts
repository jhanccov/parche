import { one, q } from './db.js';

export const PUNTOS = {
  crear_comunidad: 20,
  unirse_comunidad: 2,
  crear_evento: 5,
  mentoria_por_hora: 10,
  ayuda_resuelta: 2,
  unirse_equipo: 5,
  avance_equipo: 3,
  crear_equipo: 8,
} as const;

export type Motivo = keyof typeof PUNTOS;

export async function award(userId: string, reason: Motivo, refId?: string, points?: number) {
  const p = points ?? PUNTOS[reason];
  await q('insert into points_log (user_id, points, reason, ref_id) values ($1, $2, $3, $4)', [userId, p, reason, refId ?? null]);
}

export async function totalPoints(userId: string): Promise<number> {
  const r = await one<{ total: number }>('select coalesce(sum(points), 0)::int as total from points_log where user_id = $1', [userId]);
  return r?.total ?? 0;
}

export type Insignia = { id: string; nombre: string; descripcion: string };

export async function badges(userId: string): Promise<Insignia[]> {
  const s = await one<any>(
    `select
      (select count(*) from help_requests where mentor_id = $1 and status = 'resuelta')::int as mentorias,
      (select coalesce(sum(hours), 0) from help_requests where mentor_id = $1 and status = 'resuelta')::float as horas,
      (select count(*) from community_members where user_id = $1 and role = 'fundador')::int as fundador,
      (select count(*) from team_members where user_id = $1)::int as equipos,
      (select count(*) from team_members tm
         join team_members otro on otro.team_id = tm.team_id and otro.user_id <> tm.user_id
         join users u1 on u1.id = tm.user_id
         join users u2 on u2.id = otro.user_id
        where tm.user_id = $1 and u1.university_id <> u2.university_id)::int as puentes,
      (select count(*) from community_members where user_id = $1)::int as comunidades`,
    [userId],
  );
  const out: Insignia[] = [];
  if (s.mentorias >= 1) out.push({ id: 'mentor', nombre: 'Mentor', descripcion: `${s.mentorias} mentoría(s), ${s.horas} h de apoyo a otros estudiantes` });
  if (s.horas >= 10) out.push({ id: 'mentor-oro', nombre: 'Mentor de oro', descripcion: 'Más de 10 horas de mentoría' });
  if (s.fundador >= 1) out.push({ id: 'fundador', nombre: 'Fundador', descripcion: 'Creó una comunidad estudiantil' });
  if (s.equipos >= 1) out.push({ id: 'territorio', nombre: 'Agente de territorio', descripcion: 'Trabaja en un reto real de una comunidad' });
  if (s.puentes >= 1) out.push({ id: 'puente', nombre: 'Puente La Salle', descripcion: 'Colabora con estudiantes de otra universidad' });
  if (s.comunidades >= 3) out.push({ id: 'conector', nombre: 'Conector', descripcion: 'Participa en 3 o más comunidades' });
  return out;
}
