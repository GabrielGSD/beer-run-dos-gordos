import assert from 'node:assert/strict'
import { buildParticipants, filterParticipants, formatRaffleAthleteName, randomIndex, normalizeName, restoreRaffle, saveRaffle } from '../src/services/raffle.js'

const entries = buildParticipants(
  [{ id: 1, name: 'Ana', payment_status: 'pending_payment' }, { id: 2, name: 'Ana', modality: 'kids' }, { id: 1, name: 'Ana' }],
  [{ id: 1, name: 'Ana' }, { id: 2, name: 'João' }],
)
assert.equal(entries.length, 4, 'Includes pending athletes, Kids and staff; keeps homonyms, deduplicates only record IDs')
assert.equal(new Set(entries.map(row => row.id)).size, 4)
assert.equal(normalizeName('  JOÃO  Souza '), normalizeName('Joao Souza'))
assert.equal(formatRaffleAthleteName('Sophia Carvalho Fernandes Borelli', 'Soso'), 'Sophia "Soso" Borelli')
assert.equal(formatRaffleAthleteName('  João   da Silva  ', ' “Jojô” '), 'João "Jojô" Silva')
assert.equal(formatRaffleAthleteName('Maria de Souza', null), 'Maria Souza')
assert.equal(formatRaffleAthleteName('Ana', 'Aninha'), 'Ana "Aninha"')
assert.equal(formatRaffleAthleteName('Ana', ''), 'Ana')
assert.equal(formatRaffleAthleteName('', 'Aninha'), '')
assert.equal(formatRaffleAthleteName('João "Jojô" da Silva', null), 'João "Jojô" Silva')
assert.equal(formatRaffleAthleteName('João "Jojô" da Silva', 'Jão'), 'João "Jão" Silva')
assert.equal(formatRaffleAthleteName('Ana Maria D’Ávila', '   '), 'Ana D’Ávila')
const named = buildParticipants([{ id: 42, name: 'Sophia Carvalho Fernandes Borelli', nickname: 'Soso' }], [{ id: 3, name: 'João da Equipe' }])
assert.equal(named[0].name, 'Sophia Carvalho Fernandes Borelli', 'Retains full name for searching and duplicate checks')
assert.equal(named[0].displayName, 'Sophia "Soso" Borelli')
assert.equal(named[1].name, 'João da Equipe', 'Staff names are preserved')
const groups = buildParticipants([
  { id: 1, name: 'Ana', modality: 'corrida' },
  { id: 2, name: 'Bia', modality: 'kids' },
  { id: 3, name: 'Caio', modality: 'kids' },
  { id: 4, name: 'Dani' },
  { id: 5, name: 'Eli', modality: 'caminhada' },
], [{ id: 1, name: 'Maria' }])
assert.deepEqual(filterParticipants(groups, 'kids').map(entry => entry.id), ['athlete:2', 'athlete:3'])
assert.equal(filterParticipants(groups, 'all').length, 6, 'All includes unknown modalities and staff')
const withGuests = [...groups, { id: 'extra:1', source: 'Extra', isChild: true }, { id: 'extra:2', source: 'Extra', isChild: false }, { id: 'extra:3', source: 'Extra' }]
const kidsIds = new Set(filterParticipants(withGuests, 'kids').map(entry => entry.id))
const adultIds = new Set(filterParticipants(withGuests, 'adults').map(entry => entry.id))
assert.deepEqual([...adultIds], ['athlete:1', 'athlete:4', 'athlete:5', 'staff:1', 'extra:2', 'extra:3'], 'Adults includes staff, unclassified records and non-Kids guests')
assert.equal([...adultIds].some(id => kidsIds.has(id)), false, 'Adults and Kids never overlap')
assert.equal(adultIds.size + kidsIds.size, withGuests.length, 'Adults is exactly everyone minus Kids')
assert.equal(filterParticipants([{ isChild: 'false' }], 'kids').length, 0)
let stored = null
globalThis.sessionStorage = { getItem: () => stored, setItem: (_, value) => { stored = value } }
assert.equal(restoreRaffle().audience, 'all', 'Old sessions default to everyone')
saveRaffle({ extras: [{ id: 'extra:1', name: 'Convidada', source: 'Extra', isChild: true }], audience: 'kids', history: [], allowRepeat: false })
assert.equal(restoreRaffle().audience, 'kids')
assert.equal(filterParticipants(restoreRaffle().extras, 'kids').length, 1, 'Guest classification survives reload')
saveRaffle({ ...restoreRaffle(), audience: 'adults' })
assert.equal(restoreRaffle().audience, 'adults', 'Adult selection survives reload')
stored = JSON.stringify({ audience: 'invalid' })
assert.equal(restoreRaffle().audience, 'all')
assert.throws(() => randomIndex(0))
assert.equal(randomIndex(1, values => { values[0] = 123 }), 0)
let samples = [0xffffffff, 4], calls = 0
assert.equal(randomIndex(3, values => { values[0] = samples[calls++] }), 1)
assert.equal(calls, 2, 'Rejects out-of-range samples to avoid modulo bias')
for (const length of [1, 2, 3, 71, 150, 1000]) {
  const chosen = new Set()
  for (let index = 0; index < length; index++) {
    chosen.add(randomIndex(length, values => { values[0] = index }))
  }
  assert.equal(chosen.size, length, 'Every entry can win, including the last')
}
console.log('PASS: complete participant list, identities, duplicate names and uniform random selection.')
