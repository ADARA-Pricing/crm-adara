// Targeted additive migration for the manually provisioned CRM database.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const path = require('node:path');

const url = new URL(process.env.DATABASE_URL);
if (url.searchParams.get('schema') !== 'crm') throw new Error('Expected CRM schema');
if (url.hostname.endsWith('.pooler.supabase.com')) url.port = '5432';
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });

async function main() {
  const existing = await db.$queryRawUnsafe("SELECT to_regclass('crm.\"DangerZone\"')::text AS name");
  console.log(JSON.stringify({ schema: 'crm', dangerZoneExists: Boolean(existing[0].name) }));
  if (process.argv[2] !== 'apply') return;
  if (existing[0].name) throw new Error('DangerZone already exists; inspect it instead of reapplying');
  const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260909150000_add_danger_zones/migration.sql'), 'utf8');
  await db.$transaction(async tx => {
    for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
  });
  console.log('Applied only crm.DangerZone and its index.');
}

main().catch(() => { console.error('Danger-zone operation failed; inspect the CRM schema before retrying.'); process.exitCode = 1; }).finally(() => db.$disconnect());
