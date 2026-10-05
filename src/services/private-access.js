const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
let incoming = null

export function createPrivateAccessLink(context, origin = window.location.origin) {
  if (!uuid.test(context?.orderId) || !uuid.test(context?.key)) throw new Error('Acesso inválido.')
  const url = new URL('/pagamento-concluido', origin)
  // O fragmento nao e enviado ao servidor HTTP nem no Referer.
  url.hash = new URLSearchParams({ pedido: context.orderId, acesso: context.key }).toString()
  return url.href
}

export function capturePrivateAccessLink() {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.hash.slice(1))
  if (!params.has('acesso') && !params.has('pedido')) return
  const orderId = params.get('pedido'), key = params.get('acesso')
  // Remover inclusive links invalidos antes de iniciar analytics ou chamadas de rede.
  url.hash = ''
  window.history.replaceState(null, '', url.pathname + url.search)
  incoming = uuid.test(orderId || '') && uuid.test(key || '')
    ? { orderId, key } : { error: 'Este link de acesso é inválido. Confira se copiou o link completo.' }
}

export function takePrivateAccessLink() {
  capturePrivateAccessLink()
  const result = incoming
  incoming = null
  return result
}
