import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { Icon } from './Icon';

export function SectionHeader({
  eyebrow,
  title,
  lead,
  href,
  linkLabel,
  id,
  className = '',
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`grid-12 items-end gap-y-6 ${className}`}>
      <div className="col-span-4 sm:col-span-8 lg:col-span-8">
        <p className="eyebrow reveal">{eyebrow}</p>
        <h2 id={id} className="reveal mt-4 text-display-md" style={{ ['--d' as string]: '60ms' }}>
          {title}
        </h2>
        {lead && (
          <p className="reveal mt-5 max-w-[60ch] text-lead text-ink-2" style={{ ['--d' as string]: '120ms' }}>
            {lead}
          </p>
        )}
      </div>
      {href && linkLabel && (
        <div className="col-span-4 sm:col-span-8 lg:col-span-4 lg:text-end">
          <Link href={href} className="link">
            {linkLabel}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
