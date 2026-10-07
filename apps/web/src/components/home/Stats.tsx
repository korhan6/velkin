'use client';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

/** Counts up once when it enters the viewport (≤ 1 s). Reduced motion: final value immediately. */
function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / 900);
          setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref} className="tabular-nums" aria-label={`${value}${suffix ?? ''}`}>
      <span aria-hidden>
        {new Intl.NumberFormat(locale).format(n)}
        {suffix}
      </span>
    </span>
  );
}

export function Stats({ eyebrow, items }: { eyebrow: string; items: { label: string; value: number; suffix?: string }[] }) {
  const visible = items.filter((i) => i.value > 0);
  if (!visible.length) return null;
  return (
    <section className="on-dark section bg-graphite text-on-graphite" aria-label={eyebrow}>
      <div className="frame">
        <p className="eyebrow">{eyebrow}</p>
        <dl className="mt-12 grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((it) => (
            <div key={it.label} className="flex flex-col border-s border-white/15 ps-6">
              <dt className="order-2 mt-3 max-w-[22ch] text-[15px] text-on-graphite-2">{it.label}</dt>
              <dd className="order-1 text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-none tracking-tight text-white">
                <Counter value={it.value} suffix={it.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
