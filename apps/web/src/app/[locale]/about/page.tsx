import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Cta } from '@/components/home/Cta';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { getFacilityPhotos, getTeam } from '@/lib/content';
import { TEAM_PHOTO } from '@/lib/photo-briefs';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return pageMeta({ locale, path: '/about', title: t('title'), description: t('lead') });
}

const INTL_ICONS = ['globe', 'boxes', 'bolt', 'shield'];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, team] = await Promise.all([getTranslations('about'), getTeam(locale)]);
  const photos = t.raw('facilitiesPhotos') as string[];
  const facility = getFacilityPhotos();
  const intl = t.raw('international.items') as { t: string; b: string }[];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <section className="frame section grid-12 gap-y-6">
        <h2 className="eyebrow col-span-4 sm:col-span-8 lg:col-span-3">{t('mission')}</h2>
        <p className="reveal col-span-4 text-display-sm !font-medium leading-snug sm:col-span-8 lg:col-span-8">{t('missionBody')}</p>
      </section>

      <section className="border-t border-line">
        <div className="frame section">
          <h2 className="text-display-md">{t('team')}</h2>
          <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <li key={m.name} className="reveal" style={{ ['--d' as string]: `${(i % 4) * 60}ms` }}>
                <Media src={m.photo} alt={m.name} label={TEAM_PHOTO(m.name)} ratio="4/5" sizes="(min-width:1024px) 25vw, 50vw" />
                <p className="mt-4 font-semibold">{m.name}</p>
                <p className="text-[14px] text-ink-3">{m.role}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{m.bio}</p>
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="link mt-3 text-[14px]">
                    <Icon name="linkedin" size={16} /> LinkedIn
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="frame section">
          <div className="grid-12 gap-y-6">
            <h2 className="col-span-4 text-display-md sm:col-span-8 lg:col-span-5">{t('facilities')}</h2>
            <p className="col-span-4 text-lead text-ink-2 sm:col-span-8 lg:col-span-6 lg:col-start-7">{t('facilitiesBody')}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="reveal-mask md:col-span-2 md:row-span-2">
              <Media src={facility[0]} alt={photos[0]} label={photos[0]} ratio="4/3" sizes="(min-width:768px) 66vw, 100vw" />
            </div>
            <div className="reveal-mask" style={{ ['--d' as string]: '80ms' }}>
              <Media src={facility[1]} alt={photos[1]} label={photos[1]} ratio="4/3" sizes="(min-width:768px) 33vw, 100vw" />
            </div>
            <div className="reveal-mask" style={{ ['--d' as string]: '160ms' }}>
              <Media src={facility[2]} alt={photos[2]} label={photos[2]} ratio="4/3" sizes="(min-width:768px) 33vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="on-dark bg-graphite text-on-graphite">
        <div className="frame section">
          <h2 className="max-w-3xl text-display-md text-white">{t('international.title')}</h2>
          <ul className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {intl.map((it, i) => (
              <li key={it.t} className="reveal border-t border-white/15 pt-6" style={{ ['--d' as string]: `${i * 60}ms` }}>
                <Icon name={INTL_ICONS[i]} size={24} className="text-accent-dark" />
                <h3 className="mt-5 text-lg font-semibold text-white">{it.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-on-graphite-2">{it.b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Cta />
    </>
  );
}
