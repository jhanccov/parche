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
- Indicadores de impacto solo agregados; el tablero de mentores muestra
  únicamente el primer nombre y la universidad, nunca apellidos ni correos.

## Marco legal

- Colombia: Ley 1581 de 2012 (protección de datos personales).
- Perú: Ley 29733 (protección de datos personales).

## Cómo lo cumple la app

- Consentimiento informado: para entrar, el estudiante marca la casilla que acepta la política de privacidad. La API rechaza crear la cuenta sin ese consentimiento y guarda la fecha y la versión (`users.consent_at`, `users.consent_version`, migración `002_consentimiento.sql`).
- Política de privacidad pública en `/privacidad`, accesible sin iniciar sesión.
- Derecho de supresión: desde Perfil, "Eliminar mi cuenta" borra al usuario y sus datos (`DELETE /api/me`). Lo publicado en comunidades y retos queda sin autor.
- Derecho de rectificación: el estudiante edita su perfil en cualquier momento.
- Asistente Juanita: en modo con IA solo se envía a Anthropic el texto de la conversación, nunca nombre ni correo, y no se guarda; una prueba automática verifica que el correo no viaje a la IA. Los botones que propone la IA se filtran contra una lista de pantallas permitidas.
- Pruebas automáticas que lo verifican: "sin consentimiento de datos no se crea la cuenta" y "el estudiante puede eliminar su cuenta y sus datos".

Para el piloto con universidades queda pendiente el acuerdo con cada una sobre el uso de su nombre y de sus dominios de correo.


## Redes oficiales en La Salle hoy

El recuadro de Facebook de las páginas oficiales (por ejemplo ULASALLE) es el plugin oficial de Facebook y no se carga hasta que el estudiante lo toca. Así nadie se conecta con Facebook sin decidirlo. Instagram, TikTok, X y los sitios web solo son enlaces que abren fuera de Parche. Parche no lee ni guarda datos de esas redes.
