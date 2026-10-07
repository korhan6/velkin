'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { FieldInput } from '@/components/FieldInput';
import { api, ApiError, LOCALES } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RESOURCES } from '@/lib/resources';

type Row = Record<string, unknown> & { translations?: Record<string, Record<string, unknown>> };
const READONLY = ['id', 'createdAt', 'updatedAt'];

export default function ContentEditor() {
  const { resource, id } = useParams<{ resource: string; id: string }>();
  const r = RESOURCES[resource];
  const isNew = id === 'new';
  const router = useRouter();
  const { me } = useAuth();
  const [row, setRow] = useState<Row>({ translations: { en: {} }, published: true, specs: [], gallery: [], services: [], tags: [] });
  const [locale, setLocale] = useState(LOCALES[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (r && !isNew) api<Row>(`/v1/admin/cms/${resource}/${id}`).then(setRow);
  }, [r, isNew, resource, id]);
  if (!r) notFound();

  const setField = (k: string, v: unknown) => setRow((s) => ({ ...s, [k]: v }));
  const setT = (k: string, v: unknown) =>
    setRow((s) => ({ ...s, translations: { ...s.translations, [locale]: { ...(s.translations?.[locale] ?? {}), [k]: v } } }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = Object.fromEntries(Object.entries(row).filter(([k]) => !READONLY.includes(k)));
    if (!r.translated.length) delete body.translations;
    try {
      const saved = await api<Row>(isNew ? `/v1/admin/cms/${resource}` : `/v1/admin/cms/${resource}/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        json: body,
      });
      if (isNew) router.replace(`/content/${resource}/${saved.id}`);
      else setRow(saved);
    } catch (x) {
      const issues = x instanceof ApiError ? (x.body as { message?: { issues?: { path: string[]; message: string }[] } })?.message?.issues : null;
      setError(issues ? issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') : x instanceof Error ? x.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-graphite-400">{r.label}</p>
          <h1 className="text-3xl font-medium">{isNew ? 'New' : r.titleOf(row)}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew && me?.role === 'ADMIN' && (
            <button
              type="button"
              className="btn-ghost text-accent"
              onClick={async () => {
                if (!confirm('Delete permanently?')) return;
                await api(`/v1/admin/cms/${resource}/${id}`, { method: 'DELETE' });
                router.replace(`/content/${resource}`);
              }}
            >
              Delete
            </button>
          )}
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & publish'}
          </button>
        </div>
      </header>
      {error && <p className="rounded border border-accent/50 p-3 font-mono text-xs text-accent">{error}</p>}

      <section className="card grid gap-5 md:grid-cols-2">
        {r.fields.map((f) => (
          <label key={f.key} className={['specs', 'metrics', 'gallery', 'markdown', 'textarea', 'list'].includes(f.type) ? 'md:col-span-2' : ''}>
            <span className="label">{f.label}</span>
            <FieldInput field={f} value={row[f.key]} onChange={(v) => setField(f.key, v)} />
          </label>
        ))}
      </section>

      {r.translated.length > 0 && (
        <section className="card space-y-5">
          <div className="flex items-center gap-2">
            <span className="label !mb-0 me-3">Language</span>
            {LOCALES.map((l) => {
              const filled = Object.values(row.translations?.[l] ?? {}).some((v) => (Array.isArray(v) ? v.length : v));
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`rounded-full px-3 py-1 font-mono text-xs uppercase ${locale === l ? 'bg-accent text-ink' : 'border border-white/15'}`}
                >
                  {l} {filled ? '●' : '○'}
                </button>
              );
            })}
            <span className="ms-auto text-xs text-graphite-400">English is required; empty fields in other languages fall back to English.</span>
          </div>
          {r.translated.map((f) => (
            <label key={`${locale}-${f.key}`} className="block">
              <span className="label">
                {f.label} · {locale.toUpperCase()}
              </span>
              <FieldInput field={f} value={row.translations?.[locale]?.[f.key]} onChange={(v) => setT(f.key, v)} />
            </label>
          ))}
        </section>
      )}
    </form>
  );
}
