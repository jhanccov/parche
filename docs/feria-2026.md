# Parche en la Feria Concurso de Proyectos Digitales 2026

Feria "Apps que transforman mi comunidad", Escuela Profesional de Ingeniería de Software, Universidad La Salle. Jueves 19 de noviembre de 2026, auditorio Benito. Categoría A (1.° a 3.° año).

## Ficha

- Proyecto: Parche, comunidades que conectan La Salle, del campus al territorio.
- Integrantes: José Luis Hancco Valencia y Roger Infa Sanchez.
- Eje temático: Educación y alfabetización digital (ODS 4), con retos del territorio ligados a los ODS 6, 8 y 11.
- Comunidad beneficiaria: estudiantes de ULASALLE Arequipa y de las universidades La Salle de Colombia (Unisalle, Unilasallista); en los retos, comunidades rurales como el Valle del Colca.
- App: https://parche-bokw.onrender.com
- Repositorio: https://github.com/jhanccov/parche

## Criterio 1. Pertinencia e impacto en la comunidad

- Problema: muchos estudiantes se traban en un curso y no tienen a quién preguntar fuera de su salón; las comunidades estudiantiles nacen y mueren rápido. La deserción anual ronda el 9 % en Colombia y el 11,5 % en Perú (fuentes en `propuesta-de-valor.md`).
- Evidencia de campo: en la Misión Académica Colombia 2026 (25 al 31 de octubre) el equipo conoció el grupo de estudio AWS de la sede Candelaria, que se sostiene con mentoría entre pares. Parche toma ese modelo y lo vuelve una ruta guiada para cualquier sede.
- Impacto medible: el tablero `/impacto` calcula en vivo estudiantes por universidad, horas de mentoría confirmadas, satisfacción (1 a 5) y equipos interuniversitarios. Metas del piloto en `impacto-y-metricas.md`.
- Validación con usuarios: en la feria, pedir a los visitantes que entren con su correo @ulasalle.edu.pe por el QR y mostrar cómo sube el tablero de impacto. Anotar cuántos entraron y qué les pareció para el resumen.

## Criterio 2. Calidad técnica del software

- Monorepo con API (Node 22, TypeScript, Fastify 5, PostgreSQL 16, Zod, JWT) y web (React 18, Vite, PWA con Workbox, Leaflet).
- Validación de entradas con Zod, límite de intentos por correo, códigos de un solo uso con vencimiento y hash, SQL parametrizado.
- 12 pruebas de integración: acceso solo con correo La Salle, consentimiento obligatorio, código incorrecto, comunidades, mentoría con horas, retos interuniversitarios, impacto, privacidad del mapa, límite por correo y eliminación de cuenta.
- Despliegue con Docker en Render (una sola imagen, la API sirve la web).
- Historial de commits de ambos integrantes.

## Criterio 3. Funcionalidad y experiencia de usuario

Flujo completo demostrable: entrar con correo institucional y código, armar el perfil por saberes, unirse o crear una comunidad, pedir ayuda y que llegue a quien sabe, cerrar la mentoría con horas, sumarse a un reto y ver la constancia. Interfaz móvil e instalable, que respeta la opción de "reducir movimiento" del sistema.

## Criterio 4. Innovación y creatividad

- Perfil por lo que sabes y lo que quieres aprender, sin fotos ni deslizar perfiles: no es una red social de apariencias.
- Une tres cosas que hoy están separadas: comunidades con ruta de formación, mentoría con constancia verificable y retos reales de territorios rurales.
- Interuniversitario e internacional desde el diseño: Perú y Colombia en la misma red.

## Criterio 5. Exposición y defensa (5 minutos + 3 de preguntas)

1. (30 s) La foto de portada: "Fuimos a La Salle Bogotá y vimos que los grupos que funcionan se sostienen con mentoría entre pares".
2. (45 s) El problema y los datos de deserción.
3. (2 min 30 s) Demostración en el celular: entrar con un usuario demo, inicio, pedir ayuda en Cálculo, ver cómo le llega a un mentor, una comunidad con su ruta y un reto del Colca.
4. (45 s) Tablero de impacto y privacidad: consentimiento, sin ubicación de personas, eliminar cuenta.
5. (30 s) Cierre: QR del póster para que el jurado entre.

Ambos integrantes deben poder explicar la arquitectura y responder sobre datos personales.

## Lista para la mañana del evento

- Abrir https://parche-bokw.onrender.com 15 minutos antes: el plan gratis de Render se duerme y tarda en despertar.
- Tener abierta la app en dos dispositivos con usuarios demo distintos (estudiante y mentor).
- Video de respaldo de la demo en el celular por si falla el wifi (lo permiten las bases).
- Póster A1 con QR a la app.
