'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Background loop that never competes with LCP: mounts after the page is idle, only on screens ≥ 768 px,
 * and never with reduced motion or Save-Data. The poster (rendered by the server) stays visible underneath.
 */
export function HeroVideo({ mp4, webm, poster }: { mp4?: string | null; webm?: string | null; poster?: string | null }) {
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!mp4 && !webm) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setMount(true);
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 2500 });
    else setTimeout(go, 1200);
  }, [mp4, webm]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [mount]);

  if (!mount) return null;
  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      poster={poster ?? undefined}
      onCanPlay={() => setReady(true)}
      aria-hidden="true"
    >
      {webm && <source src={webm} type="video/webm" />}
      {mp4 && <source src={mp4} type='video/mp4; codecs="hvc1"' />}
      {mp4 && <source src={mp4} type="video/mp4" />}
    </video>
  );
}
