import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Industry } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { SectionHeader } from '../ui/SectionHeader';

export async function IndustryGrid({ industries }: { industries: Industry[] }) {
  const t = await getTranslations('industriesSection');
  return (
    <section className="section border-t border-line" aria-labelledby="ind-title">
      <div className="frame">
        <SectionHeader id="ind-title" eyebrow={t('eyebrow')} title={t('title')} href="/industries" linkLabel={t('viewAll')} />
        <ul className="mt-14 grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((ind, i) => (
            <li key={ind.slug} className="reveal border-b border-e border-line" style={{ ['--d' as string]: `${(i % 4) * 60}ms` }}>
              <Link href={`/industries/${ind.slug}`} className="group flex h-full flex-col p-6 transition-colors duration-300 hover:bg-surface md:p-8">
                <Icon name={ind.icon} size={28} className="text-ink-2 transition-colors group-hover:text-accent" />
                <h3 className="mt-10 text-lg font-semibold">{ind.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{ind.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
