'use client';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RESOURCES } from '@/lib/resources';

export default function ContentList() {
  const { resource } = useParams<{ resource: string }>();
  const r = RESOURCES[resource];
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  useEffect(() => {
    if (r) api<Record<string, unknown>[]>(`/v1/admin/cms/${resource}`).then(setRows);
  }, [r, resource]);
  if (!r) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-medium">{r.label}</h1>
        <Link href={`/content/${resource}/new`} className="btn-primary">
          + New
        </Link>
      </header>
      <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
        {rows?.map((row) => (
          <li key={String(row.id)}>
            <Link href={`/content/${resource}/${row.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <span>{r.titleOf(row)}</span>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${row.published === false ? 'text-graphite-400' : 'text-accent'}`}>
                {row.published === false ? 'Draft' : 'Live'}
              </span>
            </Link>
          </li>
        ))}
        {rows?.length === 0 && <li className="px-4 py-6 text-sm text-graphite-400">Nothing yet.</li>}
      </ul>
    </div>
  );
}
