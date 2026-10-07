'use client';
import { LogoMark } from '@velkin/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { RESOURCES } from '@/lib/resources';

export default function PanelLayout({ children }: { children: ReactNode }) {
  const { me, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !me) router.replace('/login');
    else if (me?.mustEnroll2fa && path !== '/security') router.replace('/security');
  }, [loading, me, path, router]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center font-mono text-xs text-graphite-400">Loading…</div>;

  const nav = [
    { href: '/leads', label: 'Leads' },
    ...Object.values(RESOURCES).map((r) => ({ href: `/content/${r.name}`, label: r.label })),
    { href: '/downloads', label: 'Downloads' },
    { href: '/settings', label: 'Site settings' },
    { href: '/security', label: 'Security' },
    ...(me.role === 'ADMIN' ? [{ href: '/users', label: 'Users' }] : []),
  ];
  const analytics = process.env.NEXT_PUBLIC_ANALYTICS_URL;

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-white/10 p-5 md:flex">
        <Link href="/leads" className="flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span className="font-mono text-xs uppercase tracking-[0.25em]">Admin</span>
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded px-3 py-2 text-sm transition-colors ${path.startsWith(n.href) ? 'bg-white/5 text-bone' : 'text-graphite-300 hover:text-bone'}`}
            >
              {n.label}
            </Link>
          ))}
          {analytics && (
            <a href={analytics} target="_blank" rel="noreferrer" className="rounded px-3 py-2 text-sm text-graphite-300 hover:text-bone">
              Analytics ↗
            </a>
          )}
        </nav>
        <div className="border-t border-white/10 pt-4 font-mono text-[11px] text-graphite-400">
          <p className="truncate">{me.email}</p>
          <p className="text-accent">{me.role}</p>
          <button className="mt-3 hover:text-bone" onClick={() => logout().then(() => router.replace('/login'))}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded px-3 py-1.5 text-xs text-graphite-300">
              {n.label}
            </Link>
          ))}
        </div>
        <main className="mx-auto max-w-6xl p-5 md:p-10">{children}</main>
      </div>
    </div>
  );
}
