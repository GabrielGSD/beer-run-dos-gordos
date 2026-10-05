import test from 'node:test'
import assert from 'node:assert/strict'
import { isActiveWaitlistEntry } from '../src/services/waitlist.js'

test('pagamento retira da fila ativa preservando o historico', () => {
  const entries = ['waiting', 'called', 'registered', 'cancelled', null, 'unknown'].map(status => ({ status }))
  assert.equal(entries.filter(isActiveWaitlistEntry).length, 2)
  entries[1].status = 'registered'
  assert.equal(entries.filter(isActiveWaitlistEntry).length, 1)
  assert.equal(entries.length, 6)
  assert.equal(entries.filter(entry => !isActiveWaitlistEntry(entry)).length, 5)
})
