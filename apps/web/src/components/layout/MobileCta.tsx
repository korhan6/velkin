'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

/** Sticky "Talk to an engineer" bar on phones, shown after the first screen of scrolling. */
export function MobileCta() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (pathname.startsWith('/contact')) return null;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 p-3 backdrop-blur-md transition-transform duration-300 ease-precise md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <Link href="/contact" className="btn-primary w-full" tabIndex={show ? 0 : -1}>
        {t('cta')}
      </Link>
    </div>
  );
}
