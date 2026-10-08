import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Velkine — Motion Engineered';

/** Generated Open Graph image per locale, inherited by pages that don't define their own. */
export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FAFAF8', color: '#111111', padding: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <g transform="rotate(-24 32 52)"><rect x="27.5" y="6" width="9" height="50" rx="4.5" fill="#111111" /></g>
            <g transform="rotate(24 32 52)"><rect x="27.5" y="6" width="9" height="50" rx="4.5" fill="#111111" /></g>
            <circle cx="32" cy="52" r="6.5" fill="#FAFAF8" />
            <circle cx="32" cy="52" r="4.4" fill="none" stroke="#1F3FA6" strokeWidth="2.4" />
          </svg>
          <div style={{ fontSize: 36, letterSpacing: 12, fontWeight: 600 }}>VELKINE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -2, fontWeight: 600, maxWidth: 980 }}>{t('title')}</div>
          <div style={{ display: 'flex', marginTop: 40, height: 4, width: 96, background: '#1F3FA6' }} />
        </div>
      </div>
    ),
    size,
  );
}
