import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Cloud, Drama, Handshake, Laptop, Microscope, Mountain, PencilRuler, Rocket, ShieldCheck, Sparkle, Sprout, Users, Volleyball } from 'lucide-react';
import { api } from '../lib/api';
import { setThemeColor } from '../lib/fx';
import { useAuth } from '../lib/auth';
import { Avatar, ErrorMsg, Flag } from '../components/ui';

const VERBS = ['Aprende', 'Crea', 'Conecta', 'Transforma'];
const BUBBLES = [Laptop, PencilRuler, Handshake, Mountain, Rocket, Drama, Volleyball, Microscope, Sprout, Cloud];

type Demo = { id: string; name: string; career: string; university: string; campus: string };

export default function Login() {
  const { me, signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  const [verb, setVerb] = useState(0);

  useEffect(() => {
    api<{ demo: boolean }>('/health').then((h) => setDemoMode(!!h.demo)).catch(() => {});
    api<Demo[]>('/auth/demo-users').then(setDemos).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.add('dark-page');
    setThemeColor('dark');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = reduce ? undefined : setInterval(() => setVerb((v) => (v + 1) % VERBS.length), 2200);
    return () => { document.body.classList.remove('dark-page'); setThemeColor('default'); if (t) clearInterval(t); };
  }, []);

  if (me) return <Navigate to="/" replace />;

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ devCode?: string }>('/auth/request-code', { body: { email } });
      setDevCode(r.devCode ?? null);
      setStep('code');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ token: string; needsProfile: boolean }>('/auth/verify', { body: { email, code, consent } });
      await signIn(r.token);
      nav(r.needsProfile ? '/bienvenida' : '/');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function demo(id: string) {
    const r = await api<{ token: string }>('/auth/demo-login', { body: { userId: id } });
    await signIn(r.token);
    nav('/');
  }

  return (
    <div className="login">
      <div className="bubbles" aria-hidden>
        {BUBBLES.map((B, i) => <span key={i} style={{ left: `${(i * 37) % 92}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${13 + (i % 4) * 3}s` }}><B size={28} /></span>)}
      </div>
      <figure className="login-cover">
        <img src="/img/portada-colombia.jpg" alt="Delegación de ULASALLE Arequipa en la Universidad de La Salle, Bogotá, con las banderas del Perú, La Salle Internacional y Arequipa" />
        <figcaption><Flag country="Perú" /> <Flag country="Colombia" /> Estudiantes de ULASALLE Arequipa en La Salle Bogotá, octubre de 2026</figcaption>
      </figure>
      <div className="login-hero">
        <span className="wordmark big">parche<i aria-hidden><Sparkle size={22} fill="currentColor" strokeWidth={0} /></i></span>
        <h1><span className="verb" key={verb}>{VERBS[verb]}</span><br />con tu parche La Salle</h1>
        <p>Comunidades, mentoría entre pares y retos reales con estudiantes de Perú y Colombia.</p>
        <div className="login-tags"><span><Users size={16} /> Comunidades</span><span><Handshake size={16} /> Mentoría</span><span><Mountain size={16} /> Retos</span></div>
        <p className="login-countries"><Flag country="Perú" size={22} /> Perú <Flag country="Colombia" size={22} /> Colombia</p>
      </div>

      <div className="card login-card">
        {step === 'email' ? (
          <form onSubmit={requestCode}>
            <label htmlFor="email">Tu correo institucional</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ulasalle.edu.pe" autoComplete="email" />
            <ErrorMsg msg={err} />
            <label className="consent">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Acepto la <Link to="/privacidad">política de privacidad</Link> y el tratamiento de mis datos según la Ley N.° 29733 (Perú) y la Ley 1581 de 2012 (Colombia).</span>
            </label>
            <button className="btn gold block big" disabled={busy}>{busy ? 'Enviando...' : 'Recibir mi código'}</button>
            <p className="muted small"><ShieldCheck size={14} /> Solo estudiantes de la red La Salle. Nadie ve tu ubicación.</p>
          </form>
        ) : (
          <form onSubmit={verify}>
            <label htmlFor="code">Código de 6 dígitos enviado a {email}</label>
            <input id="code" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            <p className="muted small">El código vence en 10 minutos y tienes 5 intentos.</p>
            {demoMode && devCode && <p className="hint">Modo demostración: tu código es <strong>{devCode}</strong></p>}
            <ErrorMsg msg={err} />
            <button className="btn gold block" disabled={busy}>{busy ? 'Verificando...' : 'Entrar'}</button>
            <button type="button" className="btn ghost block" onClick={() => setStep('email')}>Cambiar correo</button>
          </form>
        )}
      </div>

      {demoMode && demos.length > 0 && (
        <div className="card login-card">
          <h3>Explora la demostración</h3>
          <p className="muted small">Entra como un estudiante de ejemplo para recorrer la app.</p>
          <div className="demo-list">
            {demos.map((d) => (
              <button key={d.id} className="demo-user" onClick={() => demo(d.id)}>
                <Avatar name={d.name} size={36} />
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.career} · {d.university}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
