import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page narrow privacy">
      <img src="/logo.png" alt="Parche" className="login-logo" />
      <h1>Política de privacidad</h1>
      <p className="muted">Versión de noviembre de 2026</p>

      <p>
        Parche es un proyecto estudiantil de Ingeniería de Software de la Universidad La Salle (Arequipa, Perú), hecho en
        colaboración con la red La Salle de Colombia. Tratamos tus datos personales conforme a la Ley N.° 29733, Ley de
        Protección de Datos Personales del Perú, y su reglamento, y a la Ley 1581 de 2012 de Colombia.
      </p>

      <h2>Qué datos usamos</h2>
      <ul>
        <li>Tu correo institucional, para verificar que eres estudiante de la red La Salle.</li>
        <li>Nombre, universidad, sede, carrera, semestre, una bio corta, lo que puedes enseñar y lo que quieres aprender.</li>
        <li>Lo que haces en la app: comunidades, mensajes, solicitudes de mentoría, horas confirmadas y retos.</li>
      </ul>
      <p>No pedimos fotos de perfil, número de teléfono ni tu ubicación. El mapa muestra sedes, comunidades y retos, nunca personas.</p>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Conectarte con otros estudiantes según lo que sabes y lo que quieres aprender.</li>
        <li>Emitir tu constancia de horas de mentoría.</li>
        <li>Calcular el tablero de impacto, que solo muestra datos agregados y anónimos.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros. El código de acceso se envía por correo mediante un proveedor de envío (Brevo).</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes acceder a tus datos, corregirlos desde tu perfil y eliminar tu cuenta en cualquier momento desde
        Perfil, opción "Eliminar mi cuenta". También puedes escribir a jhanccov@ulasalle.edu.pe para ejercer tus
        derechos de acceso, rectificación, cancelación y oposición.
      </p>

      <h2>Pruebas con usuarios</h2>
      <p>
        Quienes participan en las pruebas del piloto aceptan esta política al entrar. Las respuestas a encuestas de
        validación se usan solo de forma agregada.
      </p>

      <p><Link to="/" className="btn navy">Volver</Link></p>
    </div>
  );
}
