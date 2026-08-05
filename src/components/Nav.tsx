'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type Tab = { href: string; label: string; badge?: number };

/**
 * Fast sidomeny på skärmar från medelstorlek och uppåt, hopfällbar låda på mobil.
 */
export default function Nav({
  tabs,
  name,
  role,
  logoutAction,
}: {
  tabs: Tab[];
  name: string;
  role: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Stäng mobilmenyn när man navigerat
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const menyInnehall = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
          CV
        </span>
        <span className="text-lg font-semibold text-white">
          CVArkivet<span className="text-brand-200">.se</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`navlink ${isActive(t.href) ? 'navlink-active' : ''}`}
          >
            <span>{t.label}</span>
            {!!t.badge && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-semibold text-white">
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="mb-3 truncate text-xs text-brand-200">{role}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Logga ut
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobilens topprad */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            CV
          </span>
          <span className="font-semibold text-sand-900">
            CVArkivet<span className="text-brand-600">.se</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary"
          aria-label="Öppna meny"
        >
          ☰
        </button>
      </header>

      {/* Fast sidomeny på större skärmar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-brand-800 md:block">
        {menyInnehall}
      </aside>

      {/* Mobilens utfällda meny */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Stäng meny"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-sand-900/50"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-800 shadow-xl">
            {menyInnehall}
          </aside>
        </div>
      )}
    </>
  );
}
