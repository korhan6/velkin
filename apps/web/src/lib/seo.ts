import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** canonical + hreflang alternates (incl. x-default) for a path without the locale prefix. */
export function alternates(locale: string, path = ''): Metadata['alternates'] {
  const p = path === '/' ? '' : path;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${p}`;
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${p}`;
  return { canonical: `${SITE_URL}/${locale}${p}`, languages };
}

export function pageMeta(opts: {
  locale: string;
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: alternates(opts.locale, opts.path),
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}/${opts.locale}${opts.path === '/' ? '' : opts.path}`,
      type: opts.type ?? 'website',
      locale: opts.locale,
      siteName: 'Velkine',
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description },
  };
}

export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Velkine',
  slogan: 'Motion Engineered',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@velkine.com',
  areaServed: 'Worldwide',
  knowsAbout: ['Robotics', 'Industrial automation', 'PCB design', 'Embedded firmware', 'ROS 2', 'Artificial intelligence'],
});
