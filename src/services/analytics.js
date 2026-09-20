/**
 * Google Analytics 4 (GA4) Service
 * 
 * Responsável por gerenciar o rastreamento de acessos (pageviews)
 * e eventos customizados (como cliques em "Inscrição", "Lista de Espera" e conversões).
 * 
 * Para ativar a coleta real de dados, basta adicionar no seu arquivo .env:
 * VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-8RVHDE36SW'

/**
 * Inicializa o script do Google Analytics 4 dinamicamente
 */
export function initGA() {
  if (typeof window === 'undefined') return

  // Garante que o dataLayer exista
  window.dataLayer = window.dataLayer || []

  // Função padrão gtag se ainda não declarada
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
  }

  // Se a tag já foi inserida no index.html, não reinjeta o script
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)
  if (existingScript) {
    return
  }

  // Se não houver ID configurado ou for o padrão de exemplo, opera em modo seguro (mock/log em dev)
  if (!GA_ID || GA_ID === 'G-XXXXXXXXXX' || !GA_ID.startsWith('G-')) {
    if (import.meta.env.DEV) {
      console.info(
        'ℹ️ [Analytics] Google Analytics rodando em modo simulação. Adicione VITE_GA_MEASUREMENT_ID no seu .env para enviar ao Google.'
      )
    }
    return
  }

  const script = document.createElement('script')
  script.id = 'ga-gtag-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    send_page_view: true
  })

  console.info(`✅ [Analytics] Google Analytics 4 conectado com sucesso (${GA_ID})`)
}

/**
 * Dispara um evento personalizado no GA4
 * @param {string} eventName Nome do evento (ex: click_botao_inscricao)
 * @param {object} eventParams Parâmetros adicionais do evento
 */
export function trackEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined' || !window.gtag) return

  try {
    window.gtag('event', eventName, eventParams)

    if (import.meta.env.DEV) {
      console.log(`📊 [Analytics Evento] "${eventName}":`, eventParams)
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao disparar evento:', err)
  }
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
