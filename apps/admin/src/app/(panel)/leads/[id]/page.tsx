'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Lead = Record<string, unknown> & {
  id: string;
  reference: string;
  name: string;
  email: string;
  status: string;
  notes: string | null;
  timezone: string;
  locale: string;
  preferredCallAt: string | null;
  description: string;
  attachments: { id: string; filename: string; size: number; url: string }[];
};

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Lead>(`/v1/admin/leads/${id}`).then((l) => {
      setLead(l);
      setNotes(l.notes ?? '');
    });
  }, [id]);

  if (!lead) return <p className="font-mono text-xs text-graphite-400">Loading…</p>;

  const save = async (patch: Record<string, unknown>) => {
    const l = await api<Lead>(`/v1/admin/leads/${id}`, { method: 'PATCH', json: patch });
    setLead({ ...lead, ...l, attachments: lead.attachments });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const localCall = lead.preferredCallAt
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: lead.timezone }).format(new Date(lead.preferredCallAt))
    : null;
  const rows: [string, unknown][] = [
    ['Email', lead.email],
    ['Company', lead.company],
    ['Job title', lead.jobTitle],
    ['Phone', lead.phone],
    ['Country / region', `${lead.country} · ${lead.region} (IP: ${lead.ipCountry ?? '?'})`],
    ['Language / time zone', `${lead.locale} · ${lead.timezone}`],
    ['Project type / industry', `${lead.projectType} · ${lead.industry ?? '—'}`],
    ['Budget', lead.budgetAmount ? `${lead.budgetAmount} ${lead.budgetCurrency ?? ''}` : `${({ lt25: '< 25k', '25-100': '25k–100k', '100-500': '100k–500k', gt500: '> 500k', unsure: 'Not defined' } as Record<string, string>)[String(lead.budgetRange)] ?? '—'} USD-equiv. · shown in ${lead.budgetCurrency ?? 'USD'}`],
    ['Timeline', lead.timeline],
    ['Requested call', localCall ? `${localCall} (client local) · ${lead.preferredCallAt} UTC` : 'No'],
    ['Source', lead.source],
    ['UTM', lead.utm ? JSON.stringify(lead.utm) : null],
    ['Received (UTC)', lead.createdAt],
  ];

  return (
    <div className="space-y-6">
      <button className="font-mono text-xs text-graphite-400 hover:text-bone" onClick={() => router.back()}>
        ← Leads
      </button>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-accent">{lead.reference}</p>
          <h1 className="text-3xl font-medium">{lead.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select className="input" value={lead.status} onChange={(e) => save({ status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <a className="btn-primary" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Velkine · ${lead.reference}`)}`}>
            Reply
          </a>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-4 lg:col-span-2">
          <p className="label">Description</p>
          <p className="whitespace-pre-wrap leading-relaxed">{lead.description}</p>
          <p className="label pt-4">Attachments</p>
          {lead.attachments.length ? (
            <ul className="space-y-1 font-mono text-xs">
              {lead.attachments.map((a) => (
                <li key={a.id}>
                  <a className="text-accent hover:underline" href={a.url}>
                    {a.filename}
                  </a>{' '}
                  <span className="text-graphite-400">{(a.size / 1048576).toFixed(1)} MB</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-graphite-400">None</p>
          )}
        </div>
        <dl className="card space-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="break-words">{v === null || v === undefined || v === '' ? '—' : String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="card space-y-3">
        <p className="label">Internal notes</p>
        <textarea className="input min-h-[120px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={() => save({ notes })}>
            Save notes
          </button>
          {saved && <span className="font-mono text-xs text-accent">Saved</span>}
          {me?.role === 'ADMIN' && (
            <button
              className="btn-ghost ms-auto !border-accent/40 text-accent"
              onClick={async () => {
                if (!confirm('Permanently delete this lead and its files (GDPR erasure)?')) return;
                await api(`/v1/admin/leads/${id}`, { method: 'DELETE' });
                router.replace('/leads');
              }}
            >
              Delete (erasure)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
