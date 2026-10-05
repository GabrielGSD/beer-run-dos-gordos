import { trackRegistrationEvent } from './analytics.js'

const apiBase = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '')
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const pendingKey = 'beer_run_pending_request_v1'
const contextPrefix = 'beer_run_order_v1_'

export function saveOrderContext(orderId, key) {
  if (!uuid.test(orderId) || !uuid.test(key)) throw new Error('Pedido ou chave inválida.')
  localStorage.setItem(contextPrefix + orderId, JSON.stringify({ orderId, key }))
  localStorage.setItem('beer_run_last_order_v1', orderId)
  return { orderId, key }
}
export function loadOrderContext(orderId) {
  try {
    const id = orderId || localStorage.getItem('beer_run_last_order_v1')
    const context = JSON.parse(localStorage.getItem(contextPrefix + id) || 'null')
    return context && uuid.test(context.orderId) && uuid.test(context.key) ? context : null
  } catch { return null }
}
async function request(path, { key, body } = {}) {
  if (!apiBase) throw new Error('O serviço de inscrições ainda não foi configurado. Entre em contato com a organização.')
  let response
  try {
    response = await fetch(apiBase + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(key ? { 'Idempotency-Key': key } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(25000),
    })
  } catch { throw new Error('Não foi possível concluir a consulta. Tente novamente com os mesmos dados.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Não foi possível consultar seu pedido.')
    error.status = response.status
    error.code = data?.error?.code
    error.retryAfter = Number(response.headers.get('Retry-After')) || 0
    throw error
  }
  return data
}
export async function submitRegistration(body) {
  // Persistir a chave antes do POST permite recuperar um commit apos timeout.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)))
  const hash = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('')
  let pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null')
  if (pending && pending.hash !== hash) throw new Error('Existe uma tentativa pendente. Reenvie os dados originais antes de alterar a inscrição.')
  if (!pending) pending = { hash, key: crypto.randomUUID() }
  sessionStorage.setItem(pendingKey, JSON.stringify(pending))
  // Detectar navegador sem armazenamento antes de criar a inscricao.
  localStorage.setItem('beer_run_storage_check', '1'); localStorage.removeItem('beer_run_storage_check')
  try {
    const result = await request('/api/registrations', { key: pending.key, body })
    saveOrderContext(result.orderId, pending.key)
    sessionStorage.removeItem(pendingKey)
    return result
  } catch (error) {
    if ([409, 422].includes(error.status)) sessionStorage.removeItem(pendingKey)
    throw error
  }
}
export const getOrderStatus = context => request('/api/orders/' + context.orderId + '/status', context)
export const refreshOrderPayment = context => request('/api/orders/' + context.orderId + '/refresh', { ...context, body: {} })
export const refreshPaymentByPhone = phone => request('/api/registrations/payment-check', { body: { phone } })
export const quoteCoupon = body => request('/api/coupons/quote', { body })
export function getRegistrationEligibility(phone) {
  const context = loadOrderContext()
  return request('/api/registrations/eligibility', {
    ...(context ? { key: context.key } : {}),
    body: { phone, ...(context ? { orderId: context.orderId } : {}) },
  })
}
export const reconcileOrder = (context, reference) => request('/api/orders/' + context.orderId + '/reconcile', { ...context, body: reference })
export const recoverCheckout = context => request('/api/orders/' + context.orderId + '/checkout', { ...context, body: {} })
export function openCheckout(checkoutUrl) {
  const url = new URL(checkoutUrl)
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
    !['checkout.infinitepay.io', 'checkout.infinitepay.com.br', 'buy.infinitepay.io'].includes(url.hostname)) {
    throw new Error('Link de pagamento inválido. Entre em contato com a organização.')
  }
  trackRegistrationEvent('inscricao_checkout')
  window.location.assign(url.href)
}
