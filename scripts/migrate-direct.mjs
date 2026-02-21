/**
 * Migration script – tries multiple connection strategies:
 * 1. Direct IPv6 address (known from nslookup)
 * 2. Direct hostname (db.slditugdqitqeiijlwex.supabase.co)
 * 3. All pooler regions
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dir = dirname(fileURLToPath(import.meta.url))

const PROJECT  = 'slditugdqitqeiijlwex'
const PASSWORD = '27k0jn1My5PTwtye'
const MIGRATION_FILE = resolve(__dir, '../supabase/migrations/001_initial_schema.sql')
const SEED_FILE      = resolve(__dir, '../supabase/seed.sql')

const CONNECTIONS = [
  // Direct IPv6 (known from DNS)
  `postgresql://postgres:${PASSWORD}@[2a05:d018:135e:16a8:7aa6:5d52:4459:23f0]:5432/postgres`,
  // Direct hostname (might work if Fritz!Box DNS resolves AAAA)
  `postgresql://postgres:${PASSWORD}@db.${PROJECT}.supabase.co:5432/postgres`,
  // Pooler – all regions, both ports
  ...['eu-west-1','eu-west-2','eu-central-1','eu-central-2','eu-north-1',
      'us-east-1','us-east-2','us-west-1','us-west-2',
      'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-south-1',
      'ca-central-1','sa-east-1'].flatMap(r => [
    `postgresql://postgres.${PROJECT}:${PASSWORD}@aws-0-${r}.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT}:${PASSWORD}@aws-0-${r}.pooler.supabase.com:6543/postgres`,
  ]),
]

async function tryConnect(connStr) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000,
  })
  try {
    await client.connect()
    await client.query('SELECT 1')
    console.log(`\n✅  Verbindung erfolgreich!`)
    console.log(`   ${connStr.replace(PASSWORD, '***').split('@')[1]}`)
    return client
  } catch {
    process.stdout.write('.')
    return null
  }
}

console.log(`Verbindungsversuche (${CONNECTIONS.length} Varianten)...`)
let connectedClient = null

for (const connStr of CONNECTIONS) {
  connectedClient = await tryConnect(connStr)
  if (connectedClient) break
}

if (!connectedClient) {
  console.log('\n\n❌  Keine Verbindung möglich.')
  console.log('\nGrund: Ihr Supabase-Projekt nutzt IPv6-only Direktverbindungen.')
  console.log('Der Connection Pooler ist für dieses Projekt noch nicht aktiv.')
  console.log('\n──────────────────────────────────────────────────────')
  console.log('LÖSUNG – Migration manuell ausführen (2 Minuten):')
  console.log('1. https://supabase.com/dashboard/project/slditugdqitqeiijlwex/sql/new öffnen')
  console.log('2. Inhalt von supabase/migrations/001_initial_schema.sql einfügen → Run')
  console.log('3. Inhalt von supabase/seed.sql einfügen → Run')
  console.log('──────────────────────────────────────────────────────')
  process.exit(1)
}

// Run migration
console.log('\nFühre Migration aus...')
const migrationSQL = readFileSync(MIGRATION_FILE, 'utf8')

// Split into individual statements to handle errors gracefully
const statements = migrationSQL
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

let ok = 0, skip = 0
for (const stmt of statements) {
  try {
    await connectedClient.query(stmt)
    ok++
    process.stdout.write('✓')
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      skip++
      process.stdout.write('~')
    } else {
      console.warn(`\nWARN: ${err.message.slice(0, 80)}`)
    }
  }
}
console.log(`\n✅  Migration: ${ok} Statements ausgeführt, ${skip} übersprungen (bereits vorhanden)`)

// Run seed
console.log('\nFühre Seed aus...')
const seedSQL = readFileSync(SEED_FILE, 'utf8')
try {
  await connectedClient.query(seedSQL)
  console.log('✅  Seed-Daten eingespielt')
} catch (err) {
  if (err.message.includes('duplicate') || err.message.includes('unique')) {
    console.log('ℹ️   Seed-Daten bereits vorhanden – übersprungen')
  } else {
    console.warn(`WARN Seed: ${err.message.slice(0, 100)}`)
  }
}

await connectedClient.end()
console.log('\n🎉  Datenbank vollständig eingerichtet!')
console.log('    App läuft auf: http://localhost:3001')
