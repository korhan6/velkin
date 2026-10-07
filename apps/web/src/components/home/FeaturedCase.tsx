import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { countryName } from '@/lib/geo';
import { PROJECT_PHOTO } from '@/lib/photo-briefs';
import type { Project } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Media } from '../ui/Media';

export async function FeaturedCase({ project }: { project: Project }) {
  const t = await getTranslations();
  const locale = await getLocale();
  return (
    <section className="section border-t border-line" aria-labelledby="featured-title">
      <div className="frame grid-12 items-center gap-y-12">
        <div className="reveal-mask col-span-4 sm:col-span-8 lg:col-span-7">
          <Link href={`/projects/${project.slug}`} className="zoom block" tabIndex={-1} aria-hidden>
            <Media src={project.heroImage} alt={project.title} label={PROJECT_PHOTO(project.title)} ratio="16/10" sizes="(min-width:1024px) 58vw, 100vw" />
          </Link>
        </div>
        <div className="col-span-4 sm:col-span-8 lg:col-span-5 lg:ps-6">
          <p className="eyebrow reveal">{t('featured.eyebrow')}</p>
          <h2 id="featured-title" className="reveal mt-4 text-display-sm" style={{ ['--d' as string]: '60ms' }}>
            {project.title}
          </h2>
          <p className="reveal mt-3 text-[14px] text-ink-3" style={{ ['--d' as string]: '90ms' }}>
            {project.client || t('featured.confidential')} · {countryName(project.countryCode, locale)} · {project.year}
          </p>
          <p className="reveal mt-5 text-[16px] leading-relaxed text-ink-2" style={{ ['--d' as string]: '120ms' }}>
            {project.summary}
          </p>
          {project.metrics.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-3">
              {project.metrics.slice(0, 3).map((m, i) => (
                <div key={m.label} className="reveal" style={{ ['--d' as string]: `${150 + i * 60}ms` }}>
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="text-[2.25rem] font-semibold leading-none tracking-tight text-accent">{m.value}</dd>
                  <dd className="mt-2 text-[14px] text-ink-2">{m.label}</dd>
                </div>
              ))}
            </dl>
          )}
          <Link href={`/projects/${project.slug}`} className="link mt-10">
            {t('featured.viewCase')}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
