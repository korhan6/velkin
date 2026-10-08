import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cta } from '@/components/home/Cta';
import { ProjectCard } from '@/components/ProjectCard';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getIndustries, getProjects, getService, getServices } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { SERVICE_PHOTOS } from '@/lib/photo-briefs';
import { pageMeta, SITE_URL } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(routing.locales.map(async (locale) => (await getServices(locale)).map((s) => ({ locale, slug: s.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getService(locale, slug);
  if (!s) return {};
  return pageMeta({ locale, path: `/services/${slug}`, title: s.title, description: s.summary });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, tn, service, projects, industries] = await Promise.all([
    getTranslations('servicesPage'),
    getTranslations('nav'),
    getService(locale, slug),
    getProjects(locale),
    getIndustries(locale),
  ]);
  if (!service) notFound();
  const related = projects.filter((p) => p.services.includes(slug)).slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={`${tn('services')} · ${service.code}`} title={service.title} lead={service.summary}>
        <Link href="/contact" className="btn-primary mt-10">
          {t('start')}
          <Icon name="arrow" size={18} />
        </Link>
      </PageHeader>

      <div className="frame pt-12">
        <Media src={service.image} alt={service.title} label={SERVICE_PHOTOS[slug] ?? `FOTO — ${service.title}`} ratio="21/9" priority sizes="100vw" />
      </div>

      <section className="frame section grid-12 gap-y-14">
        <div className="prose-vk col-span-4 sm:col-span-8 lg:col-span-7">
          <Markdown source={service.body} />
        </div>
        <aside className="col-span-4 space-y-12 sm:col-span-8 lg:col-span-4 lg:col-start-9">
          <div>
            <h2 className="eyebrow">{t('capabilities')}</h2>
            <ul className="mt-4 border-t border-line">
              {service.capabilities.map((c) => (
                <li key={c} className="flex gap-3 border-b border-line py-3 text-[15px]">
                  <Icon name="check" size={18} className="mt-0.5 text-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="eyebrow">{t('deliverables')}</h2>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
              {service.deliverables.map((d) => (
                <li key={d} className="flex gap-3">
                  <Icon name="file" size={18} className="mt-0.5 text-ink-3" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {service.technologies.length > 0 && (
            <div>
              <h2 className="eyebrow">{t('technologies')}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {service.technologies.map((x) => (
                  <li key={x} className="spec rounded border border-line bg-surface px-2.5 py-1 text-ink-2">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="frame pb-24" aria-labelledby="related-title">
          <h2 id="related-title" className="text-display-sm">
            {t('related')}
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} locale={locale} industryLabel={industries.find((i) => i.slug === p.industry)?.title ?? p.industry} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Cta />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.summary,
          serviceType: service.title,
          areaServed: 'Worldwide',
          provider: { '@type': 'Organization', name: 'Velkine', url: SITE_URL },
          url: `${SITE_URL}/${locale}/services/${slug}`,
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: t('capabilities'),
            itemListElement: service.capabilities.map((c) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: c } })),
          },
        }}
      />
    </>
  );
}
