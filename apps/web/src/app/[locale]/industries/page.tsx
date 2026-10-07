import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cta } from '@/components/home/Cta';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { getIndustries } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'industriesPage' });
  return pageMeta({ locale, path: '/industries', title: t('title'), description: t('lead') });
}

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, industries] = await Promise.all([getTranslations('industriesPage'), getIndustries(locale)]);
  return (
    <>
      <PageHeader eyebrow={t('title')} title={t('title')} lead={t('lead')} />
      <section className="frame section">
        <ul className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          {industries.map((ind, i) => (
            <li key={ind.slug} className="reveal" style={{ ['--d' as string]: `${(i % 2) * 60}ms` }}>
              <Link href={`/industries/${ind.slug}`} className="card group flex h-full flex-col p-8 transition-colors duration-300 hover:border-ink">
                <div className="flex items-start justify-between">
                  <Icon name={ind.icon} size={32} className="text-ink-2 group-hover:text-accent" />
                  <Icon name="arrow" size={20} className="text-ink-3 transition-transform duration-300 ease-precise group-hover:translate-x-1 rtl:rotate-180" />
                </div>
                <h2 className="mt-10 text-xl font-semibold">{ind.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{ind.summary}</p>
                <ul className="mt-6 space-y-1.5 border-t border-line pt-5 text-[14px] text-ink-3">
                  {ind.problems.slice(0, 3).map((p) => (
                    <li key={p}>— {p}</li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Cta />
    </>
  );
}
