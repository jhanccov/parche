import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar, ErrorMsg } from '../components/ui';

const VERBS = ['Aprende', 'Crea', 'Conecta', 'Transforma'];
const BUBBLES = ['💻', '📐', '🤝', '🏔️', '🚀', '🎭', '⚽', '🔬', '🌱', '☁️'];

type Demo = { id: string; name: string; career: string; university: string; campus: string };

export default function Login() {
  const { me, signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demos, setDemos] = useState<Demo[]>([]);

  const [verb, setVerb] = useState(0);

  useEffect(() => {
    api<Demo[]>('/auth/demo-users').then(setDemos).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.add('dark-page');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = reduce ? undefined : setInterval(() => setVerb((v) => (v + 1) % VERBS.length), 2200);
    return () => { document.body.classList.remove('dark-page'); if (t) clearInterval(t); };
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
      const r = await api<{ token: string; needsProfile: boolean }>('/auth/verify', { body: { email, code } });
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
        {BUBBLES.map((b, i) => <span key={i} style={{ left: `${(i * 37) % 92}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${13 + (i % 4) * 3}s` }}>{b}</span>)}
      </div>
      <div className="login-hero">
        <span className="wordmark big">parche<i aria-hidden>✦</i></span>
        <h1><span className="verb" key={verb}>{VERBS[verb]}</span><br />con tu parche La Salle</h1>
        <p>Comunidades, mentoría entre pares y retos reales con estudiantes de Perú y Colombia.</p>
        <div className="login-tags"><span>👥 Comunidades</span><span>🤝 Mentoría</span><span>🏔️ Retos</span></div>
      </div>

      <div className="card login-card">
        {step === 'email' ? (
          <form onSubmit={requestCode}>
            <label htmlFor="email">Tu correo institucional</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ulasalle.edu.pe" autoComplete="email" />
            <ErrorMsg msg={err} />
            <button className="btn gold block big" disabled={busy}>{busy ? 'Enviando...' : 'Recibir mi código'}</button>
            <p className="muted small"><ShieldCheck size={14} /> Solo estudiantes de la red La Salle. Nadie ve tu ubicación.</p>
          </form>
        ) : (
          <form onSubmit={verify}>
            <label htmlFor="code">Código de 6 dígitos enviado a {email}</label>
            <input id="code" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            {devCode && <p className="hint">Modo demostración: tu código es <strong>{devCode}</strong></p>}
            <ErrorMsg msg={err} />
            <button className="btn gold block" disabled={busy}>{busy ? 'Verificando...' : 'Entrar'}</button>
            <button type="button" className="btn ghost block" onClick={() => setStep('email')}>Cambiar correo</button>
          </form>
        )}
      </div>

      {demos.length > 0 && (
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
