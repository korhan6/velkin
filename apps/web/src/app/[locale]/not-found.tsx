import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <section className="frame flex min-h-[70vh] flex-col items-start justify-center pt-[var(--header-h)]">
      <p className="spec text-ink-3">404</p>
      <h1 className="mt-4 text-display-md">{t('title')}</h1>
      <p className="mt-4 max-w-md text-ink-2">{t('body')}</p>
      <Link href="/" className="btn-primary mt-10">
        {t('home')}
      </Link>
    </section>
  );
}
