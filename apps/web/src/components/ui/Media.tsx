import Image from 'next/image';
import { Icon } from './Icon';

type Props = {
  src?: string | null;
  alt?: string;
  /** Exact brief for the photo that belongs here — shown while there is no real asset. */
  label: string;
  ratio?: string; // e.g. "4/3", "16/9", "3/2"
  sizes?: string;
  priority?: boolean;
  dark?: boolean;
  className?: string;
  rounded?: boolean;
};

/**
 * Image slot with a fixed aspect ratio (no layout shift). Uses next/image (AVIF/WebP, responsive)
 * when a real asset exists; otherwise renders a clearly labelled placeholder describing the photo to shoot.
 */
export function Media({ src, alt = '', label, ratio = '4/3', sizes = '100vw', priority, dark, className = '', rounded = true }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden ${rounded ? 'rounded-md' : ''} ${dark ? 'bg-graphite-2' : 'bg-placeholder'} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? 'high' : undefined}
          className="object-cover"
        />
      ) : (
        <div className="media-fill absolute inset-0 flex items-end p-4" role="img" aria-label={alt || label}>
          <div className={`absolute inset-0 flex items-center justify-center ${dark ? 'text-white/15' : 'text-ink/15'}`}>
            <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
              <rect x="6" y="10" width="36" height="28" rx="2" />
              <circle cx="18" cy="20" r="3.5" />
              <path d="M6 33l11-9 8 7 6-5 11 9" />
            </svg>
          </div>
          <p className={`relative max-w-[42ch] text-[12px] leading-snug ${dark ? 'text-on-graphite-2' : 'text-ink-2'}`}>
            <Icon name="file" size={12} className="me-1 inline -translate-y-px" />
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
