import pg from 'pg'
const { Client } = pg

const PROJECT = 'slditugdqitqeiijlwex'
const PASSWORD = '27k0jn1My5PTwtye'

const REGIONS = [
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-eu-west-3',
  'aws-0-eu-north-1',
  'aws-0-eu-central-1',
  'aws-0-eu-central-2',
  'aws-0-us-east-1',
  'aws-0-us-east-2',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-ap-southeast-1',
  'aws-0-ap-southeast-2',
  'aws-0-ap-northeast-1',
  'aws-0-ap-south-1',
  'aws-0-ca-central-1',
  'aws-0-sa-east-1',
]

async function tryRegion(region, port = 5432) {
  const host   = `${region}.pooler.supabase.com`
  const user   = `postgres.${PROJECT}`
  const connStr = `postgresql://${user}:${PASSWORD}@${host}:${port}/postgres`

  const client = new Client({
    connectionString: connStr,
    ssl:              { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
    query_timeout:           5000,
  })

  try {
    await client.connect()
    const { rows } = await client.query('SELECT current_database() AS db, version() AS v')
    await client.end()
    console.log(`\n✅  GEFUNDEN: ${region}:${port}`)
    console.log(`   DB: ${rows[0].db}`)
    return { region, port, connStr }
  } catch (err) {
    process.stdout.write(`.`)
    return null
  }
}

console.log('Suche Pooler-Region')
console.log('(jeder Punkt = 1 fehlgeschlagener Versuch)')

const attempts = REGIONS.flatMap(r => [
  tryRegion(r, 5432),   // session pooler
  tryRegion(r, 6543),   // transaction pooler
])

const results = await Promise.all(attempts)
const found   = results.filter(Boolean)

if (found.length === 0) {
  console.log('\n\n❌  Keine Region gefunden. Pooler noch nicht bereit.')
  console.log('   → Bitte Migration manuell via SQL Editor ausführen.')
} else {
  console.log(`\n\nFunktionierende Verbindungen:`)
  for (const r of found) {
    console.log(`  ${r.connStr.split('@')[1]}`)
  }
}
