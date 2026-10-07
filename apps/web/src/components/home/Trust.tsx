import Image from 'next/image';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { Certification, ClientLogo, Testimonial } from '@/lib/types';
import { Icon } from '../ui/Icon';

/** Client logos — rendered only when real logos (with permission) exist in the CMS. */
export async function ClientLogos({ clients }: { clients: ClientLogo[] }) {
  if (!clients.length) return null;
  const t = await getTranslations('clients');
  return (
    <section className="border-t border-line py-16" aria-label={t('title')}>
      <div className="frame">
        <p className="eyebrow text-center">{t('title')}</p>
        <ul className="mt-10 grid grid-cols-2 items-center gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {clients.map((c) => (
            <li key={c.name} className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logoUrl} alt={c.name} loading="lazy" className="h-8 w-auto max-w-[140px] object-contain opacity-60 grayscale transition-opacity duration-300 hover:opacity-100" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Testimonials with name, role and company — hidden until real ones exist. */
export async function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  const t = await getTranslations('testimonials');
  return (
    <section className="section border-t border-line" aria-labelledby="testimonials-title">
      <div className="frame">
        <p className="eyebrow reveal">{t('eyebrow')}</p>
        <h2 id="testimonials-title" className="reveal mt-4 text-display-md">
          {t('title')}
        </h2>
        <ul className={`mt-14 grid gap-6 ${items.length > 1 ? 'lg:grid-cols-2' : ''} ${items.length > 2 ? 'xl:grid-cols-3' : ''}`}>
          {items.slice(0, 3).map((q, i) => (
            <li key={q.authorName} className="reveal" style={{ ['--d' as string]: `${i * 60}ms` }}>
              <figure className="card flex h-full flex-col p-8">
              <Icon name="quote" size={28} className="text-accent" />
              <blockquote className="mt-5 flex-1 text-[1.125rem] leading-relaxed text-ink">“{q.quote}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                {q.photo ? (
                  <Image src={q.photo} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-placeholder text-[15px] font-semibold text-ink-3">{q.authorName.slice(0, 1)}</span>
                )}
                <span>
                  <span className="block font-semibold">{q.authorName}</span>
                  <span className="block text-[14px] text-ink-3">
                    {q.authorRole}, {q.company}
                  </span>
                </span>
              </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "We design to" standards (always) + formal certifications (only when obtained). */
export async function Standards({ certifications }: { certifications: Certification[] }) {
  const t = await getTranslations('standards');
  const format = await getFormatter();
  const items = t.raw('items') as { code: string; name: string }[];
  return (
    <section className="section border-t border-line" aria-labelledby="standards-title">
      <div className="frame grid-12 gap-y-12">
        <div className="col-span-4 sm:col-span-8 lg:col-span-4">
          <p className="eyebrow reveal">{t('eyebrow')}</p>
          <h2 id="standards-title" className="reveal mt-4 text-display-sm">
            {t('title')}
          </h2>
          <p className="reveal mt-4 text-[15px] leading-relaxed text-ink-2">{t('lead')}</p>
        </div>
        <div className="col-span-4 sm:col-span-8 lg:col-span-7 lg:col-start-6">
          <ul className="border-t border-line">
            {items.map((s, i) => (
              <li key={s.code} className="reveal grid grid-cols-[8.5rem_1fr] gap-4 border-b border-line py-4" style={{ ['--d' as string]: `${i * 40}ms` }}>
                <span className="spec pt-0.5 font-medium text-ink">{s.code}</span>
                <span className="text-[15px] text-ink-2">{s.name}</span>
              </li>
            ))}
          </ul>
          {certifications.length > 0 && (
            <>
              <p className="eyebrow mt-12">{t('certifications')}</p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {certifications.map((c) => (
                  <li key={c.name} className="card flex items-center gap-4 p-5">
                    {c.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt="" className="h-10 w-10 object-contain" loading="lazy" />
                    )}
                    <span className="min-w-0">
                      <span className="block font-semibold">{c.name}</span>
                      <span className="block text-[13px] text-ink-3">
                        {c.issuer}
                        {c.code ? ` · ${c.code}` : ''}
                        {c.validUntil ? ` · ${t('validUntil')} ${format.dateTime(new Date(c.validUntil), { year: 'numeric', month: 'short' })}` : ''}
                      </span>
                      {c.certificateUrl && (
                        <a href={c.certificateUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 text-[13px]">
                          {t('view')}
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
