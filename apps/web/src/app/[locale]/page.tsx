import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cta } from '@/components/home/Cta';
import { Exploded } from '@/components/home/Exploded';
import { FeaturedCase } from '@/components/home/FeaturedCase';
import { Hero } from '@/components/home/Hero';
import { IndustryGrid } from '@/components/home/IndustryGrid';
import { Positioning } from '@/components/home/Positioning';
import { ProcessTimeline } from '@/components/home/ProcessTimeline';
import { ServiceCards } from '@/components/home/ServiceCards';
import { Stats } from '@/components/home/Stats';
import { ClientLogos, Standards, Testimonials } from '@/components/home/Trust';
import {
  getCertifications,
  getClients,
  getHeroMedia,
  getIndustries,
  getProjects,
  getServices,
  getStats,
  getTestimonials,
} from '@/lib/content';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { ...pageMeta({ locale, path: '', title: t('title'), description: t('description') }), title: { absolute: t('title') } };
}

const LAYERS = ['structure', 'actuation', 'electronics', 'software'] as const;

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, hero, services, industries, projects, stats, clients, testimonials, certifications] = await Promise.all([
    getTranslations(),
    getHeroMedia(locale),
    getServices(locale),
    getIndustries(locale),
    getProjects(locale),
    getStats(locale),
    getClients(locale),
    getTestimonials(locale),
    getCertifications(locale),
  ]);
  const featured = projects.find((p) => p.featured) ?? projects[0];

  return (
    <>
      <Hero media={hero} />
      <Positioning />
      <ServiceCards services={services} />
      <IndustryGrid industries={industries} />
      {featured && <FeaturedCase project={featured} />}
      <Exploded
        eyebrow={t('build.eyebrow')}
        title={t('build.title')}
        lead={t('build.lead')}
        layers={LAYERS.map((k) => ({ key: k, title: t(`build.layers.${k}.title`), body: t(`build.layers.${k}.body`), spec: t(`build.layers.${k}.spec`) }))}
      />
      <ProcessTimeline />
      <Stats
        eyebrow={t('stats.eyebrow')}
        items={[
          { label: t('stats.projects'), value: stats.projects },
          { label: t('stats.countries'), value: stats.countries },
          { label: t('stats.years'), value: stats.years, suffix: '+' },
          { label: t('stats.robots'), value: stats.robots },
        ]}
      />
      <ClientLogos clients={clients} />
      <Testimonials items={testimonials} />
      <Standards certifications={certifications} />
      <Cta />
    </>
  );
}
