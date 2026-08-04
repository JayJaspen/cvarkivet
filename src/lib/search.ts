/**
 * Skiftlägesokänslig textsökning.
 *
 * PostgreSQL är skiftlägeskänsligt på LIKE och behöver mode: 'insensitive'.
 * SQLite saknar stöd för mode men är redan okänsligt för ASCII.
 * Därför byggs filtret dynamiskt utifrån vilken databas som körs.
 */
const isSqlite = process.env.DATABASE_PROVIDER === 'sqlite';

export function contains(value: string) {
  const filter = isSqlite
    ? { contains: value }
    : { contains: value, mode: 'insensitive' };
  return filter as { contains: string };
}
