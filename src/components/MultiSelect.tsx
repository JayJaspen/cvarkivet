'use client';

import { useMemo, useState } from 'react';

/**
 * Flervalslista med sökruta. Valda värden postas som upprepade fält med samma namn.
 */
export default function MultiSelect({
  name,
  label,
  options,
  defaultSelected = [],
  placeholder = 'Sök…',
  hint,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultSelected?: string[];
  placeholder?: string;
  hint?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  const toggle = (v: string) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="badge bg-brand-100 text-brand-800 hover:bg-brand-200"
            >
              {v} <span className="ml-1 text-brand-500">✕</span>
            </button>
          ))}
        </div>
      )}

      <input
        className="input mb-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />

      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 && (
          <p className="p-3 text-sm text-slate-500">Inga träffar.</p>
        )}
        {filtered.map((o) => (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-sm last:border-0 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => toggle(o)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            {o}
          </label>
        ))}
      </div>

      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}
