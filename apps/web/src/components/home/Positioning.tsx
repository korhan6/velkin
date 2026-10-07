import { getTranslations } from 'next-intl/server';

export async function Positioning() {
  const t = await getTranslations('positioning');
  const points = t.raw('points') as { title: string; body: string }[];
  return (
    <section className="section border-b border-line" aria-labelledby="pos-title">
      <div className="frame grid-12 gap-y-14">
        <p className="eyebrow reveal col-span-4 sm:col-span-8 lg:col-span-3">{t('eyebrow')}</p>
        <h2 id="pos-title" className="reveal col-span-4 text-display-sm !font-medium leading-snug sm:col-span-8 lg:col-span-9 lg:text-[2.125rem]">
          {t('statement')}
        </h2>
        <ol className="col-span-4 grid gap-10 sm:col-span-8 md:grid-cols-3 lg:col-span-9 lg:col-start-4">
          {points.map((p, i) => (
            <li key={p.title} className="reveal border-t border-line pt-6" style={{ ['--d' as string]: `${i * 60}ms` }}>
              <span className="spec text-ink-3">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
