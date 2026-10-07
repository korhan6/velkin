'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { Project } from '@/lib/types';
import { ProjectCard } from './ProjectCard';

type Key = 'industry' | 'service' | 'region';

export function ProjectFilters({
  projects,
  industries,
  services,
}: {
  projects: Project[];
  industries: Record<string, string>;
  services: Record<string, string>;
}) {
  const t = useTranslations('projectsPage');
  const regions = useTranslations('regions');
  const locale = useLocale();
  const [f, setF] = useState<Record<Key, string>>({ industry: '', service: '', region: '' });

  const options = useMemo(
    () => ({
      industry: [...new Set(projects.map((p) => p.industry))],
      service: [...new Set(projects.flatMap((p) => p.services))],
      region: [...new Set(projects.map((p) => p.region))],
    }),
    [projects],
  );
  const label = (k: Key, v: string) =>
    k === 'industry' ? industries[v] ?? v : k === 'service' ? services[v] ?? v : regions.has(v as 'EU') ? regions(v as 'EU') : v;

  const shown = projects.filter(
    (p) => (!f.industry || p.industry === f.industry) && (!f.service || p.services.includes(f.service)) && (!f.region || p.region === f.region),
  );

  return (
    <>
      <div className="flex flex-wrap items-end gap-4 border-b border-line pb-6">
        {(['industry', 'service', 'region'] as Key[]).map((k) => (
          <label key={k} className="flex min-w-[180px] flex-col gap-1.5 text-[13px] font-medium text-ink-3">
            {t(k)}
            <select
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className="h-11 rounded-md border border-line-2 bg-surface px-3 text-[15px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="">{t('all')}</option>
              {options[k].map((v) => (
                <option key={v} value={v}>
                  {label(k, v)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p className="ms-auto text-[14px] text-ink-3" aria-live="polite">
          {t('count', { count: shown.length })}
        </p>
      </div>
      {shown.length ? (
        <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug}>
              <ProjectCard project={p} locale={locale} industryLabel={industries[p.industry] ?? p.industry} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-24 text-center text-ink-3">{t('empty')}</p>
      )}
    </>
  );
}
