import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '../ui/SectionHeader';

export async function ProcessTimeline() {
  const t = await getTranslations('process');
  const steps = t.raw('steps') as { t: string; b: string; d: string }[];
  return (
    <section className="section" aria-labelledby="process-title">
      <div className="frame">
        <SectionHeader id="process-title" eyebrow={t('eyebrow')} title={t('title')} />
        <div className="relative mt-16">
          {/* rail: fills once when it enters the viewport */}
          <div className="absolute inset-x-0 top-[5px] hidden h-px bg-line lg:block" aria-hidden />
          <div className="reveal-x absolute inset-x-0 top-[5px] hidden h-px bg-accent lg:block" aria-hidden />
          <div className="absolute bottom-2 start-[5px] top-2 w-px bg-line lg:hidden" aria-hidden />
          <ol className="grid gap-10 lg:grid-cols-6 lg:gap-8">
            {steps.map((s, i) => (
              <li key={s.t} className="reveal relative ps-8 lg:ps-0 lg:pt-10" style={{ ['--d' as string]: `${i * 80}ms` }}>
                <span className="absolute start-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-accent bg-bg lg:top-0" aria-hidden />
                <span className="spec text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.b}</p>
                <p className="spec mt-3 text-accent">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
