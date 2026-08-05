import Link from 'next/link';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {description && <p className="muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'name' | 'type' | 'required' | 'placeholder'
>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="input"
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-sand-500">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 5,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        className="input"
      />
      {hint && <p className="mt-1 text-xs text-sand-500">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  required,
  includeBlank,
  blankLabel = 'Alla',
}: {
  label?: string;
  name: string;
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  includeBlank?: boolean;
  blankLabel?: string;
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div>
      {label && (
        <label className="label" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="input"
      >
        {includeBlank && <option value="">{blankLabel}</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'pink';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-sand-100 text-sand-800',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-brand-100 text-brand-800',
    pink: 'bg-pink-100 text-pink-800',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-sand-300 bg-white p-10 text-center text-sm text-sand-500">
      {children}
    </div>
  );
}

export function Notice({
  tone = 'blue',
  title,
  children,
  action,
}: {
  tone?: 'blue' | 'amber' | 'red' | 'green';
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    blue: 'border-brand-200 bg-brand-50 text-brand-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };
  return (
    <div className={`mb-6 rounded-xl border p-4 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="mt-1">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        CV
      </span>
      <span className={`text-lg font-semibold ${light ? 'text-white' : 'text-sand-900'}`}>
        CVArkivet<span className="text-brand-500">.se</span>
      </span>
    </Link>
  );
}
