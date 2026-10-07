import '@fontsource-variable/inter/opsz.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MobileCta } from '@/components/layout/MobileCta';
import { JsonLd } from '@/components/ui/JsonLd';
import { RevealObserver } from '@/components/ui/RevealObserver';
import { CONSENT_FLAG, JS_FLAG } from '@/lib/inline-scripts';
import { isRtl, routing } from '@/i18n/routing';
import { getServices, usingSeed } from '@/lib/content';
import { alternates, organizationSchema, SITE_URL } from '@/lib/seo';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: '#FAFAF8', colorScheme: 'light', width: 'device-width', initialScale: 1 };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: '%s · Velkin' },
    description: t('description'),
    alternates: alternates(locale, ''),
    openGraph: { siteName: 'Velkin', locale, type: 'website', title: t('title'), description: t('description') },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/icon.svg' },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [services, t] = await Promise.all([getServices(locale), getTranslations('common')]);

  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${JS_FLAG};${CONSENT_FLAG}` }} />
      </head>
      <body className="bg-bg text-ink">
        <NextIntlClientProvider>
          <CookieConsent />
          <Header />
          {usingSeed && process.env.NODE_ENV !== 'production' && (
            <div className="fixed bottom-3 end-3 z-[70] max-w-xs rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-3 shadow-sm">
              {t('demo')}
            </div>
          )}
          <main id="main">{children}</main>
          <Footer services={services} />
          <MobileCta />
          <RevealObserver />
        </NextIntlClientProvider>
        <JsonLd data={organizationSchema()} />
      </body>
    </html>
  );
}
