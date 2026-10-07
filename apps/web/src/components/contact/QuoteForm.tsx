'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { COUNTRY_CODES, countryName, currencyFor, CURRENCIES, niceRound, USD_RATE } from '@/lib/geo';
import { upcomingSlots } from '@/lib/slots';
import { Icon } from '../ui/Icon';
import { Turnstile } from './Turnstile';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const COMPANY_TZ = process.env.NEXT_PUBLIC_COMPANY_TZ || 'America/Bogota';
const MAX_FILES = 5;
const MAX_SIZE = 50 * 1024 * 1024;
const EXT = /\.(step|stp|iges|igs|stl|dxf|dwg|pdf|zip|png|jpe?g|webp)$/i;
const TIMELINES = ['asap', '1-3m', '3-6m', '6m+', 'flexible'] as const;
const BUDGETS = ['lt25', '25-100', '100-500', 'gt500', 'unsure'] as const;
const BUDGET_USD: Record<string, [number, number?]> = { lt25: [25_000], '25-100': [25_000, 100_000], '100-500': [100_000, 500_000], gt500: [500_000] };

type Upload = { file: File; key?: string; progress: number };
type State = {
  name: string;
  company: string;
  jobTitle: string;
  country: string;
  email: string;
  phone: string;
  projectType: string;
  timeline: string;
  budgetRange: string;
  budgetCurrency: string;
  description: string;
  preferredCallAt: string | null;
  consent: boolean;
  website: string; // honeypot
};

function put(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}

function Field({ label, error, id, hint, children, className = '' }: { label: string; error?: string; id: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[14px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}

export function QuoteForm({ services, defaultCountry }: { services: { slug: string; title: string }[]; defaultCountry: string }) {
  const t = useTranslations('contact');
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [tz, setTz] = useState('UTC');
  const [f, setF] = useState<State>({
    name: '',
    company: '',
    jobTitle: '',
    country: defaultCountry,
    email: '',
    phone: '',
    projectType: services[0]?.slug ?? 'other',
    timeline: '1-3m',
    budgetRange: 'unsure',
    budgetCurrency: currencyFor(defaultCountry),
    description: '',
    preferredCallAt: null,
    consent: false,
    website: '',
  });
  const set = <K extends keyof State>(k: K, v: State[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'), []);

  const countries = useMemo(() => COUNTRY_CODES.map((c) => ({ c, n: countryName(c, locale) })).sort((a, b) => a.n.localeCompare(b.n, locale)), [locale]);
  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency: f.budgetCurrency, notation: 'compact', maximumFractionDigits: 1 }),
    [locale, f.budgetCurrency],
  );
  const budgetLabel = (k: string) => {
    if (k === 'unsure') return t('budgets.unsure');
    const [a, b] = BUDGET_USD[k];
    const rate = USD_RATE[f.budgetCurrency] ?? 1;
    const fa = `${f.budgetCurrency === 'USD' ? '' : '≈ '}${money.format(niceRound(a * rate))}`;
    const fb = b ? money.format(niceRound(b * rate)) : '';
    return t(`budgets.${k as 'lt25'}`, { a: fa, b: fb });
  };

  const slots = useMemo(() => upcomingSlots({ companyTz: COMPANY_TZ }), []);
  const slotDays = useMemo(() => {
    const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
    const map = new Map<string, Date[]>();
    for (const s of slots) map.set(day.format(s), [...(map.get(day.format(s)) ?? []), s]);
    return [...map.entries()].slice(0, 5);
  }, [slots, locale, tz]);
  const time = useMemo(() => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: tz }), [locale, tz]);

  const schema = z.object({
    name: z.string().trim().min(2, t('errors.required')),
    company: z.string().trim().min(1, t('errors.required')),
    email: z.string().trim().email(t('errors.email')),
    country: z.string().length(2, t('errors.required')),
    description: z.string().trim().min(20, t('errors.min')),
    consent: z.literal(true, { errorMap: () => ({ message: t('errors.consent') }) }),
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok = [...list].filter((file) => EXT.test(file.name) && file.size <= MAX_SIZE);
    setErrors((e) => ({ ...e, files: ok.length < list.length ? t('errors.file') : '' }));
    setUploads((u) => [...u, ...ok.map((file) => ({ file, progress: 0 }))].slice(0, MAX_FILES));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (TURNSTILE && !token) return setErrors({ captcha: t('errors.captcha') });
    setErrors({});
    setStatus('sending');
    try {
      const attachments = [];
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        const type = u.file.type || 'application/octet-stream';
        let key = u.key;
        if (!key) {
          const res = await fetch(`${API}/v1/leads/uploads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: u.file.name, contentType: type, size: u.file.size }),
          });
          if (!res.ok) throw new Error('upload');
          const presigned = (await res.json()) as { key: string; url: string };
          await put(presigned.url, u.file, (p) => setUploads((all) => all.map((x, j) => (j === i ? { ...x, progress: p } : x))));
          key = presigned.key;
          setUploads((all) => all.map((x, j) => (j === i ? { ...x, key, progress: 1 } : x)));
        }
        attachments.push({ key, filename: u.file.name, contentType: type, size: u.file.size });
      }
      const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')));
      const res = await fetch(`${API}/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...f,
          budgetUnsure: f.budgetRange === 'unsure',
          locale,
          timezone: tz,
          attachments,
          turnstileToken: token,
          source: document.referrer || null,
          utm,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setReference(((await res.json()) as { reference: string }).reference);
      setStatus('done');
      window.umami?.track('lead_submitted', { country: f.country, type: f.projectType });
      window.scrollTo({ top: 0 });
    } catch {
      setStatus('error');
    }
  };

  if (!API) return <p className="rounded-md border border-line bg-surface p-6 text-ink-2">{t('offline')}</p>;

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-line bg-surface p-8" role="status">
        <Icon name="check" size={32} className="text-accent" />
        <h2 className="mt-4 text-display-sm">{t('success.title')}</h2>
        <p className="mt-3 text-ink-2">{t('success.body', { reference })}</p>
        <button type="button" className="btn-secondary mt-8" onClick={() => location.reload()}>
          {t('success.again')}
        </button>
      </div>
    );
  }

  const input = (k: string) =>
    `mt-1.5 h-12 w-full rounded-md border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${
      errors[k] ? 'border-[#B42318]' : 'border-line-2'
    }`;
  const a = (k: string) => ({ id: `f-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `f-${k}-err` : undefined });
  const section = 'border-t border-line pt-8';
  const legend = 'mb-6 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-3';

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-10">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} className="hidden" aria-hidden />

      <fieldset className={section}>
        <legend className={legend}>{t('sections.you')}</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="f-name" label={`${t('fields.name')} *`} error={errors.name}>
            <input {...a('name')} className={input('name')} autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field id="f-company" label={`${t('fields.company')} *`} error={errors.company}>
            <input {...a('company')} className={input('company')} autoComplete="organization" value={f.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <Field id="f-jobTitle" label={t('fields.jobTitle')}>
            <input {...a('jobTitle')} className={input('jobTitle')} autoComplete="organization-title" value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </Field>
          <Field id="f-country" label={`${t('fields.country')} *`} error={errors.country}>
            <select
              {...a('country')}
              className={input('country')}
              autoComplete="country"
              value={f.country}
              onChange={(e) => {
                set('country', e.target.value);
                set('budgetCurrency', currencyFor(e.target.value));
              }}
            >
              {countries.map(({ c, n }) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-email" label={`${t('fields.email')} *`} error={errors.email}>
            <input {...a('email')} type="email" className={input('email')} autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field id="f-phone" label={t('fields.phone')}>
            <input {...a('phone')} type="tel" className={input('phone')} autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>{t('sections.project')}</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="f-projectType" label={t('fields.projectType')}>
            <select {...a('projectType')} className={input('projectType')} value={f.projectType} onChange={(e) => set('projectType', e.target.value)}>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
              <option value="other">{t('fields.other')}</option>
            </select>
          </Field>
          <Field id="f-timeline" label={t('fields.timeline')}>
            <select {...a('timeline')} className={input('timeline')} value={f.timeline} onChange={(e) => set('timeline', e.target.value)}>
              {TIMELINES.map((k) => (
                <option key={k} value={k}>
                  {t(`timelines.${k}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-budgetRange" label={t('fields.budget')}>
            <select {...a('budgetRange')} className={input('budgetRange')} value={f.budgetRange} onChange={(e) => set('budgetRange', e.target.value)}>
              {BUDGETS.map((k) => (
                <option key={k} value={k}>
                  {budgetLabel(k)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-budgetCurrency" label={t('fields.currency')}>
            <select {...a('budgetCurrency')} className={input('budgetCurrency')} value={f.budgetCurrency} onChange={(e) => set('budgetCurrency', e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-description" label={`${t('fields.description')} *`} error={errors.description} hint={t('fields.descriptionHint')} className="sm:col-span-2">
            <textarea
              {...a('description')}
              rows={6}
              className={`${input('description')} h-auto py-3`}
              value={f.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>{t('sections.files')}</legend>
        <div>
          <p className="text-[14px] font-medium">{t('fields.files')}</p>
          <label
            className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-line-2 bg-surface px-6 py-8 text-center transition-colors hover:border-accent"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <Icon name="upload" size={24} className="text-ink-3" />
            <span className="text-[15px] font-medium text-accent">{t('fields.browse')}</span>
            <span className="text-[13px] text-ink-3">{t('fields.filesHint')}</span>
            <input type="file" multiple className="sr-only" accept=".step,.stp,.iges,.igs,.stl,.dxf,.dwg,.pdf,.zip,.png,.jpg,.jpeg,.webp" onChange={(e) => addFiles(e.target.files)} />
          </label>
          {errors.files && <p className="mt-1.5 text-[13px] text-[#B42318]">{errors.files}</p>}
          {uploads.length > 0 && (
            <ul className="mt-3 space-y-2">
              {uploads.map((u, i) => (
                <li key={`${u.file.name}-${i}`} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-[14px]">
                  <Icon name="file" size={16} className="text-ink-3" />
                  <span className="flex-1 truncate">{u.file.name}</span>
                  <span className="spec text-ink-3">{(u.file.size / 1048576).toFixed(1)} MB</span>
                  <span className="h-1 w-14 overflow-hidden rounded bg-line">
                    <span className="block h-full bg-accent transition-all" style={{ width: `${u.progress * 100}%` }} />
                  </span>
                  <button type="button" aria-label="Remove" onClick={() => setUploads((all) => all.filter((_, j) => j !== i))} className="text-ink-3 hover:text-ink">
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <p className="text-[14px] font-medium">{t('fields.call')}</p>
          <p className="mt-1 text-[13px] text-ink-3">{t('fields.callHint', { tz })}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slotDays.map(([day, list]) => (
              <div key={day} className="rounded-md border border-line bg-surface p-3">
                <p className="text-[13px] font-medium capitalize">{day}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {list.map((s) => {
                    const iso = s.toISOString();
                    const on = f.preferredCallAt === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set('preferredCallAt', on ? null : iso)}
                        className={`spec rounded px-2 py-1 transition-colors ${on ? 'bg-accent text-white' : 'bg-bg text-ink-2 hover:bg-line'}`}
                      >
                        {time.format(s)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-[14px] text-ink-2">
            <input type="radio" checked={!f.preferredCallAt} onChange={() => set('preferredCallAt', null)} className="accent-[rgb(var(--accent))]" />
            {t('fields.noCall')}
          </label>
        </div>
      </fieldset>

      <div className="border-t border-line pt-8">
        <label className="flex items-start gap-3 text-[14px] text-ink-2">
          <input type="checkbox" {...a('consent')} checked={f.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
          <span>
            {t('fields.consent')}
            {errors.consent && (
              <span id="f-consent-err" className="mt-1 block text-[13px] text-[#B42318]">
                {errors.consent}
              </span>
            )}
          </span>
        </label>
        <div className="mt-6">
          <Turnstile siteKey={TURNSTILE} locale={locale} onToken={setToken} />
          {errors.captcha && <p className="mt-1.5 text-[13px] text-[#B42318]">{errors.captcha}</p>}
        </div>
        {status === 'error' && (
          <p role="alert" className="mt-6 rounded-md border border-[#B42318]/30 bg-[#FEF3F2] p-4 text-[14px] text-[#B42318]">
            {t('errors.server')}
          </p>
        )}
        <button type="submit" disabled={status === 'sending'} className="btn-primary mt-8 w-full sm:w-auto">
          {status === 'sending' ? t('sending') : t('submit')}
          {status !== 'sending' && <Icon name="arrow" size={18} />}
        </button>
      </div>
    </form>
  );
}
