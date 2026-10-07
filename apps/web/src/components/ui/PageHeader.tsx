import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line pb-14 pt-[calc(var(--header-h)+56px)] md:pb-20 md:pt-[calc(var(--header-h)+88px)]">
      <div className="frame grid-12">
        <div className="col-span-4 sm:col-span-8 lg:col-span-9">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 text-display-lg">{title}</h1>
          {lead && <p className="mt-6 max-w-[62ch] text-lead text-ink-2">{lead}</p>}
          {children}
        </div>
      </div>
    </header>
  );
}
