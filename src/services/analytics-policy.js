// Contrato fechado: nunca encaminhar formulario, mensagens de erro ou URLs ao GA.
const choices = {
  fluxo: ['inscricao_oficial'],
  modalidade: ['corrida', 'caminhada', 'desconhecido', 'desconhecida'],
  espetinhos: ['1 Carne + 1 Frango', '2 Carne', '2 Frango', 'Vegetariano'],
  camiseta: ['P', 'M', 'G', 'GG', 'EXG', 'EXGG', 'G1', 'G2', 'G3'],
  chopp: [true, false],
  bebe_cerveja: ['sim', 'nao'],
  com_cupom: ['sim', 'nao'],
  retomada: ['sim', 'nao'],
  origem: ['geral', 'hero', 'footer', 'navbar', 'athletes_list', 'manifesto', 'manual', 'link',
    'rodape_banner', 'hero_inscricao', 'atletas_topo_rapido', 'atletas_busca_vazia',
    'atletas_faixa_rodape', 'menu_superior_desktop', 'menu_superior_mobile'],
  tipo: ['lista_de_espera', 'inscricao_normal'],
  method: ['lista_de_espera', 'inscricao_normal'],
  status_vagas: ['esgotado', 'aberto'],
  resultado: ['tentativa', 'localizado', 'nao_encontrado', 'pedido_existente', 'status_disponivel', 'erro', 'aplicado', 'formato_invalido', 'rejeitado', 'indisponivel'],
  tipo_erro: ['validacao', 'consulta', 'envio', 'conflito', 'limite', 'servico', 'conexao'],
  currency: ['BRL'],
}

export function safeEventParams(params = {}) {
  const result = {}
  for (const [key, value] of Object.entries(params)) {
    if (choices[key]?.includes(value)) result[key] = value
    if (key === 'etapa' && Number.isInteger(value) && value >= 1 && value <= 5) result[key] = value
    if (['value', 'desconto'].includes(key) && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000) result[key] = Math.round(value * 100) / 100
  }
  return result
}

export function analyticsPage(href) {
  const url = new URL(href)
  if (url.pathname.replace(/\/+$/, '') === '/pagamento-concluido' || url.hash === '#staff') return null
  const registration = /^#\/?(?:inscricao|cadastro)/.test(url.hash)
  // Nenhum telefone, chave de pedido, fragmento ou parametro da URL real.
  return {
    page_location: url.origin + (registration ? '/inscricao' : '/'),
    page_title: registration ? 'Beer Run | Inscricao' : 'Beer Run | Inicio',
  }
}

export function safeReferrer(value) {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.origin + '/' : '' }
  catch { return '' }
}

export function analyticsErrorKind(error) {
  if (error?.status === 422) return 'validacao'
  if (error?.status === 409) return 'conflito'
  if (error?.status === 429) return 'limite'
  if (error?.status >= 500) return 'servico'
  return 'conexao'
}
