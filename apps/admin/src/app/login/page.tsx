'use client';
import { LogoMark } from '@velkin/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { me, login, verify } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfa, setMfa] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me) router.replace('/leads');
  }, [me, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mfa) await verify(mfa, code);
      else {
        const r = await login(email, password);
        if (r.mfaToken) setMfa(r.mfaToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em]">Velkine</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-graphite-400">Admin console</p>
          </div>
        </div>
        {!mfa ? (
          <>
            <label className="block">
              <span className="label">Email</span>
              <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
          </>
        ) : (
          <label className="block">
            <span className="label">Authenticator code</span>
            <input className="input text-center font-mono text-lg tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
          </label>
        )}
        {error && <p className="font-mono text-xs text-accent">{error}</p>}
        <button className="btn-primary w-full justify-center" disabled={busy}>
          {busy ? '…' : mfa ? 'Verify' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
