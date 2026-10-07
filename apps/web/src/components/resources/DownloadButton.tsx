'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../ui/Icon';

const API = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * White paper / datasheet download. If the resource is "gated", a small dialog offers optional
 * email capture (with explicit marketing consent) — the visitor can always download without subscribing.
 */
export function DownloadButton({ slug, gated, title }: { slug: string; gated: boolean; title: string }) {
  const t = useTranslations('resources');
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [f, setF] = useState({ email: '', name: '', company: '', consent: false });

  useEffect(() => {
    const d = dialog.current;
    const close = () => setError(false);
    d?.addEventListener('close', close);
    return () => d?.removeEventListener('close', close);
  }, []);

  const request = async (withContact: boolean) => {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`${API}/v1/public/resources/${slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withContact && f.email ? { ...f, locale } : { locale, consent: false }),
      });
      if (!res.ok) throw new Error();
      const { url } = (await res.json()) as { url: string };
      window.umami?.track('resource_download', { slug, subscribed: withContact && !!f.email });
      dialog.current?.close();
      window.location.assign(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void request(true);
  };

  return (
    <>
      <button type="button" className="link" disabled={busy} onClick={() => (gated ? dialog.current?.showModal() : request(false))}>
        <Icon name="download" size={16} />
        {t('download')}
      </button>
      {gated && (
        <dialog ref={dialog} className="w-[min(92vw,440px)] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-black/40" aria-labelledby={`dl-${slug}`}>
          <form onSubmit={submit} className="space-y-4 p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id={`dl-${slug}`} className="text-lg font-semibold">
                  {t('gate.title')}
                </p>
                <p className="mt-1 text-[14px] text-ink-3">{title}</p>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="-me-2 p-2 text-ink-3 hover:text-ink">
                <Icon name="close" size={18} />
              </button>
            </div>
            <p className="text-[14px] leading-relaxed text-ink-2">{t('gate.body')}</p>
            {(['email', 'name', 'company'] as const).map((k) => (
              <label key={k} className="block text-[13px] font-medium text-ink-2">
                {t(`gate.${k}`)}
                <input
                  type={k === 'email' ? 'email' : 'text'}
                  autoComplete={k === 'email' ? 'email' : k === 'name' ? 'name' : 'organization'}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-md border border-line-2 bg-surface px-3 text-[15px] focus:border-accent focus:outline-none"
                />
              </label>
            ))}
            <label className="flex items-start gap-3 text-[13px] text-ink-2">
              <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
              {t('gate.consent')}
            </label>
            {error && <p className="text-[13px] text-accent">{t('gate.error')}</p>}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button className="btn-primary !h-11" disabled={busy || !f.email || !f.consent}>
                {t('gate.submit')}
              </button>
              <button type="button" className="text-[14px] text-ink-2 underline-offset-4 hover:underline" disabled={busy} onClick={() => request(false)}>
                {t('gate.skip')}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
