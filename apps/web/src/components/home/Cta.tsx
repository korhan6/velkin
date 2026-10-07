import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Icon } from '../ui/Icon';

export async function Cta() {
  const t = await getTranslations('cta');
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@velkin.com';
  return (
    <section className="section border-t border-line bg-surface" aria-labelledby="cta-title">
      <div className="frame grid-12 items-end gap-y-10">
        <div className="col-span-4 sm:col-span-8 lg:col-span-8">
          <h2 id="cta-title" className="reveal text-display-lg">
            {t('title')}
          </h2>
          <p className="reveal mt-6 max-w-[54ch] text-lead text-ink-2" style={{ ['--d' as string]: '60ms' }}>
            {t('lead')}
          </p>
        </div>
        <div className="reveal col-span-4 flex flex-wrap gap-3 sm:col-span-8 lg:col-span-4 lg:justify-end" style={{ ['--d' as string]: '120ms' }}>
          <Link href="/contact" className="btn-primary">
            {t('primary')}
            <Icon name="arrow" size={18} />
          </Link>
          <a href={`mailto:${email}`} className="btn-secondary">
            <Icon name="mail" size={18} />
            {t('secondary')}
          </a>
        </div>
      </div>
    </section>
  );
}
