'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { Icon } from '../ui/Icon';

export function LocaleSwitcher({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  return (
    <label className={`relative inline-flex items-center gap-1.5 text-[14px] ${dark ? 'text-on-graphite-2' : 'text-ink-2'} ${className}`}>
      <Icon name="globe" size={16} />
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => start(() => router.replace(pathname, { locale: e.target.value }))}
        className={`cursor-pointer appearance-none bg-transparent py-1 pe-1 font-medium focus:outline-none ${dark ? 'text-on-graphite' : 'text-ink'}`}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-surface text-ink">
            {LOCALE_LABELS[l] ?? l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
