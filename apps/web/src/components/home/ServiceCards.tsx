import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SERVICE_PHOTOS } from '@/lib/photo-briefs';
import type { Service } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Media } from '../ui/Media';
import { SectionHeader } from '../ui/SectionHeader';

export async function ServiceCards({ services }: { services: Service[] }) {
  const t = await getTranslations();
  return (
    <section className="section" aria-labelledby="services-title">
      <div className="frame">
        <SectionHeader id="services-title" eyebrow={t('servicesSection.eyebrow')} title={t('servicesSection.title')} href="/services" linkLabel={t('servicesSection.viewAll')} />
        <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          {services.slice(0, 5).map((s, i) => (
            <li key={s.slug} className={`reveal ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}`} style={{ ['--d' as string]: `${(i % 3) * 60}ms` }}>
              <Link href={`/services/${s.slug}`} className="zoom group block">
                <Media src={s.image} alt={s.title} label={SERVICE_PHOTOS[s.slug] ?? `FOTO — ${s.title}, 4:3`} ratio={i < 3 ? '4/3' : '16/9'} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <span className="spec text-ink-3">{s.code}</span>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">{s.summary}</p>
                  </div>
                  <Icon name="arrow" size={20} className="mt-6 text-ink-3 transition-transform duration-300 ease-precise group-hover:translate-x-1 group-hover:text-accent rtl:rotate-180" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
