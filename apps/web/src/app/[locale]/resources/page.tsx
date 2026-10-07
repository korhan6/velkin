import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { DownloadButton } from '@/components/resources/DownloadButton';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { getPosts, getResources } from '@/lib/content';
import { pageMeta, SITE_URL } from '@/lib/seo';
import type { Resource } from '@/lib/types';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return pageMeta({ locale, path: '/resources', title: t('title'), description: t('lead') });
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, posts, docs, format] = await Promise.all([getTranslations('resources'), getPosts(locale), getResources(locale), getFormatter()]);
  const groups: { key: 'whitepapers' | 'datasheets'; items: Resource[] }[] = [
    { key: 'whitepapers', items: docs.filter((d) => d.kind === 'whitepaper') },
    { key: 'datasheets', items: docs.filter((d) => d.kind === 'datasheet') },
  ];

  return (
    <>
      <PageHeader eyebrow={t('title')} title={t('title')} lead={t('lead')} />

      <section className="frame section" aria-labelledby="articles-title">
        <h2 id="articles-title" className="text-display-sm">
          {t('articles')}
        </h2>
        <ul className="mt-10 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug} className="reveal">
              <Link href={`/resources/${p.slug}`} className="zoom group block">
                <Media src={p.coverImage} alt="" label={`IMAGEN — Portada técnica para "${p.title}", 3:2`} ratio="3/2" sizes="(min-width:1024px) 33vw, 50vw" />
                <p className="mt-5 text-[13px] text-ink-3">
                  {p.tags[0] && `${p.tags[0]} · `}
                  {format.dateTime(new Date(p.publishedAt), { year: 'numeric', month: 'short', day: 'numeric' })} · {t('minutes', { n: p.readingMinutes })}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight group-hover:text-accent">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="frame section grid gap-14 lg:grid-cols-2">
          {groups.map((g) => (
            <div key={g.key}>
              <h2 className="text-display-sm">{t(g.key)}</h2>
              {g.items.length ? (
                <ul className="mt-8 border-t border-line">
                  {g.items.map((d) => (
                    <li key={d.slug} className="flex items-start justify-between gap-6 border-b border-line py-5">
                      <div className="flex gap-4">
                        <Icon name="file" size={24} className="mt-1 text-ink-3" />
                        <div>
                          <h3 className="font-semibold">{d.title}</h3>
                          <p className="mt-1 text-[14px] text-ink-2">{d.summary}</p>
                          {d.pages ? <p className="spec mt-1 text-ink-3">PDF · {t('pages', { n: d.pages })}</p> : null}
                        </div>
                      </div>
                      <DownloadButton slug={d.slug} gated={d.gated} title={d.title} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-[15px] text-ink-3">{t('emptyDocs')}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      {docs.some((d) => d.kind === 'datasheet') && (
        <JsonLd
          data={docs
            .filter((d) => d.kind === 'datasheet')
            .map((d) => ({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: d.title,
              description: d.summary,
              brand: { '@type': 'Brand', name: 'Velkin' },
              manufacturer: { '@type': 'Organization', name: 'Velkin', url: SITE_URL },
              ...(d.coverImage ? { image: d.coverImage } : {}),
            }))}
        />
      )}
    </>
  );
}
