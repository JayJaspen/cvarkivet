/**
 * Genererar prisma/schema.local.prisma (SQLite) utifrån prisma/schema.prisma (PostgreSQL).
 * Används bara för lokal utveckling utan databaskonto – produktionen kör alltid Postgres.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'prisma', 'schema.prisma');
const dest = path.join(root, 'prisma', 'schema.local.prisma');

const schema = readFileSync(src, 'utf8');

if (!schema.includes('provider = "postgresql"')) {
  console.error('Hittade ingen postgresql-provider i prisma/schema.prisma. Avbryter.');
  process.exit(1);
}

const local =
  '// AUTOGENERERAD – ändra prisma/schema.prisma i stället.\n' +
  schema
    .replace('provider = "postgresql"', 'provider = "sqlite"')
    // SQLite har ingen anslutningspool och stödjer inte directUrl.
    .replace(/^\s*directUrl\s*=.*$/m, '')
    .replace(/^\s*\/\/ Direktanslutning.*$/m, '')
    .replace(/^\s*\/\/ Båda sätts automatiskt.*$/m, '')
    .replace(/^\s*\/\/ Poolad anslutning.*$/m, '');

writeFileSync(dest, local);
console.log('Skrev prisma/schema.local.prisma (SQLite).');
