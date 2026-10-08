import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cta } from '@/components/home/Cta';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getPost, getPosts } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { pageMeta, SITE_URL } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(routing.locales.map(async (locale) => (await getPosts(locale)).map((p) => ({ locale, slug: p.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPost(locale, slug);
  if (!p) return {};
  return pageMeta({ locale, path: `/resources/${slug}`, title: p.title, description: p.excerpt, type: 'article' });
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, post, format] = await Promise.all([getTranslations('resources'), getPost(locale, slug), getFormatter()]);
  if (!post) notFound();
  return (
    <article>
      <header className="pt-[calc(var(--header-h)+56px)] md:pt-[calc(var(--header-h)+80px)]">
        <div className="frame max-w-4xl">
          <Link href="/resources" className="link text-[14px]">
            <Icon name="arrow" size={14} className="rotate-180 rtl:rotate-0" />
            {t('back')}
          </Link>
          <p className="mt-10 text-[14px] text-ink-3">
            {post.authorName} · {format.dateTime(new Date(post.publishedAt), { year: 'numeric', month: 'long', day: 'numeric' })} · {t('minutes', { n: post.readingMinutes })}
          </p>
          <h1 className="mt-4 text-display-lg">{post.title}</h1>
          <p className="mt-6 text-lead text-ink-2">{post.excerpt}</p>
        </div>
      </header>
      <div className="frame max-w-4xl border-t border-line pb-24 pt-12 mt-12">
        <div className="prose-vk">
          <Markdown source={post.body} />
        </div>
      </div>
      <Cta />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt,
          inLanguage: locale,
          author: { '@type': 'Organization', name: post.authorName ?? 'Velkine' },
          publisher: { '@type': 'Organization', name: 'Velkine', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` } },
          mainEntityOfPage: `${SITE_URL}/${locale}/resources/${slug}`,
          keywords: post.tags.join(', '),
        }}
      />
    </article>
  );
}
