'use client';

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('velkin:consent-open'))} className="text-start hover:text-on-graphite">
      {label}
    </button>
  );
}
