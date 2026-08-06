/** Färgsatt matchningsplakett. Färgerna följer samma spann som filtret. */
export function Matchplakett({
  score,
  storlek = 'normal',
}: {
  score: number;
  storlek?: 'liten' | 'normal';
}) {
  const ton =
    score >= 81
      ? 'bg-brand-600 text-white'
      : score >= 61
        ? 'bg-brand-100 text-brand-800'
        : score >= 41
          ? 'bg-accent-100 text-accent-800'
          : 'bg-sand-100 text-sand-600';

  if (storlek === 'liten')
    return <span className={`badge ${ton}`}>{score}% matchning</span>;

  return (
    <div className={`rounded-lg px-3 py-2 text-center ${ton}`}>
      <p className="text-xl font-bold leading-none">{score}%</p>
      <p className="mt-1 text-[11px] font-medium">matchning</p>
    </div>
  );
}

/** Förklaringstext som ska följa med varje poäng. */
export function Matchforbehall({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-sand-500 ${className}`}>
      Poängen räknas fram automatiskt utifrån kompetens och erfarenhet mot annonsens
      innehåll. Ålder, namn och foto vägs inte in. Den är ett stöd, inte ett omdöme.
    </p>
  );
}
