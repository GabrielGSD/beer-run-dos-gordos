import { onStaffReset } from './staff-api.js'

const STORAGE_KEY = 'beer_run_raffle_session_v1'
onStaffReset(() => { try { sessionStorage.removeItem(STORAGE_KEY) } catch {} })

export function normalizeName(value) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
}

export function formatRaffleAthleteName(name, nickname) {
  const fullName = typeof name === 'string' ? name.trim() : ''
  if (!fullName) return ''
  // Older registrations may already contain a nickname between quotes.
  const embedded = fullName.match(/["“]([^"”]+)["”]/)
  const parts = fullName.replace(/["“][^"”]+["”]/g, '').trim().split(/\s+/).filter(Boolean)
  const nick = (typeof nickname === 'string' && nickname.trim() ? nickname : embedded?.[1] || '')
    .trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim().replace(/\s+/g, ' ')
  return [parts[0], nick ? `"${nick}"` : '', parts.length > 1 ? parts.at(-1) : ''].filter(Boolean).join(' ')
}

// Identical names can belong to different people. Keep the source record identity.
export function buildParticipants(athletes, team) {
  const seen = new Set()
  return [
    ...athletes.map(row => ({ id: `athlete:${row.id}`, name: row.name, displayName: formatRaffleAthleteName(row.name, row.nickname), source: 'Atleta', isChild: row.modality === 'kids' })),
    ...team.map(row => ({ id: `staff:${row.id}`, name: row.name, source: 'Staff' })),
  ].filter(row => {
    if (!row.name?.trim() || seen.has(row.id)) return false
    seen.add(row.id)
    row.name = row.name.trim()
    return true
  })
}

export function filterParticipants(participants, audience) {
  if (audience === 'kids') return participants.filter(entry => entry.isChild === true)
  if (audience === 'adults') return participants.filter(entry => entry.isChild !== true)
  return participants
}

// Rejection sampling avoids modulo bias: every entry has the same chance.
export function randomIndex(length, random = values => crypto.getRandomValues(values)) {
  if (!Number.isSafeInteger(length) || length < 1 || length > 0x100000000) throw new Error('Lista inválida para o sorteio.')
  const limit = 0x100000000 - (0x100000000 % length)
  const values = new Uint32Array(1)
  do { random(values) } while (values[0] >= limit)
  return values[0] % length
}

const validEntry = row => row && typeof row.id === 'string' && typeof row.name === 'string' && row.name.trim() && ['Atleta', 'Staff', 'Extra'].includes(row.source)
export function restoreRaffle() {
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    return {
      extras: Array.isArray(data?.extras) ? data.extras.filter(row => validEntry(row) && row.source === 'Extra') : [],
      history: Array.isArray(data?.history) ? data.history.filter(row => validEntry(row) && Number.isFinite(Date.parse(row.drawnAt))) : [],
      allowRepeat: data?.allowRepeat === true,
      audience: ['kids', 'adults'].includes(data?.audience) ? data.audience : 'all',
    }
  } catch { return { extras: [], history: [], allowRepeat: false, audience: 'all' } }
}

export function saveRaffle(data) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true } catch { return false }
}
