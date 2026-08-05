import Link from 'next/link';

/**
 * CVArkivets märke: ett A som också läser som ett arkivskåp, med en
 * terrakottafärgad låddragare i tvärslaget.
 *
 * Ritas som SVG i stället för bildfil, så att den är knivskarp i alla
 * storlekar och kan byta färg efter bakgrunden.
 */
export function Markeikon({
  storlek = 36,
  variant = 'gron',
  className = '',
}: {
  storlek?: number;
  /** gron = grön platta med ljust A. ljus = ljus platta med grönt A, för mörk bakgrund. */
  variant?: 'gron' | 'ljus';
  className?: string;
}) {
  const platta = variant === 'gron' ? '#4F7A5C' : '#FAFAF7';
  const bokstav = variant === 'gron' ? '#FAFAF7' : '#4F7A5C';

  return (
    <svg
      width={storlek}
      height={storlek}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="44" height="44" rx="11" fill={platta} />
      <path d="M22 9 12 36h5.5l1.8-5.5h5.4L26.5 36H32L22 9z" fill={bokstav} />
      <rect x="13" y="28.6" width="18" height="2.4" rx="1.2" fill="#C97B4A" />
    </svg>
  );
}

/** Märke plus ordbild. Länkar till startsidan. */
export default function Logotyp({
  variant = 'gron',
  storlek = 'normal',
  href = '/',
}: {
  variant?: 'gron' | 'ljus';
  storlek?: 'liten' | 'normal';
  href?: string;
}) {
  const ikonstorlek = storlek === 'liten' ? 32 : 38;
  const textklass = storlek === 'liten' ? 'text-base' : 'text-lg';

  const namnfarg = variant === 'ljus' ? 'text-white' : 'text-sand-900';
  const suffixfarg = variant === 'ljus' ? 'text-brand-200' : 'text-brand-600';

  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Markeikon storlek={ikonstorlek} variant={variant === 'ljus' ? 'ljus' : 'gron'} />
      <span className={`font-semibold tracking-tight ${textklass} ${namnfarg}`}>
        CVArkivet<span className={suffixfarg}>.se</span>
      </span>
    </Link>
  );
}
