'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import Logotyp from './Logotyp';

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Vilken flik användaren klickat på, innan sidan hunnit laddas.
  // Utan detta står markeringen kvar på den gamla fliken tills allt är klart.
  const [pakladd, setPakladd] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setPakladd(null);
  }, [pathname]);

  const isActive = (href: string) => {
    if (pakladd) return pakladd === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navigera = (e: React.MouseEvent, href: string) => {
    // Låt mittenklick och ctrl-klick öppna i ny flik som vanligt
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setPakladd(href);
    startTransition(() => router.push(href));
  };

  const menyInnehall = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <Logotyp variant="ljus" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {tabs.map((t) => {
          const aktiv = isActive(t.href);
          const laddar = pending && pakladd === t.href;

          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              onClick={(e) => navigera(e, t.href)}
              className={`navlink ${aktiv ? 'navlink-active' : ''}`}
            >
              <span>{t.label}</span>
              <span className="flex items-center gap-2">
                {!!t.badge && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-semibold text-white">
                    {t.badge}
                  </span>
                )}
                {laddar && (
                  <span
                    aria-hidden
                    className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  />
                )}
              </span>
            </Link>
          );
        })}
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
        <Logotyp storlek="liten" />
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
