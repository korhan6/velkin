'use client';
import { useEffect, useState } from 'react';
import { FieldInput } from '@/components/FieldInput';
import { api } from '@/lib/api';

type Stats = { projects: number; countries: number; years: number; robots: number };
type Hero = { poster: string | null; mp4: string | null; webm: string | null };

export default function SettingsPage() {
  const [stats, setStats] = useState<Stats>({ projects: 0, countries: 0, years: 0, robots: 0 });
  const [hero, setHero] = useState<Hero>({ poster: null, mp4: null, webm: null });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<Partial<Stats>>('/v1/admin/settings/stats').then((s) => setStats((p) => ({ ...p, ...s })));
    api<Partial<Hero>>('/v1/admin/settings/hero').then((s) => setHero((p) => ({ ...p, ...s })));
  }, []);

  const save = async (key: 'stats' | 'hero', value: unknown) => {
    try {
      await api(`/v1/admin/settings/${key}`, { method: 'PUT', json: value });
      setMsg(`Saved ${key}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    }
    setTimeout(() => setMsg(''), 2500);
  };
  const labels: Record<keyof Stats, string> = {
    projects: 'Projects delivered',
    countries: 'Countries',
    years: 'Years of combined engineering experience',
    robots: 'Robots deployed',
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-medium">Site settings</h1>
      {msg && <p className="font-mono text-xs text-accent">{msg}</p>}

      <section className="card space-y-4">
        <p className="label">Home hero media</p>
        <p className="text-sm text-graphite-300">
          Poster: AVIF/WebP/JPEG 2400×1350, &lt; 250 KB (this is what loads first). Video: 10–15 s loop, no audio, 1920×1080, &lt; 4 MB, MP4 (H.265 or H.264) and/or WebM. The video is
          never loaded on phones.
        </p>
        {(['poster', 'mp4', 'webm'] as const).map((k) => (
          <label key={k} className="block">
            <span className="label">{k === 'poster' ? 'Poster image' : `Video ${k.toUpperCase()}`}</span>
            <FieldInput field={{ key: k, label: k, type: 'image' }} value={hero[k]} onChange={(v) => setHero({ ...hero, [k]: (v as string) || null })} />
          </label>
        ))}
        <button className="btn-primary" onClick={() => save('hero', hero)}>
          Save hero
        </button>
      </section>

      <section className="card space-y-4">
        <p className="label">Home figures — publish only numbers you can prove. All zero = section hidden.</p>
        <div className="grid gap-4 md:grid-cols-4">
          {(Object.keys(labels) as (keyof Stats)[]).map((k) => (
            <label key={k}>
              <span className="label">{labels[k]}</span>
              <input className="input" type="number" min={0} value={stats[k]} onChange={(e) => setStats({ ...stats, [k]: Number(e.target.value || 0) })} />
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={() => save('stats', stats)}>
          Save figures
        </button>
      </section>
    </div>
  );
}
