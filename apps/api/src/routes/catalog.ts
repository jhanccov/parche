import { FastifyInstance } from 'fastify';
import { q } from '../db.js';

export const SKILLS = [
  'Cálculo', 'Álgebra lineal', 'Física', 'Química', 'Estadística', 'Programación', 'Python', 'Java', 'C++',
  'Bases de datos', 'Desarrollo web', 'Apps móviles', 'Cloud (AWS)', 'Inteligencia artificial', 'Ciencia de datos',
  'IoT y sensores', 'Diseño UX', 'Redacción académica', 'Inglés', 'Economía', 'Agronomía', 'Gestión de proyectos',
  'Emprendimiento', 'Robótica', 'Ciberseguridad',
];

export default async function catalogRoutes(app: FastifyInstance) {
  app.get('/universities', async () => {
    const unis = await q('select id, name, short_name, country from universities order by country, name');
    const campuses = await q('select id, university_id, name, city, country, lat, lng, rural from campuses order by name');
    return unis.map((u: any) => ({ ...u, campuses: campuses.filter((c: any) => c.university_id === u.id) }));
  });

  app.get('/skills', async () => SKILLS);
}
