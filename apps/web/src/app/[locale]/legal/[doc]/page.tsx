import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { routing } from '@/i18n/routing';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; doc: string }> };
const DOCS = { privacy: 'privacyTitle', terms: 'termsTitle' } as const;
const UPDATED = '2026-10-06';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Object.keys(DOCS).map((doc) => ({ locale, doc })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!(doc in DOCS)) return {};
  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = t(DOCS[doc as keyof typeof DOCS]);
  return pageMeta({ locale, path: `/legal/${doc}`, title, description: title });
}

export default async function LegalPage({ params }: Props) {
  const { locale, doc } = await params;
  if (!(doc in DOCS)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  const paragraphs = t.raw(doc as 'privacy' | 'terms') as string[];
  return (
    <>
      <PageHeader eyebrow={`${t('lastUpdated')}: ${UPDATED}`} title={t(DOCS[doc as keyof typeof DOCS])} />
      <section className="frame section">
        <ol className="max-w-prose space-y-6 text-[17px] leading-relaxed text-ink-2">
          {paragraphs.map((p, i) => (
            <li key={i} className="grid grid-cols-[2.5rem_1fr]">
              <span className="spec pt-1 text-ink-3">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        {process.env.NODE_ENV !== 'production' && <p className="mt-10 text-[13px] text-accent">{t('review')}</p>}
      </section>
    </>
  );
}
