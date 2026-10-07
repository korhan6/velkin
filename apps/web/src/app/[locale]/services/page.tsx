import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cta } from '@/components/home/Cta';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { getServices } from '@/lib/content';
import { SERVICE_PHOTOS } from '@/lib/photo-briefs';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'servicesPage' });
  return pageMeta({ locale, path: '/services', title: t('title'), description: t('lead') });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, services] = await Promise.all([getTranslations('servicesPage'), getTranslations('common'), getServices(locale)]);
  return (
    <>
      <PageHeader eyebrow={t('title')} title={t('title')} lead={t('lead')} />
      <section className="frame section">
        <ul className="space-y-20 md:space-y-28">
          {services.map((s, i) => (
            <li key={s.slug} className="grid-12 items-center gap-y-8">
              <div className={`reveal-mask col-span-4 sm:col-span-8 lg:col-span-6 ${i % 2 ? 'lg:order-2 lg:col-start-7' : ''}`}>
                <Link href={`/services/${s.slug}`} className="zoom block" tabIndex={-1} aria-hidden>
                  <Media src={s.image} alt={s.title} label={SERVICE_PHOTOS[s.slug] ?? `FOTO — ${s.title}`} ratio="3/2" sizes="(min-width:1024px) 50vw, 100vw" />
                </Link>
              </div>
              <div className={`col-span-4 sm:col-span-8 lg:col-span-5 ${i % 2 ? 'lg:order-1' : 'lg:col-start-8'}`}>
                <span className="spec text-ink-3">{s.code}</span>
                <h2 className="mt-2 text-display-sm">{s.title}</h2>
                <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{s.summary}</p>
                <ul className="mt-6 space-y-2 text-[15px] text-ink-2">
                  {s.capabilities.slice(0, 4).map((c) => (
                    <li key={c} className="flex gap-3">
                      <Icon name="check" size={18} className="mt-0.5 text-accent" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Link href={`/services/${s.slug}`} className="link mt-8">
                  {tc('learnMore')}
                  <Icon name="arrow" size={16} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Cta />
    </>
  );
}
