import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { QuoteForm } from '@/components/contact/QuoteForm';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { getServices } from '@/lib/content';
import { COUNTRY_CODES } from '@/lib/geo';
import { pageMeta } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

// Reads CF-IPCountry per request to preselect the visitor's country (they can change it).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return pageMeta({ locale, path: '/contact', title: t('title'), description: t('lead') });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, services, h] = await Promise.all([getTranslations('contact'), getServices(locale), headers()]);
  const geo = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').toUpperCase();
  const defaultCountry = COUNTRY_CODES.includes(geo) ? geo : locale === 'es' ? 'CO' : 'US';
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@velkine.com';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const linkedin = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/company/velkin';

  const direct: { icon: string; label: string; value: string; href: string; external?: boolean }[] = [
    { icon: 'mail', label: t('email'), value: email, href: `mailto:${email}` },
    ...(wa ? [{ icon: 'phone', label: t('whatsapp'), value: `+${wa}`, href: `https://wa.me/${wa}`, external: true }] : []),
    { icon: 'linkedin', label: t('linkedin'), value: 'Velkine', href: linkedin, external: true },
  ];

  return (
    <>
      <PageHeader eyebrow={t('title')} title={t('title')} lead={t('lead')} />
      <section className="frame section grid-12 gap-y-14">
        <div className="col-span-4 sm:col-span-8 lg:col-span-7">
          <QuoteForm services={services.map((s) => ({ slug: s.slug, title: s.title }))} defaultCountry={defaultCountry} />
        </div>
        <aside className="col-span-4 sm:col-span-8 lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)]">
            <h2 className="eyebrow">{t('direct')}</h2>
            <ul className="mt-5 border-t border-line">
              {direct.map((d) => (
                <li key={d.label} className="border-b border-line">
                  <a href={d.href} {...(d.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="group flex items-center gap-4 py-5">
                    <Icon name={d.icon} size={22} className="text-ink-3 group-hover:text-accent" />
                    <span>
                      <span className="block text-[13px] text-ink-3">{d.label}</span>
                      <span className="block font-medium group-hover:text-accent">{d.value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
