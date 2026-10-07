import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cta } from '@/components/home/Cta';
import { ProjectCard } from '@/components/ProjectCard';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { Media } from '@/components/ui/Media';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getIndustries, getProject, getProjects, getServices, getTestimonials } from '@/lib/content';
import { countryName } from '@/lib/geo';
import { PROJECT_PHOTO } from '@/lib/photo-briefs';
import { pageMeta, SITE_URL } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(routing.locales.map(async (locale) => (await getProjects(locale)).map((p) => ({ locale, slug: p.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProject(locale, slug);
  if (!p) return {};
  return pageMeta({ locale, path: `/projects/${slug}`, title: p.title, description: p.summary, type: 'article' });
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, tf, project, all, industries, services, testimonials] = await Promise.all([
    getTranslations('projectsPage'),
    getTranslations('featured'),
    getProject(locale, slug),
    getProjects(locale),
    getIndustries(locale),
    getServices(locale),
    getTestimonials(locale),
  ]);
  if (!project) notFound();
  const industry = industries.find((i) => i.slug === project.industry);
  const quote = testimonials.find((q) => q.projectSlug === slug);
  const related = all.filter((p) => p.slug !== slug && (p.industry === project.industry || p.services.some((s) => project.services.includes(s)))).slice(0, 3);
  const meta: [string, string][] = [
    [t('client'), project.client || tf('confidential')],
    [t('country'), countryName(project.countryCode, locale)],
    [t('year'), project.year ? String(project.year) : '—'],
  ];

  return (
    <article>
      <header className="pt-[calc(var(--header-h)+56px)] md:pt-[calc(var(--header-h)+80px)]">
        <div className="frame">
          <Link href="/projects" className="link text-[14px]">
            <Icon name="arrow" size={14} className="rotate-180 rtl:rotate-0" />
            {t('all_cases')}
          </Link>
          <div className="grid-12 mt-8 gap-y-8">
            <div className="col-span-4 sm:col-span-8 lg:col-span-8">
              <p className="eyebrow">{industry?.title ?? project.industry}</p>
              <h1 className="mt-4 text-display-lg">{project.title}</h1>
              <p className="mt-6 max-w-[60ch] text-lead text-ink-2">{project.summary}</p>
            </div>
            <dl className="col-span-4 self-end text-[14px] sm:col-span-8 lg:col-span-3 lg:col-start-10">
              {meta.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-3">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-end font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-12">
            {project.videoUrl ? (
              <video src={project.videoUrl} poster={project.heroImage ?? undefined} autoPlay muted loop playsInline className="aspect-video w-full rounded-md object-cover" />
            ) : (
              <Media src={project.heroImage} alt={project.title} label={PROJECT_PHOTO(project.title)} ratio="16/9" priority sizes="100vw" />
            )}
          </div>
        </div>
      </header>

      {project.metrics.length > 0 && (
        <section className="border-b border-line py-14" aria-label={t('results')}>
          <dl className="frame grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {project.metrics.map((m) => (
              <div key={m.label} className="flex flex-col border-s border-line ps-6">
                <dt className="order-2 mt-2 text-[15px] text-ink-2">{m.label}</dt>
                <dd className="order-1 text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none tracking-tight text-accent">{m.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="frame section grid-12 gap-y-14">
        <div className="col-span-4 space-y-14 sm:col-span-8 lg:col-span-7">
          {(['problem', 'solution', 'results'] as const).map((k) => (
            <div key={k} className="reveal">
              <h2 className="eyebrow">{t(k === 'problem' ? 'challenge' : k)}</h2>
              <p className="mt-4 text-[1.25rem] leading-relaxed text-ink">{project[k]}</p>
            </div>
          ))}
        </div>
        <aside className="col-span-4 sm:col-span-8 lg:col-span-4 lg:col-start-9">
          <h2 className="eyebrow">{t('specs')}</h2>
          <table className="mt-4 w-full">
            <tbody>
              {project.specs.map((s) => (
                <tr key={s.label} className="border-b border-line">
                  <th scope="row" className="spec py-3 pe-4 text-start font-normal text-ink-3">
                    {s.label}
                  </th>
                  <td className="spec py-3 text-end text-ink">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-8 text-[14px] text-ink-3">
            {project.services
              .map((s) => services.find((x) => x.slug === s))
              .filter(Boolean)
              .map((s, i) => (
                <span key={s!.slug}>
                  {i > 0 && ' · '}
                  <Link href={`/services/${s!.slug}`} className="link">
                    {s!.title}
                  </Link>
                </span>
              ))}
          </p>
        </aside>
      </section>

      {project.gallery.length > 0 && (
        <section className="frame pb-24" aria-label={t('gallery')}>
          <h2 className="eyebrow">{t('gallery')}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {project.gallery.map((src, i) => (
              <Media key={src} src={src} alt={`${project.title} — ${i + 1}`} label="" ratio="3/2" sizes="(min-width:768px) 50vw, 100vw" />
            ))}
          </div>
        </section>
      )}

      {quote && (
        <section className="border-y border-line bg-surface py-20">
          <figure className="frame max-w-4xl">
            <blockquote className="text-display-sm !font-medium leading-snug">“{quote.quote}”</blockquote>
            <figcaption className="mt-8 text-[15px]">
              <span className="font-semibold">{quote.authorName}</span>
              <span className="text-ink-3">
                {' '}
                — {quote.authorRole}, {quote.company}
              </span>
            </figcaption>
          </figure>
        </section>
      )}

      {related.length > 0 && (
        <section className="frame section" aria-labelledby="related-title">
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
          '@type': 'Article',
          headline: project.title,
          description: project.summary,
          inLanguage: locale,
          author: { '@type': 'Organization', name: 'Velkin', url: SITE_URL },
          publisher: { '@type': 'Organization', name: 'Velkin', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` } },
          mainEntityOfPage: `${SITE_URL}/${locale}/projects/${slug}`,
          ...(project.heroImage ? { image: project.heroImage } : {}),
        }}
      />
    </article>
  );
}
