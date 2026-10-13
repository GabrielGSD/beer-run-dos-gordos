import test from 'node:test'
import assert from 'node:assert/strict'
let sequence = 0
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })
const session = () => ({ csrfToken: 'b'.repeat(64), expiresAt: new Date(Date.now() + 3600000).toISOString() })
async function setup(t, fetcher) {
  const oldFetch = globalThis.fetch
  const storage = new Map([['beer_run_staff_pin', 'old-password'], ['beer_run_staff_auth', 'true'], ['beer_run_athlete_waitlist', 'private-data']])
  globalThis.sessionStorage = globalThis.localStorage = { removeItem: key => storage.delete(key) }
  globalThis.fetch = fetcher
  t.after(() => { globalThis.fetch = oldFetch; delete globalThis.sessionStorage; delete globalThis.localStorage })
  const api = await import('../src/services/staff-api.js?test=' + sequence++)
  return { api, storage }
}
test('login usa cookie da mesma origem, nao persiste senha e limpa caches antigos', async t => {
  const { api, storage } = await setup(t, async (url, options) => {
    assert.equal(url, '/api/staff/login')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.headers.Authorization, undefined)
    assert.deepEqual(JSON.parse(options.body), { pin: 'entered-test-only' })
    return json(session())
  })
  assert.equal(storage.size, 0)
  await api.loginStaff('entered-test-only')
  assert.equal(api.staffAuthenticated.value, true)
  assert.equal(storage.size, 0)
})
test('mutacao envia CSRF sem senha; logout confirma revogacao antes de limpar', async t => {
  let call = 0, reset = 0
  const { api } = await setup(t, async (url, options) => {
    call++
    if (call === 1) return json(session())
    assert.equal(options.headers['X-Staff-CSRF'], 'b'.repeat(64))
    if (call === 2) {
      assert.deepEqual(JSON.parse(options.body), { action: 'athlete.checkin', id: 1, data: { is_checked_in: true } })
      return json({ success: true })
    }
    assert.equal(url, '/api/staff/logout')
    return call === 3 ? json({ error: { message: 'Indisponível' } }, 503) : json({ success: true })
  })
  api.onStaffReset(() => reset++)
  await api.loginStaff('test-only')
  await api.staffMutation('athlete.checkin', 1, { is_checked_in: true })
  await assert.rejects(api.logoutStaff(), /Indisponível/)
  assert.equal(api.staffAuthenticated.value, true)
  await api.logoutStaff()
  assert.equal(api.staffAuthenticated.value, false)
  assert.equal(reset, 1)
})
test('sessao expirada limpa dados e resposta atrasada nao restaura dados apos logout', async t => {
  let respond
  const { api } = await setup(t, () => new Promise(resolve => { respond = resolve }))
  const pending = api.staffRequest('athletes')
  api.clearStaffSession()
  respond(json({ athletes: [{ phone: 'private' }] }))
  await assert.rejects(pending, /sessão foi encerrada/)
  globalThis.fetch = async () => json({ error: { message: 'Expirou' } }, 401)
  assert.equal(await api.restoreStaffSession(), false)
  assert.equal(api.staffAuthenticated.value, false)
})
test('resposta de sessao invalida nunca autentica', async t => {
  const { api } = await setup(t, async () => json({ csrfToken: 'b'.repeat(64), expiresAt: 'invalid' }))
  await assert.rejects(api.loginStaff('test-only'), /Sessão inválida/)
  assert.equal(api.staffAuthenticated.value, false)
})
