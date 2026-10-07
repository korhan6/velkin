import { Link } from '@/i18n/navigation';
import { countryName } from '@/lib/geo';
import { PROJECT_PHOTO } from '@/lib/photo-briefs';
import type { Project } from '@/lib/types';
import { Icon } from './ui/Icon';
import { Media } from './ui/Media';

export function ProjectCard({ project, locale, industryLabel }: { project: Project; locale: string; industryLabel: string }) {
  const metric = project.metrics[0];
  return (
    <Link href={`/projects/${project.slug}`} className="zoom group block">
      <Media src={project.heroImage} alt={project.title} label={PROJECT_PHOTO(project.title)} ratio="3/2" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
      <p className="mt-5 text-[13px] text-ink-3">
        {industryLabel} · {countryName(project.countryCode, locale)}
        {project.year ? ` · ${project.year}` : ''}
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{project.title}</h3>
      {metric && (
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-accent">{metric.value}</span>
          <span className="text-[14px] text-ink-2">{metric.label}</span>
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink-2 group-hover:text-accent">
        <Icon name="arrow" size={16} className="transition-transform duration-300 ease-precise group-hover:translate-x-1 rtl:rotate-180" />
      </span>
    </Link>
  );
}
