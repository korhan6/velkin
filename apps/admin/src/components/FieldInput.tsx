'use client';
import { useState } from 'react';
import { uploadMedia } from '@/lib/api';
import type { Field } from '@/lib/resources';

type Spec = { label: string; value: string };

function Uploader({ onDone, multiple = false }: { onDone: (urls: string[]) => void; multiple?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <label className="btn-ghost cursor-pointer">
      {busy ? 'Uploading…' : multiple ? 'Upload images' : 'Upload'}
      <input
        type="file"
        accept="image/*,video/mp4,video/webm,application/pdf"
        multiple={multiple}
        className="sr-only"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          if (!files.length) return;
          setBusy(true);
          setErr('');
          try {
            onDone(await Promise.all(files.map(uploadMedia)));
          } catch (x) {
            setErr(x instanceof Error ? x.message : 'Upload failed');
          } finally {
            setBusy(false);
          }
        }}
      />
      {err && <span className="text-accent">{err}</span>}
    </label>
  );
}

export function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case 'text':
    case 'url':
      return <input className="input" type={field.type === 'url' ? 'url' : 'text'} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} required={'required' in field && field.required} />;
    case 'textarea':
      return <textarea className="input min-h-[90px]" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'markdown':
      return <textarea className="input min-h-[280px] font-mono text-xs" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="## Heading&#10;&#10;Paragraph…&#10;&#10;- bullet" />;
    case 'number':
      return (
        <input
          className="input"
          type="number"
          step={field.step ?? 1}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );
    case 'bool':
      return <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
    case 'select':
      return (
        <select className="input" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case 'list': {
      const arr = (value as string[]) ?? [];
      return (
        <textarea
          className="input min-h-[90px]"
          placeholder="One per line"
          value={arr.join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        />
      );
    }
    case 'specs': {
      const arr = (value as Spec[]) ?? [];
      const set = (i: number, k: keyof Spec, v: string) => onChange(arr.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
      return (
        <div className="space-y-2">
          {arr.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input max-w-[180px]" placeholder="DOF" value={s.label} onChange={(e) => set(i, 'label', e.target.value)} />
              <input className="input" placeholder="6" value={s.value} onChange={(e) => set(i, 'value', e.target.value)} />
              <button type="button" className="btn-ghost" onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => onChange([...arr, { label: '', value: '' }])}>
            + Spec
          </button>
        </div>
      );
    }
    case 'metrics': {
      const arr = (value as { value: string; label: string }[]) ?? [];
      const set = (i: number, k: 'value' | 'label', v: string) => onChange(arr.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
      return (
        <div className="space-y-2">
          {arr.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input className="input max-w-[140px]" placeholder="−38 %" value={m.value} onChange={(e) => set(i, 'value', e.target.value)} />
              <input className="input" placeholder="cycle time" value={m.label} onChange={(e) => set(i, 'label', e.target.value)} />
              <button type="button" className="btn-ghost" onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
          {arr.length < 4 && (
            <button type="button" className="btn-ghost" onClick={() => onChange([...arr, { value: '', label: '' }])}>
              + Result
            </button>
          )}
        </div>
      );
    }
    case 'image':
      return (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {typeof value === 'string' && value && <img src={value} alt="" className="h-14 w-20 rounded border border-white/10 object-cover" />}
          <input className="input" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} placeholder="https://…" />
          <Uploader onDone={([u]) => onChange(u)} />
        </div>
      );
    case 'gallery': {
      const arr = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {arr.map((u) => (
              <div key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-20 w-28 rounded border border-white/10 object-cover" />
                <button type="button" className="absolute end-1 top-1 rounded bg-ink px-1 text-xs" onClick={() => onChange(arr.filter((x) => x !== u))}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <Uploader multiple onDone={(urls) => onChange([...arr, ...urls])} />
        </div>
      );
    }
  }
}
