import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Send, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';

type Action = { label: string; to: string };
type Msg = { role: 'user' | 'assistant'; content: string; actions?: Action[] };

const WELCOME: Msg = {
  role: 'assistant',
  content: '¡Hola! Soy Juanita, tu guía en Parche. Pregúntame cómo pedir ayuda, crear una comunidad, sumarte a un reto o cuidar tus datos.',
};

// Sugerencias según la pantalla en la que está el estudiante.
function suggestionsFor(path: string): string[] {
  if (path.startsWith('/mentoria')) return ['¿Cómo pido ayuda?', '¿Cómo me vuelvo mentor?', '¿Cómo cierro una mentoría?'];
  if (path.startsWith('/comunidades')) return ['¿Cómo creo una comunidad?', '¿Qué es la ruta de formación?', '¿Cómo me uno a una?'];
  if (path.startsWith('/retos')) return ['¿Qué es un reto del territorio?', '¿Cómo armo un equipo?', '¿Qué son los ODS?'];
  if (path.startsWith('/perfil') || path.startsWith('/constancia')) return ['¿Cómo gano insignias?', '¿Cómo saco mi constancia?', '¿Cómo borro mi cuenta?'];
  if (path.startsWith('/mapa')) return ['¿Qué muestra el mapa?', '¿Alguien ve mi ubicación?'];
  if (path.startsWith('/impacto')) return ['¿Qué mide el impacto?', '¿Mis datos son anónimos?'];
  return ['¿Qué es Parche?', '¿Cómo pido ayuda?', '¿Cómo creo una comunidad?', '¿Quién ve mis datos?'];
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { api<{ ai: boolean }>('/assistant/status').then((r) => setAi(r.ai)).catch(() => {}); }, []);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy, open]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: question }];
    setMsgs(next);
    setText('');
    setBusy(true);
    try {
      const history = next.filter((m) => m !== WELCOME).slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 800) }));
      const r = await api<{ mode: 'ia' | 'guia'; reply: string; actions: Action[] }>('/assistant', { body: { messages: history, page: loc.pathname } });
      setAi(r.mode === 'ia' || ai);
      setMsgs([...next, { role: 'assistant', content: r.reply, actions: r.actions }]);
    } catch (e: any) {
      setMsgs([...next, { role: 'assistant', content: e?.message?.includes('Rate') ? 'Vas muy rápido. Espera un momento y vuelve a preguntar.' : 'No pude responder ahora. Intenta de nuevo en un momento.' }]);
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) { e.preventDefault(); ask(text); }
  function go(to: string) { setOpen(false); nav(to); }

  const showSuggestions = !busy && msgs[msgs.length - 1]?.role === 'assistant';

  return (
    <>
      <button className={`juanita-fab ${open ? 'hidden' : ''}`} onClick={() => setOpen(true)} aria-label="Abrir a Juanita, tu guía en Parche">
        <img src="/img/mascota-juanita.webp" alt="" />
        <span className="juanita-fab-label">¿Dudas?</span>
      </button>

      {open && <button className="juanita-backdrop" aria-label="Cerrar asistente" onClick={() => setOpen(false)} />}
      <section className={`juanita ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Juanita, tu guía en Parche" aria-hidden={!open}>
        <header className="juanita-head">
          <span className="sheet-mascot small" aria-hidden><img src="/img/mascota-juanita.webp" alt="" /></span>
          <div>
            <strong>Juanita</strong>
            <span className={`juanita-mode ${ai ? 'ai' : ''}`}>{ai ? <><Sparkles size={12} /> Con IA</> : <><BookOpen size={12} /> Modo guía</>}</span>
          </div>
          <button className="sheet-close" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={18} /></button>
        </header>

        <div className="juanita-list" ref={list} aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`jmsg ${m.role}`}>
              <p>{m.content}</p>
              {!!m.actions?.length && (
                <div className="jactions">
                  {m.actions.map((a) => <button key={a.to} onClick={() => go(a.to)}>{a.label} <ArrowRight size={14} /></button>)}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="jmsg assistant typing" aria-label="Juanita está escribiendo"><span /><span /><span /></div>}
          {showSuggestions && (
            <div className="jsuggest">
              {suggestionsFor(loc.pathname).map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
            </div>
          )}
        </div>

        <form className="juanita-form" onSubmit={submit}>
          <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={800} placeholder="Escribe tu duda..." aria-label="Tu pregunta" />
          <button className="juanita-send" disabled={busy || !text.trim()} aria-label="Enviar"><Send size={18} /></button>
        </form>
        <p className="juanita-note">{ai ? 'Respuestas con IA de Anthropic. No compartas datos personales.' : 'Respuestas de la guía de Parche. No compartas datos personales.'}</p>
      </section>
    </>
  );
}
