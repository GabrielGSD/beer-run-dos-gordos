import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsPage, safeEventParams, safeReferrer } from '../src/services/analytics-policy.js'

test('URLs e parametros nunca encaminham telefone, chave, cupom ou dados pessoais', () => {
  assert.deepEqual(analyticsPage('https://beer.example/?cpf=52998224725#inscricao?tel=35999991234'), {
    page_location: 'https://beer.example/inscricao', page_title: 'Beer Run | Inscricao',
  })
  assert.equal(analyticsPage('https://beer.example/pagamento-concluido/?orderId=secret#acesso=secret'), null)
  assert.equal(analyticsPage('https://beer.example/#staff'), null)
  assert.equal(safeReferrer('https://other.example/path?phone=35999991234#secret'), 'https://other.example/')
  assert.equal(safeReferrer('javascript:alert(1)'), '')
  assert.deepEqual(safeEventParams({
    modalidade: 'corrida', camiseta: 'G', chopp: true, etapa: 3, value: 75,
    phone: '35999991234', name: 'Atleta', cpf: '52998224725', couponCode: 'secret',
    orderId: 'secret', key: 'secret', medicalNotes: 'secret', error: 'email@example.com',
    page_location: 'https://secret.example', origem: 'email@example.com',
  }), { modalidade: 'corrida', camiseta: 'G', chopp: true, etapa: 3, value: 75 })
  assert.deepEqual(safeEventParams({ value: NaN, desconto: -1, etapa: 42, camiseta: 'email@example.com' }), {})
})

test('pageviews unicos, conversao deduplicada, exclusao privada e falha da tag sem impacto', async () => {
  const inserted = []
  const storage = new Map()
  globalThis.window = { location: new URL('https://beer.example/#inscricao?tel=35999991234') }
  globalThis.document = {
    referrer: 'https://search.example/?private=secret',
    querySelector: () => null, createElement: () => ({}), head: { appendChild: s => inserted.push(s) },
  }
  globalThis.sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
  const ga = await import('../src/services/analytics.js')
  ga.initGA(); ga.trackPageView(); ga.trackPageView()
  const commands = () => window.dataLayer.map(args => Array.from(args))
  const events = () => commands().filter(args => args[0] === 'event')
  assert.equal(inserted.length, 1)
  assert.equal(commands().find(args => args[0] === 'config')[2].send_page_view, false)
  assert.equal(events().filter(args => args[1] === 'page_view').length, 1)
  ga.trackRegistrationOrder('private-order', { value: 75, currency: 'BRL', phone: '35999991234' })
  ga.trackRegistrationOrder('private-order', { value: 75 })
  assert.equal(events().filter(args => args[1] === 'conversao_inscricao_oficial_sucesso').length, 1)
  assert.ok(!JSON.stringify(commands()).includes('private-order'))
  assert.ok(!JSON.stringify(commands()).includes('35999991234'))
  assert.ok(!JSON.stringify(commands()).includes('secret'))
  window.location = new URL('https://beer.example/#staff')
  const beforePrivate = events().length
  ga.trackPageView(); ga.trackRegistrationEvent('inscricao_visualizada')
  assert.equal(events().length, beforePrivate)
  assert.equal(window['ga-disable-G-8RVHDE36SW'], true)
  window.location = new URL('https://beer.example/')
  ga.trackPageView()
  assert.equal(window['ga-disable-G-8RVHDE36SW'], false)
  assert.equal(events().length, beforePrivate + 1)
  window.location = new URL('https://beer.example/pagamento-concluido?orderId=secret')
  ga.trackPageView(); ga.trackRegistrationEvent('inscricao_checkout')
  assert.equal(events().length, beforePrivate + 1)
  window.location = new URL('https://beer.example/#inscricao')
  ga.trackPageView()
  let opened = ''
  window.location.assign = url => { opened = url }
  const { openCheckout } = await import('../src/services/checkout.js')
  assert.throws(() => openCheckout('https://evil.example/checkout'))
  assert.equal(events().filter(args => args[1] === 'inscricao_checkout').length, 0)
  openCheckout('https://checkout.infinitepay.io/private-invoice')
  assert.equal(opened, 'https://checkout.infinitepay.io/private-invoice')
  assert.equal(events().filter(args => args[1] === 'inscricao_checkout').length, 1)
  assert.ok(!JSON.stringify(commands()).includes('private-invoice'))
  window.gtag = () => { throw new Error('blocked') }
  assert.doesNotThrow(() => ga.trackPageView())
  assert.doesNotThrow(() => ga.trackRegistrationEvent('inscricao_inicio'))
  assert.doesNotThrow(() => ga.trackRegistrationOrder('another-order', {}))
})

test('acesso privado inicial e localhost nao carregam o Google', async () => {
  let scripts = 0
  globalThis.document = { head: { appendChild: () => scripts++ } }
  for (const href of ['https://beer.example/pagamento-concluido', 'http://localhost:5173/#inscricao']) {
    globalThis.window = { location: new URL(href) }
    const ga = await import('../src/services/analytics.js?' + encodeURIComponent(href))
    ga.initGA(); ga.trackPageView(); ga.trackRegistrationEvent('inscricao_visualizada')
    assert.equal(window.gtag, undefined)
  }
  assert.equal(scripts, 0)
})
