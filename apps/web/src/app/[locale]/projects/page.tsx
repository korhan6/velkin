import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cta } from '@/components/home/Cta';
import { ProjectFilters } from '@/components/ProjectFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import { getIndustries, getProjects, getServices } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projectsPage' });
  return pageMeta({ locale, path: '/projects', title: t('title'), description: t('lead') });
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, projects, industries, services] = await Promise.all([
    getTranslations('projectsPage'),
    getProjects(locale),
    getIndustries(locale),
    getServices(locale),
  ]);
  return (
    <>
      <PageHeader eyebrow={t('title')} title={t('title')} lead={t('lead')} />
      <section className="frame section">
        <ProjectFilters
          projects={projects}
          industries={Object.fromEntries(industries.map((i) => [i.slug, i.title]))}
          services={Object.fromEntries(services.map((s) => [s.slug, s.title]))}
        />
      </section>
      <Cta />
    </>
  );
}
