import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { HeroMedia } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { HeroVideo } from './HeroVideo';

/** The H1 is rendered visible immediately (no entrance animation) so it can be the LCP element. */
export async function Hero({ media }: { media: HeroMedia }) {
  const t = await getTranslations('hero');
  return (
    <section className="on-dark relative isolate flex min-h-[100svh] items-end overflow-hidden bg-graphite text-on-graphite md:h-[100svh] md:max-h-[1000px]" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10">
        {media.poster ? (
          <Image src={media.poster} alt="" fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,#2a2a29_0%,#141414_65%)]">
            <p className="absolute end-5 top-[calc(var(--header-h)+20px)] hidden max-w-[34ch] text-end md:block text-[12px] leading-snug text-on-graphite-2 lg:end-12">
              <Icon name="play" size={12} className="me-1 inline -translate-y-px" />
              {t('media')}
            </p>
          </div>
        )}
        <HeroVideo mp4={media.mp4} webm={media.webm} poster={media.poster} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      </div>

      <div className="frame grid-12 pb-16 pt-32 md:pb-24">
        <div className="col-span-4 sm:col-span-8 lg:col-span-9">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 id="hero-title" className="mt-5 text-display-xl text-white">
            {t('title')}
          </h1>
          <p className="reveal mt-6 max-w-[56ch] text-lead text-on-graphite/85" style={{ ['--d' as string]: '80ms' }}>
            {t('lead')}
          </p>
          <div className="reveal mt-10 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '160ms' }}>
            <Link href="/contact" className="btn-primary">
              {t('ctaPrimary')}
              <Icon name="arrow" size={18} />
            </Link>
            <Link href="/projects" className="btn-secondary">
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
