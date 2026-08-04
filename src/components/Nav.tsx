'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './ui';

export type Tab = { href: string; label: string; badge?: number };

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive(t.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t.label}
                {!!t.badge && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                    {t.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
          <form action={logoutAction}>
            <button className="btn-secondary" type="submit">
              Logga ut
            </button>
          </form>
          <button
            className="btn-secondary md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Meny"
            type="button"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 px-4 py-2 md:hidden">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(t.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
              }`}
            >
              {t.label}
              {!!t.badge && <span className="ml-2 text-brand-600">({t.badge})</span>}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
