import { analyticsPage, safeEventParams, safeReferrer } from './analytics-policy.js'

const GA_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || 'G-8RVHDE36SW'
const debug = import.meta.env?.VITE_GA_DEBUG === 'true'
const events = new Set([
  'click_botao_inscricao', 'submit_formulario_inscricao', 'conversao_inscricao_sucesso',
  'join_waitlist', 'sign_up', 'click_patrocinio', 'submit_inscricao_oficial',
  'conversao_inscricao_oficial_sucesso', 'inscricao_visualizada', 'inscricao_consulta',
  'inscricao_inicio', 'inscricao_etapa_visualizada', 'inscricao_etapa_concluida',
  'inscricao_erro', 'inscricao_cupom', 'inscricao_checkout',
])
let initialized = false
let lastPage = null
let previousLocation = ''
const reportedOrders = new Set()

function enabled() {
  if (typeof window === 'undefined') return false
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  return /^G-[A-Z0-9]+$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX' &&
    (!(import.meta.env?.DEV || local) || debug)
}

export function initGA() {
  if (!enabled() || !analyticsPage(window.location.href)) return
  if (initialized) return
  try {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
    const page = analyticsPage(window.location.href)
    previousLocation = safeReferrer(document.referrer)
    window.gtag('js', new Date())
    window.gtag('set', { ...page, page_referrer: previousLocation })
    window.gtag('config', GA_ID, {
      ...page, page_referrer: previousLocation, send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      ...(debug ? { debug_mode: true } : {}),
    })
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const script = document.createElement('script')
      script.id = 'ga-gtag-script'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      document.head.appendChild(script)
    }
    initialized = true
  } catch { /* Analytics nunca pode bloquear a inscricao. */ }
}

// Chamado na navegacao do App. Deduplica entrada inicial e hashchange.
export function trackPageView() {
  if (!enabled()) return
  try {
    const page = analyticsPage(window.location.href)
    window['ga-disable-' + GA_ID] = !page
    if (!page) { lastPage = null; return }
    initGA()
    if (!initialized || lastPage === page.page_location) return
    const fields = { ...page, page_referrer: previousLocation }
    window.gtag('set', fields)
    window.gtag('event', 'page_view', fields)
    lastPage = page.page_location
    previousLocation = page.page_location
  } catch { /* Navegacao continua mesmo se a tag falhar. */ }
}

export function trackEvent(eventName, eventParams = {}) {
  if (!enabled() || !events.has(eventName)) return
  try {
    const page = analyticsPage(window.location.href)
    if (!page || !initialized || !window.gtag) return
    window.gtag('event', eventName, {
      ...safeEventParams(eventParams), ...page, transport_type: 'beacon',
    })
  } catch { /* Nunca interromper formulario, cupom ou checkout. */ }
}

export function trackRegistrationEvent(eventName, params = {}) {
  trackEvent(eventName, { ...params, fluxo: 'inscricao_oficial' })
}

// Repetir a mesma resposta por idempotencia nao conta outra conversao na sessao.
// O identificador fica apenas no navegador; nao e enviado ao Google.
export function trackRegistrationOrder(orderId, params) {
  if (!enabled() || !initialized || !analyticsPage(window.location.href)) return
  if (reportedOrders.has(orderId)) return
  const key = 'beer_run_ga_order_' + orderId
  try { if (sessionStorage.getItem(key)) return } catch { /* Memoria como fallback. */ }
  trackRegistrationEvent('conversao_inscricao_oficial_sucesso', params)
  reportedOrders.add(orderId)
  try { sessionStorage.setItem(key, '1') } catch { /* Memoria como fallback. */ }
}

/**
 * Rastreia clique no botão de Inscrição / Lista de Espera
 * @param {string} source De onde o clique partiu (ex: 'hero', 'footer', 'navbar', 'athletes_list')
 * @param {boolean} isSoldOut Se as vagas estão esgotadas (lista de espera) ou abertas
 */
export function trackRegistrationClick(source = 'geral', isSoldOut = false) {
  const tipo = isSoldOut ? 'lista_de_espera' : 'inscricao_normal'

  trackEvent('click_botao_inscricao', {
    origem: source,
    tipo: tipo,
    status_vagas: isSoldOut ? 'esgotado' : 'aberto'
  })
}

/**
 * Rastreia tentativa de envio do formulário de inscrição
 */
export function trackRegistrationSubmit(modality = 'desconhecido', isSoldOut = false) {
  trackEvent('submit_formulario_inscricao', {
    modalidade: modality,
    tipo: isSoldOut ? 'lista_de_espera' : 'inscricao_normal'
  })
}

/**
 * Rastreia conversão garantida (inscrição realizada ou entrada na lista de espera com sucesso)
 */
export function trackRegistrationSuccess(athleteData = {}, isSoldOut = false) {
  const tipo = isSoldOut ? 'lista_de_espera' : 'inscricao_normal'

  // Evento personalizado detalhado
  trackEvent('conversao_inscricao_sucesso', {
    tipo: tipo,
    modalidade: athleteData?.modality || 'desconhecida',
    bebe_cerveja: athleteData?.drinksBeer ? 'sim' : 'nao'
  })

  // Evento padrão recomendado do Google Analytics
  trackEvent(isSoldOut ? 'join_waitlist' : 'sign_up', {
    method: tipo
  })
}

/**
 * Rastreia clique no botão de patrocínio
 */
export function trackSponsorshipClick(source = 'geral') {
  trackEvent('click_patrocinio', {
    origem: source
  })
}
