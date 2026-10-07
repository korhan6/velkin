'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { CONSENT_COOKIE as NAME } from '@/lib/inline-scripts';

/**
 * Opt-in consent for every jurisdiction (strictest common denominator: GDPR/ePrivacy, UK, LGPD, CCPA/CPRA).
 * Global Privacy Control is honoured automatically. Analytics (Umami, cookieless) load only after opt-in.
 */
type Consent = { v: 1; analytics: boolean; ts: string };

function read(): Consent | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${NAME}=([^;]*)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as Consent;
  } catch {
    return null;
  }
}
function write(c: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}
function loadAnalytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_URL;
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !id || document.getElementById('vk-umami')) return;
  const s = document.createElement('script');
  s.id = 'vk-umami';
  s.defer = true;
  s.src = src;
  s.dataset.websiteId = id;
  s.dataset.doNotTrack = 'true';
  document.head.appendChild(s);
}

export function CookieConsent() {
  const t = useTranslations('cookies');
  const tf = useTranslations('footer');
  const [open, setOpen] = useState(true);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const g = navigator.globalPrivacyControl === true;
    setGpc(g);
    const c = read();
    if (c) {
      setAnalytics(c.analytics);
      if (c.analytics && !g) loadAnalytics();
      setOpen(false);
    } else if (g) {
      write({ v: 1, analytics: false, ts: new Date().toISOString() });
      setOpen(false);
    }
    const reopen = () => {
      document.documentElement.classList.remove('vk-consented');
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener('velkin:consent-open', reopen);
    return () => window.removeEventListener('velkin:consent-open', reopen);
  }, []);

  const save = (a: boolean) => {
    const allowed = a && !gpc;
    write({ v: 1, analytics: allowed, ts: new Date().toISOString() });
    setAnalytics(allowed);
    setOpen(false);
    if (allowed) loadAnalytics();
    else document.getElementById('vk-umami')?.remove();
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="vk-consent-title"
      className="consent-banner fixed bottom-4 end-4 start-4 z-[80] max-w-md rounded-lg border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:end-auto"
    >
      <p id="vk-consent-title" className="text-[15px] font-semibold">
        {t('title')}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
        {t('body')}{' '}
        <Link href="/legal/privacy" className="link">
          {tf('privacy')}
        </Link>
      </p>
      {gpc && <p className="mt-3 text-[13px] text-accent">{t('gpc')}</p>}
      {custom && (
        <div className="mt-5 space-y-4 border-t border-line pt-5 text-[14px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{t('necessary')}</p>
              <p className="text-ink-3">{t('necessaryBody')}</p>
            </div>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" aria-label={t('necessary')} />
          </div>
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block font-medium">{t('analytics')}</span>
              <span className="block text-ink-3">{t('analyticsBody')}</span>
            </span>
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" checked={analytics} disabled={gpc} onChange={(e) => setAnalytics(e.target.checked)} />
          </label>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        {custom ? (
          <button type="button" className="btn-primary !h-10" onClick={() => save(analytics)}>
            {t('save')}
          </button>
        ) : (
          <>
            <button type="button" className="btn-primary !h-10" onClick={() => save(true)}>
              {t('accept')}
            </button>
            <button type="button" className="btn-secondary !h-10" onClick={() => save(false)}>
              {t('reject')}
            </button>
            <button type="button" className="px-2 text-[14px] text-ink-2 underline-offset-4 hover:underline" onClick={() => setCustom(true)}>
              {t('customize')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
