'use client';
import { useEffect, useRef, useState } from 'react';

export type Layer = { key: string; title: string; body: string; spec: string };

/* Isometric plate geometry (viewBox 600×640) */
const CX = 300;
const W = 190; // half width
const H = 96; // half depth
const T = 14; // thickness
const BASE_Y = [560, 470, 380, 290]; // compact stack, bottom → top
const SPREAD = 40; // extra separation per layer when exploded

function plate(y: number) {
  const top = `${CX},${y - H} ${CX + W},${y} ${CX},${y + H} ${CX - W},${y}`;
  const left = `${CX - W},${y} ${CX},${y + H} ${CX},${y + H + T} ${CX - W},${y + T}`;
  const right = `${CX + W},${y} ${CX},${y + H} ${CX},${y + H + T} ${CX + W},${y + T}`;
  return { top, left, right };
}

/** Maps a point on the plate (u,v ∈ [-1,1]) to isometric coordinates. */
const iso = (y: number, u: number, v: number) => [CX + (u - v) * W * 0.5, y + (u + v) * H * 0.5] as const;

function Details({ kind, y, active }: { kind: string; y: number; active: boolean }) {
  const stroke = active ? 'rgb(var(--accent-on-dark))' : 'rgba(237,237,234,0.35)';
  if (kind === 'structure') {
    const pts = (u: number, v: number) => iso(y, u, v).join(',');
    return (
      <g fill="none" stroke={stroke} strokeWidth="1.2">
        <polygon points={`${pts(-0.8, -0.8)} ${pts(0.8, -0.8)} ${pts(0.8, 0.8)} ${pts(-0.8, 0.8)}`} />
        <line x1={iso(y, -0.8, -0.8)[0]} y1={iso(y, -0.8, -0.8)[1]} x2={iso(y, 0.8, 0.8)[0]} y2={iso(y, 0.8, 0.8)[1]} />
        <line x1={iso(y, 0.8, -0.8)[0]} y1={iso(y, 0.8, -0.8)[1]} x2={iso(y, -0.8, 0.8)[0]} y2={iso(y, -0.8, 0.8)[1]} />
      </g>
    );
  }
  if (kind === 'actuation') {
    return (
      <g>
        {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([u, v]) => {
          const [x, yy] = iso(y, u, v);
          return (
            <g key={`${u}${v}`}>
              <ellipse cx={x} cy={yy - 10} rx="26" ry="13" fill="#2b2b2a" stroke={stroke} strokeWidth="1.2" />
              <path d={`M${x - 26} ${yy - 10} v10 a26 13 0 0 0 52 0 v-10`} fill="#232322" stroke={stroke} strokeWidth="1.2" />
              <ellipse cx={x} cy={yy - 10} rx="8" ry="4" fill="none" stroke={stroke} strokeWidth="1.2" />
            </g>
          );
        })}
      </g>
    );
  }
  if (kind === 'electronics') {
    const chip = (u: number, v: number, s: number) => {
      const p = [iso(y, u - s, v - s), iso(y, u + s, v - s), iso(y, u + s, v + s), iso(y, u - s, v + s)];
      return <polygon key={`${u}${v}`} points={p.map((q) => q.join(',')).join(' ')} fill="#0f0f0f" stroke={stroke} strokeWidth="1" />;
    };
    const trace = (a: [number, number], b: [number, number], k: number) => {
      const [x1, y1] = iso(y, a[0], a[1]);
      const [x2, y2] = iso(y, b[0], b[1]);
      return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="1" />;
    };
    return (
      <g>
        {trace([-0.2, 0], [-0.8, 0], 1)}
        {trace([0.2, 0], [0.8, 0], 2)}
        {trace([0, -0.2], [0, -0.8], 3)}
        {trace([0, 0.2], [0, 0.8], 4)}
        {trace([0.5, 0.5], [0.8, 0.5], 5)}
        {trace([-0.5, -0.5], [-0.5, -0.8], 6)}
        {chip(0, 0, 0.2)}
        {chip(0.5, 0.5, 0.1)}
        {chip(-0.5, -0.5, 0.12)}
        {chip(-0.55, 0.45, 0.08)}
      </g>
    );
  }
  // software: blocks of "code" as thin rows + one accent node
  return (
    <g stroke={stroke} strokeWidth="1.2">
      {[-0.6, -0.35, -0.1, 0.15, 0.4].map((v, i) => {
        const [x1, y1] = iso(y, -0.7, v);
        const [x2, y2] = iso(y, -0.7 + [1.1, 0.7, 1.3, 0.5, 0.9][i], v);
        return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
      <circle cx={iso(y, 0.55, 0.55)[0]} cy={iso(y, 0.55, 0.55)[1]} r="7" fill={active ? 'rgb(var(--accent-on-dark))' : 'none'} />
    </g>
  );
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * "How we build" exploded view. Desktop: the section is pinned with CSS sticky and scroll progress
 * separates the four layers (≈ 1.5 s of motion over the scroll distance). Mobile / reduced motion:
 * static, already-exploded stack with the layer list.
 * Swap the SVG plates for transparent WebP renders of your own CAD when available.
 */
export function Exploded({ eyebrow, title, lead, layers }: { eyebrow: string; title: string; lead: string; layers: Layer[] }) {
  const section = useRef<HTMLElement>(null);
  const [p, setP] = useState(1);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const setup = () => setInteractive(mq.matches);
    setup();
    mq.addEventListener('change', setup);
    return () => mq.removeEventListener('change', setup);
  }, []);

  useEffect(() => {
    if (!interactive) {
      setP(1);
      return;
    }
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = section.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        setP(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [interactive]);

  const spread = smooth(0.05, 0.45, p);
  const active = interactive ? Math.min(layers.length - 1, Math.floor(smooth(0.45, 0.98, p) * layers.length * 0.999)) : -1;
  const ys = BASE_Y.map((y, i) => y - i * SPREAD * spread);

  const figure = (
    <svg viewBox="100 40 640 660" className="h-auto max-h-[calc(100vh-var(--header-h)-48px)] w-full max-w-[600px]" role="img" aria-label={layers.map((l) => l.title).join(', ')}>
      {/* center axis */}
      <line x1={CX} x2={CX} y1={ys[3] - H - 20} y2={ys[0] + H + 30} stroke="rgba(237,237,234,0.12)" strokeDasharray="3 5" />
      {layers.map((l, i) => {
        const y = ys[i];
        const on = active === -1 || active === i;
        const { top, left, right } = plate(y);
        return (
          <g key={l.key} style={{ opacity: on ? 1 : 0.38, transition: 'opacity 400ms var(--ease)' }}>
            <polygon points={left} fill="#1b1b1a" stroke="rgba(237,237,234,0.18)" strokeWidth="1" />
            <polygon points={right} fill="#222221" stroke="rgba(237,237,234,0.18)" strokeWidth="1" />
            <polygon points={top} fill="#2a2a29" stroke={on && active !== -1 ? 'rgb(var(--accent-on-dark))' : 'rgba(237,237,234,0.28)'} strokeWidth="1.2" />
            <Details kind={l.key} y={y} active={on && active !== -1} />
            {/* leader line + label */}
            <line x1={CX + W} y1={y} x2={CX + W + 40} y2={y} stroke="rgba(237,237,234,0.3)" />
            <text x={CX + W + 46} y={y + 4} fill={on ? '#EDEDEA' : '#9A9A95'} fontSize="13" fontFamily="IBM Plex Mono, monospace">
              {String(i + 1).padStart(2, '0')} {l.title}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <section ref={section} className={`on-dark relative bg-graphite text-on-graphite ${interactive ? 'h-[240vh]' : ''}`} aria-labelledby="build-title">
      <div className={`${interactive ? 'sticky top-0 flex h-screen items-center pt-[var(--header-h)]' : 'section'}`}>
        <div className="frame grid-12 items-center gap-y-12">
          <div className="col-span-4 sm:col-span-8 lg:col-span-5">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="build-title" className="mt-4 text-display-md text-white">
              {title}
            </h2>
            <p className="mt-5 text-lead text-on-graphite-2">{lead}</p>
            <ol className="mt-10 border-t border-white/10">
              {[...layers].reverse().map((l) => {
                const i = layers.indexOf(l);
                const on = active === -1 || active === i;
                return (
                  <li key={l.key} className="border-b border-white/10 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className={`text-[17px] font-semibold transition-colors duration-500 ${on ? 'text-white' : 'text-on-graphite-2'}`}>
                        <span className="spec me-3 text-on-graphite-2">{String(i + 1).padStart(2, '0')}</span>
                        {l.title}
                      </h3>
                    </div>
                    {/* On desktop only the active layer expands, so the pinned panel always fits the viewport */}
                    <div className={`grid transition-[grid-template-rows] duration-500 ease-precise ${interactive && !(active === i || (active === -1 && i === layers.length - 1)) ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="mt-2 text-[15px] leading-relaxed text-on-graphite-2">{l.body}</p>
                        <p className="spec mt-2 text-accent-dark">{l.spec}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="col-span-4 flex justify-center sm:col-span-8 lg:col-span-7">{figure}</div>
        </div>
      </div>
    </section>
  );
}
