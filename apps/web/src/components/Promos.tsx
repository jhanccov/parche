import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { shareLink } from '../lib/fx';

// Invitaciones para usar más Parche: crear un parche, pedir o dar ayuda e invitar al salón.
export const INVITES: { key: string; title: string; text: string; cta: string; to?: string; share?: boolean; img: string }[] = [
  { key: 'inv-crear', title: 'Crea el parche de tu carrera', text: 'Un club, un semillero o un grupo de estudio. Te guiamos paso a paso hasta que esté activo.', cta: 'Crear comunidad', to: '/comunidades/nueva', img: '/img/invite-crear.jpg' },
  { key: 'inv-ayuda', title: '¿Te trabaste en un curso?', text: 'Pide ayuda y le llega a quien domina el tema, en tu sede o en otro país.', cta: 'Pedir ayuda', to: '/mentoria/nueva', img: '/img/invite-ayuda.jpg' },
  { key: 'inv-juanita', title: '¡Choca esos cinco!', text: 'Juanita, la mascota de La Salle Bogotá, celebra cada hora de mentoría. Ayuda a alguien hoy y gana tu insignia de Mentor.', cta: 'Quiero ayudar', to: '/mentoria', img: '/img/mascota-juanita.webp' },
  { key: 'inv-share', title: 'Trae a tu salón', text: 'Mientras más compañeros entren, más rápido encuentras ayuda y equipo.', cta: 'Compartir Parche', share: true, img: '/img/invite-compartir.jpg' },
];

export default function Promos({ only }: { only?: string[] }) {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); }, [toast]);
  const list = only ? INVITES.filter((i) => only.includes(i.key)) : INVITES;
  return (
    <div className="promos">
      {list.map((d) => {
        const inner = (
          <>
            <span className="promo-img" style={{ backgroundImage: `url(${d.img})` }} aria-hidden />
            <span className="promo-text">
              <strong>{d.title}</strong>
              <small>{d.text}</small>
              <span className="promo-cta">{d.cta} <ChevronRight size={16} /></span>
            </span>
          </>
        );
        return d.share ? (
          <button key={d.key} className="promo" onClick={async () => { if ((await shareLink('Únete a mi parche', '/')) === 'copied') setToast('Enlace copiado'); }}>{inner}</button>
        ) : (
          <Link key={d.key} to={d.to!} className="promo">{inner}</Link>
        );
      })}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
