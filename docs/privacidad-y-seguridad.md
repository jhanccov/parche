# Privacidad y seguridad

## Principios

1. **Solo estudiantes verificados**: acceso con correo de dominios de la red La Salle y código de un solo uso (vence en 10 minutos, máximo 5 intentos).
2. **Conexión con propósito**: sin fotos, sin deslizar perfiles, sin chats abiertos entre desconocidos.
3. **Nunca la ubicación de personas**: el mapa solo muestra sedes, comunidades, eventos, retos y ayuda presencial aproximada a la sede.
4. **Datos mínimos**: nombre, sede, carrera, semestre, saberes e intereses. No se piden documentos ni teléfono.
5. **Control**: reportar contenido, salir de comunidades y borrar solicitudes propias.

## Medidas técnicas

- JWT firmado con secreto del servidor; límite de solicitudes por correo e IP.
- Validación de todas las entradas con Zod.
- Acceso a cada chat verificado por pertenencia (comunidad, equipo o mentoría).
- Consultas parametrizadas contra inyección SQL.
- Indicadores de impacto solo agregados.

## Marco legal

- Colombia: Ley 1581 de 2012 (protección de datos personales).
- Perú: Ley 29733 (protección de datos personales).

Antes del piloto se requiere una política de privacidad, consentimiento informado y un acuerdo con cada universidad sobre el uso de su nombre y de sus dominios de correo.
