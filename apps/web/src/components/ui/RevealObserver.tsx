'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scroll reveals without hurting LCP: content is visible by default. After hydration, only elements that
 * are still below the fold get `.is-pending` (hidden) and are revealed once when they enter the viewport.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>('.reveal, .reveal-mask, .reveal-x')].filter(
      (el) => !el.dataset.revealed && el.getBoundingClientRect().top > window.innerHeight * 0.92,
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.remove('is-pending');
          el.dataset.revealed = '1';
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => {
      el.classList.add('is-pending');
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
