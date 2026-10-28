import { FormEvent, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ago } from '../lib/format';
import { Avatar } from './ui';

type Msg = { id: number; body: string; created_at: string; author_id: string; author: string; university: string };

export default function Chat({ channel, placeholder = 'Escribe un mensaje' }: { channel: string; placeholder?: string }) {
  const { me } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    last.current = 0;
    setMsgs([]);
    async function poll() {
      try {
        const nuevos = await api<Msg[]>(`/messages/${channel}?after=${last.current}`);
        if (!alive || !nuevos.length) return;
        last.current = nuevos[nuevos.length - 1].id;
        setMsgs((m) => [...m, ...nuevos.filter((n) => !m.some((x) => x.id === n.id))]);
      } catch (e: any) {
        if (alive) setErr(e.message);
      }
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [channel]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const r = await api<{ id: number; created_at: string }>(`/messages/${channel}`, { body: { body } });
      setMsgs((m) => (m.some((x) => x.id === r.id) ? m : [...m, { id: r.id, body, created_at: r.created_at, author_id: me!.id, author: me!.name ?? '', university: me!.university }]));
      last.current = Math.max(last.current, r.id);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (err && !msgs.length) return <p className="muted small">{err}</p>;

  return (
    <div className="chat">
      <div className="chat-list" ref={box}>
        {msgs.length === 0 && <p className="muted small center">Aún no hay mensajes. Rompe el hielo.</p>}
        {msgs.map((m) => {
          const mine = m.author_id === me?.id;
          return (
            <div key={m.id} className={`msg ${mine ? 'mine' : ''}`}>
              {!mine && <Avatar name={m.author} size={28} />}
              <div className="bubble">
                {!mine && <span className="msg-author">{m.author} · {m.university}</span>}
                <p>{m.body}</p>
                <span className="msg-time">{ago(m.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={1000} aria-label="Mensaje" />
        <button className="icon-btn gold" aria-label="Enviar"><Send size={18} /></button>
      </form>
    </div>
  );
}
