import { LogoMark, Wordmark } from '@velkin/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Service } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { CookieSettingsButton } from './FooterButtons';
import { LocaleSwitcher } from './LocaleSwitcher';

export async function Footer({ services }: { services: Service[] }) {
  const t = await getTranslations();
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@velkin.com';
  const linkedin = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/company/velkin';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const col = 'space-y-3 text-[15px] text-on-graphite-2';
  const head = 'mb-5 text-[13px] font-medium uppercase tracking-[0.08em] text-on-graphite';

  return (
    <footer className="on-dark bg-graphite pb-10 pt-20 text-on-graphite">
      <div className="frame">
        <div className="grid-12 gap-y-12">
          <div className="col-span-4 sm:col-span-8 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3" aria-label="Velkin">
              <LogoMark className="h-9 w-9" title="" />
              <Wordmark className="h-[14px] w-auto" title="" />
            </Link>
            <p className="mt-6 max-w-[36ch] text-[15px] text-on-graphite-2">{t('footer.about')}</p>
            <div className="mt-6 flex items-center gap-3">
              <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 hover:border-white">
                <Icon name="linkedin" size={18} />
              </a>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <p className={head}>{t('nav.services')}</p>
            <ul className={col}>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="hover:text-on-graphite">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <p className={head}>{t('footer.company')}</p>
            <ul className={col}>
              <li><Link href="/about" className="hover:text-on-graphite">{t('nav.about')}</Link></li>
              <li><Link href="/industries" className="hover:text-on-graphite">{t('nav.industries')}</Link></li>
              <li><Link href="/projects" className="hover:text-on-graphite">{t('nav.projects')}</Link></li>
              <li><Link href="/resources" className="hover:text-on-graphite">{t('nav.resources')}</Link></li>
            </ul>
          </div>
          <div className="col-span-4 sm:col-span-2 lg:col-span-3">
            <p className={head}>{t('footer.contact')}</p>
            <ul className={col}>
              <li><a href={`mailto:${email}`} className="hover:text-on-graphite">{email}</a></li>
              {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="hover:text-on-graphite">WhatsApp +{wa}</a></li>}
              <li><a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-on-graphite">LinkedIn</a></li>
              <li><Link href="/contact" className="hover:text-on-graphite">{t('cta.primary')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-8 text-[13px] text-on-graphite-2 lg:flex-row lg:items-center lg:justify-between">
          <span>© {new Date().getUTCFullYear()} Velkin. {t('footer.rights')}</span>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/legal/privacy" className="hover:text-on-graphite">{t('footer.privacy')}</Link></li>
            <li><Link href="/legal/terms" className="hover:text-on-graphite">{t('footer.terms')}</Link></li>
            <li><CookieSettingsButton label={t('footer.cookies')} /></li>
            <li><CookieSettingsButton label={t('footer.doNotSell')} /></li>
          </ul>
          <LocaleSwitcher dark />
        </div>
      </div>
    </footer>
  );
}
