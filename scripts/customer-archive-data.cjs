// Targeted additive migration for customer archival in the manually provisioned CRM database.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const path = require('node:path');
const url = new URL(process.env.DATABASE_URL);
if (url.searchParams.get('schema') !== 'crm') throw new Error('Expected CRM schema');
if (url.hostname.endsWith('.pooler.supabase.com')) url.port = '5432';
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
async function main() {
  const [column] = await db.$queryRawUnsafe("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='crm' AND table_name='Customer' AND column_name='archivedAt') AS exists");
  console.log(JSON.stringify({ schema: 'crm', customerArchiveExists: Boolean(column.exists) }));
  if (process.argv[2] !== 'apply') return;
  if (column.exists) throw new Error('Customer archive fields already exist; inspect instead of reapplying');
  const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260909173000_archive_customers/migration.sql'), 'utf8');
  await db.$transaction(async tx => { for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement); });
  console.log('Applied only customer archive fields, audit table and indexes.');
}
main().catch(() => { console.error('Customer archive operation failed; inspect the CRM schema before retrying.'); process.exitCode = 1; }).finally(() => db.$disconnect());
