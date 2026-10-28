import { request, saveOrderContext } from './checkout.js'

const pendingKey = 'beer_run_staff_registration_pending_v1'
const completedKey = 'beer_run_staff_registration_completed_v1'
export function loadStaffRegistration() {
  try { return { pending: JSON.parse(sessionStorage.getItem(pendingKey) || 'null'), result: JSON.parse(sessionStorage.getItem(completedKey) || 'null') } }
  catch { return { pending: null, result: null } }
}
export const getStaffOffer = () => request('/api/registrations/staff/offer')
export async function submitStaffRegistration(registration, invitationCode) {
  let pending = loadStaffRegistration().pending
  const serialized = JSON.stringify(registration)
  if (pending && JSON.stringify(pending.registration) !== serialized) throw new Error('Há uma tentativa pendente. Reenvie os dados originais para recuperar o cadastro.')
  pending ||= { key: crypto.randomUUID(), registration }
  sessionStorage.setItem(pendingKey, JSON.stringify(pending))
  localStorage.setItem('beer_run_storage_check', '1'); localStorage.removeItem('beer_run_storage_check')
  try {
    const result = await request('/api/registrations/staff', { key: pending.key, body: { registration, ...(invitationCode ? { invitationCode } : {}) } })
    if (result.orderId) saveOrderContext(result.orderId, pending.key)
    sessionStorage.setItem(completedKey, JSON.stringify(result))
    sessionStorage.removeItem(pendingKey)
    return result
  } catch (error) {
    if ([403, 409, 422].includes(error.status) || ['STAFF_REGISTRATION_DISABLED', 'CHECKOUT_DISABLED'].includes(error.code)) sessionStorage.removeItem(pendingKey)
    throw error
  }
}
