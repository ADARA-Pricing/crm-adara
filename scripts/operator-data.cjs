// Targeted additive change for an existing manually provisioned CRM database.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const path = require('node:path');
const url = new URL(process.env.DATABASE_URL);
if (url.searchParams.get('schema') !== 'crm') throw new Error('Expected CRM schema');
if (url.hostname.endsWith('.pooler.supabase.com')) url.port = '5432';
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
async function main() {
  if (process.argv[2] === 'photo-check' || process.argv[2] === 'photo-apply') {
    const existing = await db.$queryRawUnsafe("SELECT to_regclass('crm.\"OperatorAvatarPhoto\"')::text AS name");
    console.log(JSON.stringify({ schema: 'crm', photoExists: !!existing[0].name }));
    if (process.argv[2] === 'photo-check') return;
    if (existing[0].name) throw new Error('Photo table already exists');
    const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260908190000_operator_avatar_photo/migration.sql'), 'utf8');
    await db.$transaction(async tx => { for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement); });
    console.log('Applied only CRM avatar photo table.'); return;
  }
  const columns = await db.$queryRawUnsafe("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='crm' AND table_name IN ('UserProfile','Conversation','OperatorMessageRead')");
  const has = (table, column) => columns.some(r => r.table_name === table && r.column_name === column);
  if (!has('UserProfile', 'displayName') || !has('Conversation', 'id')) throw new Error('Existing CRM prerequisite missing');
  const avatar = has('UserProfile', 'avatarColor');
  const reads = has('OperatorMessageRead', 'messageId');
  console.log(JSON.stringify({ schema: 'crm', avatar, reads }));
  if (process.argv[2] !== 'apply') return;
  if (avatar || reads) throw new Error('New objects already exist; inspect before applying');
  const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260908180000_operator_profiles_and_reads/migration.sql'), 'utf8');
  await db.$transaction(async tx => {
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
  });
  console.log('Applied only operator profile and read tracking additions to crm.');
}
main().catch(() => { console.error('Operator data operation failed; inspect schema before retrying.'); process.exitCode = 1; }).finally(() => db.$disconnect());
