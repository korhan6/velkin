'use client';
import { LogoMark, Wordmark } from '@velkin/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Icon } from '../ui/Icon';
import { LocaleSwitcher } from './LocaleSwitcher';

const NAV = [
  { href: '/services', key: 'services' },
  { href: '/industries', key: 'industries' },
  { href: '/projects', key: 'projects' },
  { href: '/about', key: 'about' },
  { href: '/resources', key: 'resources' },
] as const;

/** Transparent over the dark hero on the home page; solid white once scrolled or on inner pages. */
export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const overHero = isHome && !scrolled && !open;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[300] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        {t('skip')}
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-colors duration-300 ease-precise ${
          overHero ? 'on-dark bg-transparent text-on-graphite' : 'border-b border-line bg-bg/90 text-ink backdrop-blur-md'
        }`}
      >
        <div className="frame flex h-full items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Velkine">
            <LogoMark articulate className="h-8 w-8" title="" />
            <Wordmark className="h-[13px] w-auto" title="" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname.startsWith(n.href) ? 'page' : undefined}
                className={`nav-link ${overHero ? '!text-on-graphite/85 hover:!text-white after:!bg-white' : ''}`}
              >
                {t(n.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <LocaleSwitcher className="hidden md:inline-flex" dark={overHero} />
            <Link href="/contact" className="btn-primary hidden !h-10 !px-4 !text-[14px] md:inline-flex">
              {t('cta')}
            </Link>
            <button
              type="button"
              className="-me-2 flex h-10 w-10 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t('close') : t('menu')}
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto bg-bg lg:hidden"
      >
        <nav aria-label="Mobile" className="frame flex flex-col py-6">
          {[...NAV, { href: '/contact', key: 'contact' } as const].map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center justify-between border-b border-line py-5 text-2xl font-semibold tracking-tight">
              {t(n.key)}
              <Icon name="arrow" size={20} className="text-ink-3" />
            </Link>
          ))}
          <div className="mt-8 flex items-center justify-between">
            <LocaleSwitcher />
            <Link href="/contact" className="btn-primary">
              {t('cta')}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
