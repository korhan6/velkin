import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cta } from '@/components/home/Cta';
import { ProjectCard } from '@/components/ProjectCard';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { routing } from '@/i18n/routing';
import { getIndustries, getIndustry, getProjects } from '@/lib/content';
import { INDUSTRY_PHOTO } from '@/lib/photo-briefs';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(routing.locales.map(async (locale) => (await getIndustries(locale)).map((s) => ({ locale, slug: s.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getIndustry(locale, slug);
  if (!s) return {};
  return pageMeta({ locale, path: `/industries/${slug}`, title: s.title, description: s.summary });
}

export default async function IndustryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, tn, industry, projects] = await Promise.all([getTranslations('industriesPage'), getTranslations('nav'), getIndustry(locale, slug), getProjects(locale)]);
  if (!industry) notFound();
  const related = projects.filter((p) => p.industry === slug).slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={tn('industries')} title={industry.title} lead={industry.summary} />
      <div className="frame pt-12">
        <Media src={industry.image} alt={industry.title} label={INDUSTRY_PHOTO(industry.title)} ratio="21/9" priority sizes="100vw" />
      </div>
      <section className="frame section">
        <p className="max-w-[60ch] text-lead text-ink-2">{industry.body}</p>
        <div className="mt-14 grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="eyebrow">{t('problems')}</h2>
            <ul className="mt-4 border-t border-line">
              {industry.problems.map((p) => (
                <li key={p} className="border-b border-line py-4 text-[16px]">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="eyebrow">{t('solutions')}</h2>
            <ul className="mt-4 border-t border-line">
              {industry.solutions.map((s) => (
                <li key={s} className="flex gap-3 border-b border-line py-4 text-[16px]">
                  <Icon name="check" size={20} className="mt-0.5 text-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="frame pb-24" aria-labelledby="related-title">
          <h2 id="related-title" className="text-display-sm">
            {t('related')}
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} locale={locale} industryLabel={industry.title} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Cta />
    </>
  );
}
