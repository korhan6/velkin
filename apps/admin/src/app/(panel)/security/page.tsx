'use client';
import { useState } from 'react';
import { api, refresh } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SecurityPage() {
  const { me, reload } = useAuth();
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState('');

  const start = async () => setSetup(await api<{ qr: string; secret: string }>('/v1/auth/2fa/setup', { method: 'POST' }));
  const enable = async () => {
    try {
      await api('/v1/auth/2fa/enable', { method: 'POST', json: { code } });
      await refresh(); // new access token carries the 2FA claim
      await reload();
      setSetup(null);
      setMsg('2FA enabled.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Invalid code');
    }
  };
  const changePw = async () => {
    try {
      await api('/v1/auth/password', { method: 'POST', json: pw });
      setMsg('Password changed. Other sessions were signed out.');
      setPw({ current: '', next: '' });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-medium">Security</h1>
      {me?.mustEnroll2fa && <p className="rounded border border-accent/50 p-3 text-sm text-accent">Two-factor authentication is mandatory for admins. Enable it to continue.</p>}
      {msg && <p className="font-mono text-xs text-accent">{msg}</p>}

      <section className="card space-y-4">
        <p className="label">Two-factor authentication (TOTP)</p>
        {me?.totpEnabled ? (
          <p className="text-sm">Enabled ✓</p>
        ) : setup ? (
          <div className="flex flex-wrap items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="2FA QR code" className="h-44 w-44 rounded bg-white p-2" />
            <div className="space-y-3">
              <p className="text-sm text-graphite-300">Scan with an authenticator app, or enter this key:</p>
              <code className="block break-all font-mono text-xs">{setup.secret}</code>
              <input className="input max-w-[200px] text-center font-mono tracking-[0.4em]" maxLength={6} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              <button className="btn-primary" onClick={enable}>
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-primary" onClick={start}>
            Set up 2FA
          </button>
        )}
      </section>

      <section className="card max-w-md space-y-4">
        <p className="label">Change password (min. 12 characters)</p>
        <input className="input" type="password" placeholder="Current" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <input className="input" type="password" placeholder="New" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <button className="btn-primary" onClick={changePw} disabled={pw.next.length < 12}>
          Update password
        </button>
      </section>
    </div>
  );
}
