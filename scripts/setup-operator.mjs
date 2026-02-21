/**
 * Setup operator account via Supabase REST + Auth Admin API
 */

const BASE    = 'https://slditugdqitqeiijlwex.supabase.co'
const SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZGl0dWdkcWl0cWVpaWpsd2V4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYxNDcxNywiZXhwIjoyMDg3MTkwNzE3fQ.5BkHwNQnJxScjXrvZvkmtvtPTZ8lAsBHARWyAQHeHdI'

const OPERATOR_EMAIL    = 'fraz-ahmed@web.de'
const TEMP_PASSWORD     = 'Faraz123'
const COMPANY_NAME      = 'Parkservice Frankfurt GmbH'
const COMPANY_SLUG      = 'parkservice-frankfurt'
const COMPANY_EMAIL     = 'info@parkservice-frankfurt.de'

const headers = {
  'Content-Type':  'application/json',
  'apikey':        SERVICE,
  'Authorization': `Bearer ${SERVICE}`,
  'Prefer':        'return=representation',
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' Parkly – Betreiber-Setup')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// ── 1. Tenant erstellen ────────────────────────────────────────────────────
console.log('1/4  Erstelle Tenant...')
let tenantId

const existingTenants = await api('GET', `/rest/v1/tenants?slug=eq.${COMPANY_SLUG}&select=id`)
if (Array.isArray(existingTenants) && existingTenants.length > 0) {
  tenantId = existingTenants[0].id
  console.log(`     ℹ️  Tenant bereits vorhanden (${tenantId.slice(0,8)}...)`)
} else {
  const tenant = await api('POST', '/rest/v1/tenants', {
    name:     COMPANY_NAME,
    slug:     COMPANY_SLUG,
    email:    COMPANY_EMAIL,
    settings: { tax_rate: 19, currency: 'EUR' },
  })
  tenantId = Array.isArray(tenant) ? tenant[0].id : tenant.id
  console.log(`     ✅  Tenant erstellt: ${tenantId.slice(0,8)}...`)
}

// ── 2. Auth-User erstellen ────────────────────────────────────────────────
console.log(`\n2/4  Erstelle Auth-Account für ${OPERATOR_EMAIL}...`)
let userId

try {
  const authUser = await api('POST', '/auth/v1/admin/users', {
    email:          OPERATOR_EMAIL,
    password:       TEMP_PASSWORD,
    email_confirm:  true,
    user_metadata:  { first_name: 'Faraz', last_name: 'Ahmed' },
  })
  userId = authUser.id
  console.log(`     ✅  Auth-Account erstellt (${userId.slice(0,8)}...)`)
} catch (err) {
  // User might already exist
  if (err.message.includes('already been registered') || err.message.includes('already exists')) {
    console.log('     ℹ️  Account existiert bereits – suche User-ID...')
    const users = await api('GET', `/auth/v1/admin/users?email=${encodeURIComponent(OPERATOR_EMAIL)}`)
    const userList = users.users ?? users
    if (Array.isArray(userList) && userList.length > 0) {
      userId = userList[0].id
      console.log(`     ✅  User gefunden (${userId.slice(0,8)}...)`)
    } else {
      throw new Error('Konnte bestehenden User nicht finden: ' + err.message)
    }
  } else {
    throw err
  }
}

// ── 3. Profil aktualisieren ───────────────────────────────────────────────
console.log(`\n3/4  Setze Rolle auf 'operator' und weise Tenant zu...`)
await api('PATCH', `/rest/v1/profiles?id=eq.${userId}`, {
  role:       'operator',
  tenant_id:  tenantId,
  first_name: 'Faraz',
  last_name:  'Ahmed',
  is_active:  true,
})
console.log('     ✅  Profil aktualisiert')

// ── 4. Demo-Parkplatz erstellen ───────────────────────────────────────────
console.log('\n4/4  Erstelle Demo-Parkplatz...')
const airports = await api('GET', '/rest/v1/airports?iata_code=eq.FRA&select=id')
const airportId = airports[0]?.id

if (airportId) {
  const existingLots = await api('GET', `/rest/v1/parking_lots?tenant_id=eq.${tenantId}&select=id`)
  if (!existingLots.length) {
    await api('POST', '/rest/v1/parking_lots', {
      tenant_id:           tenantId,
      airport_id:          airportId,
      name:                'P1 – Valet Premium',
      description:         'Direkter Valet-Service am Flughafen Frankfurt. Überdachte Stellplätze, 24/7 Videoüberwachung.',
      address:             'Cargo City Nord, 60549 Frankfurt am Main',
      distance_to_airport: 800,
      price_per_day:       24.90,
      total_capacity:      150,
      available_spots:     120,
      shuttle_available:   true,
      valet_available:     true,
      features:            ['covered', 'cctv', '24h', 'valet', 'shuttle'],
      is_active:           true,
    })
    console.log('     ✅  Demo-Parkplatz "P1 – Valet Premium" (FRA) erstellt')
  } else {
    console.log('     ℹ️  Parkplatz bereits vorhanden')
  }
} else {
  console.log('     ⚠️  Frankfurt-Flughafen nicht gefunden (Seed-Daten fehlen?)')
}

// ── Zusammenfassung ───────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' ✅  Setup abgeschlossen!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\n Betreiber-Login:`)
console.log(`   URL:       http://localhost:3001/auth/operator-login`)
console.log(`   E-Mail:    ${OPERATOR_EMAIL}`)
console.log(`   Passwort:  ${TEMP_PASSWORD}`)
console.log(`\n Tenant:     ${COMPANY_NAME}`)
console.log(`   ID:        ${tenantId}`)
console.log('\n ⚠️  Bitte Passwort nach dem ersten Login ändern!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
