'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Lead = {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string | null;
  country: string;
  region: string;
  projectType: string;
  status: string;
  createdAt: string;
  timezone: string;
  _count: { attachments: number };
};
type Stats = { total: number; byRegion: { region: string; count: number }[]; byCountry: { country: string; count: number }[]; byStatus: { status: string; count: number }[] };

const REGIONS: Record<string, string> = { AF: 'Africa', AS: 'Asia', EU: 'Europe', NA: 'North America', SA: 'South America', OC: 'Oceania', AN: 'Antarctica' };
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM'];

export default function LeadsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<{ items: Lead[]; total: number; page: number; pageSize: number } | null>(null);
  const [f, setF] = useState({ region: '', status: '', q: '', page: 1 });

  useEffect(() => {
    api<Stats>('/v1/admin/leads/stats?days=90').then(setStats).catch(() => undefined);
  }, []);
  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)]));
    api<typeof data>(`/v1/admin/leads?${qs}`).then(setData).catch(() => undefined);
  }, [f]);

  const max = Math.max(1, ...(stats?.byRegion.map((r) => r.count) ?? [1]));
  const regionName = (r: string) => REGIONS[r] ?? r;
  const country = (c: string) => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) ?? c;
    } catch {
      return c;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-graphite-400">Last 90 days</p>
          <h1 className="text-3xl font-medium">Leads</h1>
        </div>
        <p className="font-mono text-4xl">{stats?.total ?? '—'}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="label">By region (click to filter)</p>
          <ul className="mt-3 space-y-2">
            {stats?.byRegion
              .sort((a, b) => b.count - a.count)
              .map((r) => (
                <li key={r.region}>
                  <button className="w-full text-start" onClick={() => setF({ ...f, region: f.region === r.region ? '' : r.region, page: 1 })}>
                    <div className="flex justify-between text-sm">
                      <span className={f.region === r.region ? 'text-accent' : ''}>{regionName(r.region)}</span>
                      <span className="font-mono">{r.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-white/5">
                      <div className="h-full rounded bg-accent" style={{ width: `${(r.count / max) * 100}%` }} />
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        </div>
        <div className="card">
          <p className="label">Top countries</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {stats?.byCountry.map((c) => (
              <li key={c.country} className="flex justify-between">
                <span>{country(c.country)}</span>
                <span className="font-mono text-graphite-300">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name, email, company, ref…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} />
        <select className="input max-w-[180px]" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value, page: 1 })}>
          <option value="">All regions</option>
          {Object.entries(REGIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}>
          <option value="">Active (no spam)</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </section>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              {['Ref', 'Received (UTC)', 'Contact', 'Country', 'Type', 'Files', 'Status'].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((l) => (
              <tr key={l.id} className="hover:bg-white/[0.02]">
                <td className="td font-mono text-xs">
                  <Link href={`/leads/${l.id}`} className="text-accent hover:underline">
                    {l.reference}
                  </Link>
                </td>
                <td className="td font-mono text-xs text-graphite-300">{l.createdAt.replace('T', ' ').slice(0, 16)}</td>
                <td className="td">
                  {l.name}
                  <span className="block text-xs text-graphite-400">{l.company ?? l.email}</span>
                </td>
                <td className="td text-xs">
                  {country(l.country)} <span className="text-graphite-400">· {l.region}</span>
                </td>
                <td className="td text-xs">{l.projectType}</td>
                <td className="td font-mono text-xs">{l._count.attachments}</td>
                <td className="td font-mono text-[11px]">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.total > data.pageSize && (
        <div className="flex items-center gap-3 font-mono text-xs">
          <button className="btn-ghost" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>
            ←
          </button>
          <span>
            {data.page} / {Math.ceil(data.total / data.pageSize)}
          </span>
          <button className="btn-ghost" disabled={data.page * data.pageSize >= data.total} onClick={() => setF({ ...f, page: f.page + 1 })}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
