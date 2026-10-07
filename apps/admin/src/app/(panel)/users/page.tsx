'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type U = { id: string; email: string; name: string | null; role: 'ADMIN' | 'EDITOR'; totpEnabled: boolean; lastLoginAt: string | null };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [form, setForm] = useState({ email: '', name: '', role: 'EDITOR', password: '' });
  const [msg, setMsg] = useState('');
  const load = () => api<U[]>('/v1/admin/users').then(setUsers);
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      await api('/v1/admin/users', { method: 'POST', json: form });
      setForm({ email: '', name: '', role: 'EDITOR', password: '' });
      setMsg('User created — share the temporary password securely and ask them to change it.');
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-medium">Users</h1>
      {msg && <p className="font-mono text-xs text-accent">{msg}</p>}
      <table className="w-full rounded-lg border border-white/10">
        <thead>
          <tr>
            {['Email', 'Role', '2FA', 'Last login (UTC)', ''].map((h) => (
              <th key={h} className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="td">{u.email}</td>
              <td className="td">
                <select className="input max-w-[130px]" value={u.role} onChange={(e) => api(`/v1/admin/users/${u.id}`, { method: 'PATCH', json: { role: e.target.value } }).then(load)}>
                  <option>EDITOR</option>
                  <option>ADMIN</option>
                </select>
              </td>
              <td className="td font-mono text-xs">{u.totpEnabled ? 'on' : 'off'}</td>
              <td className="td font-mono text-xs">{u.lastLoginAt?.replace('T', ' ').slice(0, 16) ?? '—'}</td>
              <td className="td text-end">
                <button className="font-mono text-xs text-accent" onClick={() => confirm(`Delete ${u.email}?`) && api(`/v1/admin/users/${u.id}`, { method: 'DELETE' }).then(load)}>
                  delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="card grid max-w-2xl gap-3 md:grid-cols-2">
        <p className="label md:col-span-2">Invite user</p>
        <input className="input" placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>EDITOR</option>
          <option>ADMIN</option>
        </select>
        <input className="input" type="password" placeholder="temporary password (12+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn-primary md:col-span-2 md:w-fit" onClick={create}>
          Create
        </button>
      </section>
    </div>
  );
}
