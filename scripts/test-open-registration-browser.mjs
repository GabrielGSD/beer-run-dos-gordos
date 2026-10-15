// Browser isolado e API simulada. Nunca cria pedidos ou pagamentos reais.
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = realpathSync(tmpdir()), profile = mkdtempSync(join(tempRoot, 'beer-open-registration-'));
const orderId = '11365080-47dc-4ec7-9d40-ab1766dbaf83';
const checkoutUrl = 'https://checkout.infinitepay.io/test-only';
let vite, browser, ws, sequence = 0, created = 0, lastPayload, eligibility = 'CONTINUE', checkoutMode = 'ready';
let coupon = false, checkoutVisits = 0;
const requests = [], exceptions = [], pending = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label = 'condicao') { for (let i = 0; i < 120; i++) { const result = await fn(); if (result) return result; await delay(100); } throw new Error('Timeout: ' + label); }
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
const evaluate = async expression => { const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const set = (selector, value) => evaluate(`(() => {const element=document.querySelector(${JSON.stringify(selector)});element.value=${JSON.stringify(value)};element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
const bodyText = () => evaluate('document.body.innerText');
const screenshot = async name => { const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); mkdirSync(join(root, 'artifacts/conversion'), { recursive: true }); writeFileSync(join(root, 'artifacts/conversion', name + '.png'), Buffer.from(shot.data, 'base64')); };

try {
  vite = await createServer({ root, envDir: false, configFile: false, plugins: [vue()],
    define: { 'import.meta.env.VITE_API_URL': '"http://127.0.0.1:19999"', 'import.meta.env.VITE_SUPABASE_URL': '""',
      'import.meta.env.VITE_SUPABASE_ANON_KEY': '""', 'import.meta.env.VITE_GA_MEASUREMENT_ID': '"G-TESTREG"', 'import.meta.env.VITE_GA_DEBUG': '"true"' },
    server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await vite.listen();
  const origin = 'http://127.0.0.1:' + vite.httpServer.address().port;
  browser = spawn(process.env.BROWSER_BINARY || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
    { stdio: 'ignore', windowsHide: true });
  const port = await until(() => { try { return Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch { return null; } }, 'Chrome');
  const tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task?.reject(new Error(message.error.message)) : task?.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params, url = new URL(request.url);
    const respond = (data, status = 200) => command('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
      { name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' },
      { name: 'access-control-allow-headers', value: 'content-type,idempotency-key' }, { name: 'access-control-allow-methods', value: 'GET,POST,OPTIONS' },
    ], body: Buffer.from(JSON.stringify(data)).toString('base64') });
    if (url.port === '19999') {
      if (request.method === 'OPTIONS') { await respond({}); return; }
      requests.push(url.pathname);
      if (url.pathname === '/api/athletes') await respond({ athletes: [], summary: { total: 0, drinkers: 0, nonDrinkers: 0, capacity: 100, preRegisteredCount: 0, waitlistCount: 20 } });
      else if (url.pathname === '/api/sponsors') await respond({ rows: [] });
      else if (url.pathname === '/api/registrations/eligibility') await respond(eligibility === 'STATUS_AVAILABLE'
        ? { action: eligibility, summary: { status: 'PAID', checkoutUrl: null, reservationExpired: false, paymentReviewRequired: false } }
        : { action: eligibility, athlete: { name: '', nickname: '', modality: 'corrida', drinksBeer: false, couponEligible: coupon } });
      else if (url.pathname === '/api/coupons/quote') { const input = JSON.parse(request.postData); const originalAmount = input.beer ? 10000 : 9000; await respond({ originalAmount, discountAmount: 1000, amount: originalAmount - 1000, currency: 'BRL' }); }
      else if (url.pathname === '/api/registrations') {
        created++; lastPayload = JSON.parse(request.postData); await delay(180);
        if (checkoutMode === 'conflict') await respond({ error: { code: 'REGISTRATION_CONFLICT', message: 'CPF ou telefone ja cadastrado.' } }, 409);
        else await respond({ orderId, status: 'PENDING_PAYMENT', amount: lastPayload.beer ? 10000 : 9000, discountAmount: 0, currency: 'BRL', checkoutState: checkoutMode === 'ready' ? 'READY' : 'UNKNOWN', checkoutUrl: checkoutMode === 'ready' ? checkoutUrl : null }, checkoutMode === 'ready' ? 201 : 202);
      } else if (url.pathname.endsWith('/status')) await respond({ orderId, status: 'PENDING_PAYMENT', amount: 9000, checkoutState: 'UNKNOWN', paymentReviewRequired: true });
      else throw new Error('API inesperada: ' + url.pathname);
      return;
    }
    if (url.origin === origin) { await command('Fetch.continueRequest', { requestId }); return; }
    if (['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'].includes(url.hostname)) { await command('Fetch.continueRequest', { requestId }); return; }
    if (request.url === checkoutUrl) { checkoutVisits++; await command('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'text/html' }], body: Buffer.from('<h1>Checkout simulado</h1>').toString('base64') }); return; }
    await command('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
  });
  await command('Runtime.enable'); await command('Page.enable'); await command('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (hash = '#inscricao', clear = true) => {
    await command('Page.navigate', { url: origin + '/' });
    await until(() => evaluate("!!document.querySelector('.hero-btn')"), 'home');
    if (clear) await evaluate('localStorage.clear();sessionStorage.clear()');
    if (hash) { await evaluate(`location.hash=${JSON.stringify(hash)}`); await until(() => evaluate("!!document.querySelector('.registration-form, .consultation-page')"), 'inscricao'); }
  };
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 500 });
    await navigate(''); await evaluate('document.fonts.ready.then(() => true)'); await delay(250);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false, 'Home overflow ' + width);
    if (width === 390) {
      assert.ok(await evaluate("document.querySelector('.hero-btn').getBoundingClientRect().bottom < innerHeight"), 'CTA deve aparecer na primeira dobra');
      await screenshot('home-mobile');
    }
    if (width === 1440) await screenshot('home-desktop');
    await click('.hero-btn');
    await until(() => evaluate("!!document.querySelector('#kit-title')"));
    assert.equal(await evaluate("document.querySelector('input#reg-name').offsetParent === null"), true, 'Beneficios precedem dados');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false, 'Inscricao overflow ' + width);
    assert.ok(await evaluate("[...document.querySelectorAll('.choice-card')].every(card => card.getBoundingClientRect().right <= innerWidth)"), 'Cards devem caber na tela ' + width);
    assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0, 'PDF nao carrega durante inscricao');
    if (width === 390) {
      assert.ok(await evaluate("document.querySelector('.next-button').getBoundingClientRect().bottom <= innerHeight"), 'Total e proximo passo visiveis sem rolar');
      await screenshot('inscricao-kit-mobile');
      await click('.kit-preview summary');
      await evaluate("document.querySelector('.kit-preview').scrollIntoView({block:'center',behavior:'instant'})");
      await until(() => evaluate("[...document.querySelectorAll('.kit-preview img')].every(img => img.complete && img.naturalWidth > 0)"), 'imagens do kit');
      await screenshot('inscricao-kit-imagens-mobile');
      await click('.kit-preview summary');
    }
    if (width === 1440) {
      assert.ok(await evaluate("(() => { const card=document.querySelector('.form-section-card').getBoundingClientRect(); const footer=document.querySelector('.registration-bottom-bar').getBoundingClientRect(); return card.width >= 760 && Math.abs(card.left-footer.left)<2 && Math.abs(card.width-footer.width)<2 })()"), 'Card e acoes alinhados no desktop');
      await screenshot('inscricao-kit-desktop');
    }
  }
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate();
  await click('.skewer-row-item:first-child .btn-stepper:last-child');
  assert.ok((await bodyText()).includes('2 Espetinhos de Carne'));
  await click('.skewer-row-item:first-child .btn-stepper:first-child');
  assert.ok((await bodyText()).includes('1 Carne + 1 Frango'));
  await click('.next-button');
  await until(() => evaluate("document.activeElement.id === 'shirt-model'"));
  await set('#shirt-model', 'UNISEX'); await set('#shirt-size', 'G3');
  await set('#shirt-model', 'BABYLOOK');
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"), '');
  await set('#shirt-size', 'G'); await click('.next-button');
  await until(() => evaluate("document.querySelector('#reg-name').offsetParent !== null"));
  await delay(500);
  await screenshot('inscricao-dados-mobile');
  const nextTo = async title => {
    await click('.next-button');
    await until(() => evaluate(`document.querySelector('#${title}').offsetParent !== null`), title);
    assert.equal(await evaluate("[...document.querySelectorAll('.registration-fields > .form-section-card')].filter(card => card.offsetParent !== null).length"), 1, 'Uma tela por etapa');
  };
  const fill = async (capture = false) => {
    for (const [key, value] of Object.entries({ name: 'Atleta Teste', cpf: '52998224725', birthDate: '01011990', cityState: 'Natércia/MG' })) await set('#reg-' + key, value);
    await click('#reg-gender button:last-child');
    await nextTo('contact-title');
    if (capture) { await delay(500); await screenshot('inscricao-contato-mobile'); }
    assert.ok(!(await bodyText()).includes('CONFIRMAR E PAGAR'));
    for (const [key, value] of Object.entries({ phone: '35999991234', email: 'teste@example.com', emergencyContactName: 'Contato Teste', emergencyContactPhone: '35999994321' })) await set('#reg-' + key, value);
    await evaluate("document.querySelector('#reg-phone').dispatchEvent(new Event('blur'))");
    await nextTo('rules-title');
    if (capture) {
      await click('.next-button');
      assert.equal(await evaluate("document.activeElement.id"), 'reg-acceptedTerms');
      assert.equal(created, 0, 'Aceite nao cria pedido');
      await delay(500); await screenshot('inscricao-regulamento-mobile');
    }
    await click('#reg-acceptedTerms');
    await nextTo('review-title');
    if (capture) {
      await delay(500); await screenshot('inscricao-resumo-mobile');
      await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
      await screenshot('inscricao-resumo-desktop');
      await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    }
  };
  await fill(true);
  assert.equal(created, 0, 'Resumo nao cria pedido antes da confirmacao');
  await delay(350); await navigate('#inscricao', false);
  assert.equal(await evaluate("document.querySelector('#reg-name').value"), 'Atleta Teste');
  assert.equal(await evaluate("document.querySelector('#reg-acceptedTerms').checked"), false, 'Aceite deve ser revisado ao retomar');
  assert.equal(await evaluate("document.querySelector('#rules-title').offsetParent !== null"), true, 'Retomada do resumo pede aceite novamente');
  await click('.btn-step-back');
  await until(() => evaluate("document.querySelector('#contact-title').offsetParent !== null"));
  await click('.btn-step-back');
  await until(() => evaluate("document.querySelector('#details-title').offsetParent !== null"));
  await set('#reg-cpf', '11111111111'); await click('.next-button');
  await until(() => evaluate("document.activeElement.id === 'reg-cpf'"));
  assert.equal(created, 0);
  await set('#reg-cpf', '52998224725');
  await nextTo('contact-title'); await nextTo('rules-title'); await click('#reg-acceptedTerms'); await nextTo('review-title');
  coupon = true;
  await evaluate("document.querySelector('#reg-phone').dispatchEvent(new Event('blur'))");
  await until(() => evaluate("!!document.querySelector('#registration-coupon')"));
  await set('#registration-coupon', 'ABCDEF0123456789ABCDEF0123456789');
  await click('.coupon-controls button');
  await until(() => evaluate("document.querySelector('.running-total').innerText.includes('80,00')"));
  await click('.review-edit-button');
  await click('input[name=beer][value=true]');
  await click('.next-button');
  assert.equal(await evaluate("document.querySelector('.next-button').disabled"), true, 'Mudanca de preco invalida cupom');
  await click('.coupon-controls button');
  await until(() => evaluate("document.querySelector('.running-total').innerText.includes('90,00')"));
  await click('.next-button');
  await click('.next-button'); // Clique duplo nao pode criar dois pedidos.
  await until(() => checkoutVisits === 1, 'redirecionamento para InfinitePay');
  assert.equal(created, 1); assert.equal(lastPayload.beer, true); assert.equal(lastPayload.shirtModel, 'BABYLOOK');
  assert.equal(lastPayload.couponCode, 'ABCDEF0123456789ABCDEF0123456789'); assert.equal(lastPayload.modality, 'RUN');
  assert.equal(await bodyText(), 'Checkout simulado');

  // Falha do provedor preserva pedido/chave e nao produz outra cobranca.
  checkoutMode = 'unavailable'; coupon = false;
  await navigate(); await set('#shirt-model', 'UNISEX'); await set('#shirt-size', 'M'); await click('.next-button'); await fill();
  await click('.next-button'); await until(() => evaluate("!!document.querySelector('.payment-page')"));
  assert.equal(created, 2); assert.equal(checkoutVisits, 1);
  assert.ok((await bodyText()).includes('Seu pedido foi salvo'));
  assert.ok(await evaluate(`!!localStorage.getItem('beer_run_order_v1_${orderId}')`));
  assert.equal(await evaluate("localStorage.getItem('beer_run_registration_draft_v2')"), null);

  // Consulta de pagamento ja aprovado, sem recriar pedido ou expor cadastro privado.
  eligibility = 'STATUS_AVAILABLE';
  await navigate(''); await click('.consultation-link');
  await until(() => evaluate("!!document.querySelector('.consultation-page')"));
  assert.equal(await evaluate("!!document.querySelector('.registration-form, .wizard-stepper, .registration-bottom-bar')"), false, 'Consulta deve exibir somente o card anterior');
  await evaluate('document.fonts.ready.then(() => true)');
  await screenshot('consulta-mobile');
  await set('#lookup-phone', '35999991234'); await click('.lookup-controls button');
  await until(() => evaluate("!!document.querySelector('.public-status')"));
  assert.ok((await bodyText()).includes('Seu pagamento está confirmado'));
  assert.equal(created, 2);
  await click('.public-status .another');
  await until(() => evaluate("!!document.querySelector('.consultation-page')"));
  assert.equal(await evaluate("!!document.querySelector('.registration-form')"), false);
  // Sem pedido, permanece na consulta e oferece inscricao por escolha do visitante.
  eligibility = 'CONTINUE';
  await set('#lookup-phone', '35999994321'); await click('.lookup-controls button');
  await until(() => evaluate("!!document.querySelector('.consultation-page a[href=\"#inscricao\"]')"));
  assert.ok((await bodyText()).includes('Não encontramos um pedido'));
  assert.equal(created, 2);
  assert.equal(await evaluate("!!document.querySelector('.registration-form')"), false);
  await click('.consultation-page a[href="#inscricao"]');
  await until(() => evaluate("!!document.querySelector('.registration-form')"));
  assert.equal(await evaluate("!!document.querySelector('.reg-container .lookup-panel')"), false, 'Ao iniciar inscricao pela consulta, ocultar o bloco de consulta');
  assert.ok(!(await bodyText()).includes('Não encontramos um pedido'), 'Nao carregar a mensagem da consulta para a inscricao');
  // Links antigos abrem o formulario para quem ainda nao tem pedido.
  eligibility = 'CONTINUE';
  await navigate('#inscricao?tel=35999991234');
  await until(() => evaluate("document.querySelector('#reg-phone').value === '(35) 99999-1234'"));
  assert.ok(!(await bodyText()).includes('aguarde a convocação'));
  await set('#shirt-model', 'UNISEX'); await set('#shirt-size', 'M'); await click('.next-button'); await fill();
  // Trocar a pessoa pela consulta nao transporta seus dados privados.
  await set('#lookup-phone', '35999994321'); await click('.lookup-controls button');
  await until(() => evaluate("document.querySelector('#reg-phone').value === '(35) 99999-4321'"));
  assert.equal(await evaluate("document.querySelector('#reg-cpf').value"), '');
  assert.equal(await evaluate("document.querySelector('#reg-emergencyContactName').value"), '');
  // Um conflito no servidor oferece recuperacao e mantem os dados preenchidos.
  checkoutMode = 'conflict';
  await navigate(); await set('#shirt-model', 'UNISEX'); await set('#shirt-size', 'M'); await click('.next-button'); await fill();
  await click('.next-button'); await until(() => evaluate("!!document.querySelector('.error-banner')"));
  assert.ok((await bodyText()).includes('Consultar minha inscrição existente'));
  assert.equal(await evaluate("document.querySelector('#reg-name').value"), 'Atleta Teste');
  assert.equal(checkoutVisits, 1);
  assert.ok(!requests.some(path => path.includes('/waitlist')));
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  console.log('PASS: home 320/390/768/1440, desktop alinhado, cinco etapas isoladas, resumo antes do pagamento, validacao/foco, camiseta, rascunho, edicao, cupons, clique duplo, checkout direto, falha recuperavel, conflitos, consulta e links antigos.');
} finally {
  ws?.close(); browser?.kill(); await vite?.close();
  await delay(300);
  const resolved = realpathSync(profile);
  if (dirname(resolved) === tempRoot && basename(resolved).startsWith('beer-open-registration-')) {
    try { rmSync(resolved, { recursive: true, force: true }); } catch { /* Chrome pode liberar arquivos depois. */ }
  }
}
