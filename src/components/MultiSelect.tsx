'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Rullista med flerval och sökruta.
 *
 * Fälls ut när man klickar på den, precis som en vanlig rullista, men går att
 * kryssa i flera alternativ. Valda värden visas som borttagbara etiketter och
 * postas som upprepade fält med samma namn.
 */
export default function MultiSelect({
  name,
  label,
  options,
  defaultSelected = [],
  placeholder = 'Välj…',
  sokPlaceholder = 'Sök…',
  hint,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultSelected?: string[];
  placeholder?: string;
  sokPlaceholder?: string;
  hint?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sokRef = useRef<HTMLInputElement>(null);

  // Stäng när man klickar utanför eller trycker Escape
  useEffect(() => {
    if (!open) return;

    const vidKlick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const vidTangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', vidKlick);
    document.addEventListener('keydown', vidTangent);
    return () => {
      document.removeEventListener('mousedown', vidKlick);
      document.removeEventListener('keydown', vidTangent);
    };
  }, [open]);

  useEffect(() => {
    if (open) sokRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  const toggle = (v: string) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div ref={wrapRef} className="relative">
      <label className="label">{label}</label>
      {hint && <p className="mb-2 text-xs text-sand-500">{hint}</p>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="input flex items-center justify-between text-left"
      >
        <span className={selected.length ? 'text-sand-900' : 'text-sand-400'}>
          {selected.length === 0
            ? placeholder
            : `${selected.length} ${selected.length === 1 ? 'vald' : 'valda'}`}
        </span>
        <span className="ml-2 shrink-0 text-sand-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-sand-300 bg-white shadow-lg">
          <div className="border-b border-sand-200 p-2">
            <input
              ref={sokRef}
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sokPlaceholder}
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && <p className="p-3 text-sm text-sand-500">Inga träffar.</p>}
            {filtered.map((o) => (
              <label
                key={o}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-sand-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  onChange={() => toggle(o)}
                  className="h-4 w-4 rounded border-sand-300 text-brand-600"
                />
                {o}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-sand-200 px-3 py-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs text-sand-500 hover:text-sand-900"
            >
              Rensa alla
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Klar
            </button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              title="Ta bort"
              className="badge bg-brand-100 text-brand-800 hover:bg-brand-200"
            >
              {v} <span className="ml-1 text-brand-500">✕</span>
            </button>
          ))}
        </div>
      )}

      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}
