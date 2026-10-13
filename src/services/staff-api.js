import { ref } from 'vue'

export const staffAuthenticated = ref(false)
let csrfToken = ''
let sessionGeneration = 0
const resetListeners = new Set()
export function onStaffReset(callback) { resetListeners.add(callback) }
export function clearStaffSession() {
  sessionGeneration++
  csrfToken = ''
  staffAuthenticated.value = false
  resetListeners.forEach(callback => callback())
}
// Remove credentials and private caches left by earlier versions.
try {
  sessionStorage.removeItem('beer_run_staff_pin')
  sessionStorage.removeItem('beer_run_staff_auth')
  for (const key of ['beer_run_confirmed_athletes', 'beer_run_athlete_waitlist', 'beer_run_sponsorship_proposals']) localStorage.removeItem(key)
} catch {}

export async function staffRequest(path, body) {
  const generation = sessionGeneration
  const response = await fetch('/api/staff/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Staff-CSRF': csrfToken },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  let data
  try { data = await response.json() } catch { throw new Error('Não foi possível acessar o painel. Tente novamente.') }
  if (generation !== sessionGeneration) throw new Error('A sessão foi encerrada. Entre novamente.')
  if (!response.ok) {
    if (response.status === 401) clearStaffSession()
    throw new Error(data.error?.message || 'Não foi possível concluir a operação.')
  }
  return data
}
function acceptSession(data) {
  if (!/^[a-f0-9]{64}$/.test(data.csrfToken) || !Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= Date.now()) throw new Error('Sessão inválida.')
  csrfToken = data.csrfToken
  staffAuthenticated.value = true
}
export async function loginStaff(pin) { acceptSession(await staffRequest('login', { pin })) }
export async function restoreStaffSession() {
  try { acceptSession(await staffRequest('session')); return true }
  catch { clearStaffSession(); return false }
}
export async function logoutStaff() {
  await staffRequest('logout', {})
  clearStaffSession()
}
export function staffMutation(action, id, data, pin) {
  return staffRequest('operations', { action, ...(id == null ? {} : { id }), ...(data === undefined ? {} : { data }), ...(pin === undefined ? {} : { pin }) })
}
