'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type D = { id: string; createdAt: string; email: string | null; name: string | null; company: string | null; country: string | null; locale: string; consent: boolean; resource: { slug: string } };

/** Resource downloads. Contact data is present only when the visitor gave explicit consent. */
export default function DownloadsPage() {
  const [rows, setRows] = useState<D[]>([]);
  useEffect(() => {
    api<D[]>('/v1/admin/downloads').then(setRows);
  }, []);
  const csv = () => {
    const head = 'date_utc,resource,email,name,company,country,locale\n';
    const body = rows
      .filter((r) => r.consent)
      .map((r) => [r.createdAt, r.resource.slug, r.email, r.name, r.company, r.country, r.locale].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
    a.download = 'velkin-downloads.csv';
    a.click();
  };
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-graphite-400">Last 200</p>
          <h1 className="text-3xl font-medium">Downloads</h1>
        </div>
        <button className="btn-ghost" onClick={csv}>
          Export subscribers (CSV)
        </button>
      </header>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              {['Date (UTC)', 'Resource', 'Contact', 'Country', 'Lang'].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td font-mono text-xs">{r.createdAt.replace('T', ' ').slice(0, 16)}</td>
                <td className="td text-xs">{r.resource.slug}</td>
                <td className="td text-xs">{r.email ? `${r.name ?? ''} <${r.email}>${r.company ? ` · ${r.company}` : ''}` : <span className="text-graphite-400">anonymous</span>}</td>
                <td className="td text-xs">{r.country ?? '—'}</td>
                <td className="td font-mono text-xs">{r.locale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
