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
const tempRoot = realpathSync(tmpdir()), profile = mkdtempSync(join(tempRoot, 'beer-kids-registration-'));
const orderId = '11365080-47dc-4ec7-9d40-ab1766dbaf83';
const checkoutUrl = 'https://checkout.infinitepay.io/test-only';
let vite, browser, ws, sequence = 0, created = 0, lastPayload, eligibility = 'CONTINUE', checkoutMode = 'ready';
let coupon = false, checkoutVisits = 0;
const kidsOrders = new Map(); let kidsEnabled = true, disconnect = false;
const kidsKeys = [];
const requests = [], exceptions = [], pending = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label = 'condicao') { for (let i = 0; i < 120; i++) { const result = await fn(); if (result) return result; await delay(100); } throw new Error('Timeout: ' + label); }
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject, method }); ws.send(JSON.stringify({ id, method, params })); }); }
const evaluate = async expression => { const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const set = (selector, value) => evaluate(`(() => {const element=document.querySelector(${JSON.stringify(selector)});element.value=${JSON.stringify(value)};element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
const bodyText = () => evaluate('document.body.innerText');
const screenshot = async name => { const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); mkdirSync(join(root, 'artifacts/kids'), { recursive: true }); writeFileSync(join(root, 'artifacts/kids', name + '.png'), Buffer.from(shot.data, 'base64')); };

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
    if (message.id) {
      const task = pending.get(message.id); pending.delete(message.id);
      // Navegar cancela requisicoes interceptadas ainda pendentes no Chrome.
      const canceled = task?.method.startsWith('Fetch.') && message.error?.message === 'Invalid InterceptionId.';
      message.error && !canceled ? task?.reject(new Error(message.error.message)) : task?.resolve(message.result);
    }
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
      if (url.pathname === '/api/registrations/kids/offer') await respond({ enabled: kidsEnabled, capacity: 30, eventDate: '2026-11-29', minAge: 1, maxAge: 13, amount: 4000, shirtAmount: 2600, shirtSizes: ['2','4','6','8','10','12','14'] });
      else if (url.pathname === '/api/registrations/kids') {
        created++; lastPayload = JSON.parse(request.postData); await delay(180);
        kidsKeys.push(Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'idempotency-key')?.[1]);
        if (disconnect) { await command('Fetch.failRequest', { requestId, errorReason: 'ConnectionClosed' }); return; }
        const id = crypto.randomUUID(); const body = lastPayload;
        const result = { orderId: id, amount: body.shirtIncluded ? 6600 : 4000, status: 'PENDING_PAYMENT', checkoutState: 'UNKNOWN', checkoutUrl: null, paymentReviewRequired: true, registration: { ...body, modality: 'kids', shirtModel: body.shirtIncluded ? 'KIDS' : null, shirtSize: body.shirtSize || null, beer: false } };
        kidsOrders.set(id, result); await respond(result, 202);
      } else if (url.pathname.match(/^\/api\/orders\/[^/]+\/status$/) && kidsOrders.has(url.pathname.split('/')[3])) await respond(kidsOrders.get(url.pathname.split('/')[3]));
      else if (url.pathname === '/api/athletes') await respond({ athletes: [], summary: { total: 0, drinkers: 0, nonDrinkers: 0, capacity: 100, preRegisteredCount: 0, waitlistCount: 20 } });
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

  const navigate = async (clear = true) => {
    await command('Page.navigate', { url: origin + '/' });
    await until(() => evaluate("!!document.querySelector('.hero-btn')"), 'home');
    assert.equal(await evaluate("!!document.querySelector('a[href=\"#kids\"]')"), false, 'Home com entrada unica');
    if (clear) await evaluate('localStorage.clear();sessionStorage.clear()');
    await click('.hero-btn');
    await until(() => evaluate("!!document.querySelector('.category-selection')"), 'categorias');
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'Overflow categorias');
    await evaluate('document.fonts.ready.then(() => true)');
    const width = await evaluate('innerWidth');
    if ([390,1440].includes(width)) await screenshot('categorias-' + width);
    await click('[data-category=kids]');
    await until(() => evaluate("!!document.querySelector('.kids-form')"), 'kids');
  };
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await navigate(); await evaluate('document.fonts.ready.then(() => true)');
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'Overflow Kids ' + width);
    assert.ok((await bodyText()).toLowerCase().includes('copo infantil'));
    assert.ok((await bodyText()).includes('1 espetinho'));
    if ([390,1440].includes(width)) await screenshot('kids-' + width);
  }
  // Alternar categorias conserva cada formulario e seu contexto.
  await set('#kids-name', 'Nome preservado');
  await click('.flow-category-bar button');
  await until(() => evaluate("!!document.querySelector('.category-selection')"));
  await click('[data-category=adulto]');
  await until(() => evaluate("!!document.querySelector('#shirt-model')"));
  assert.equal(await evaluate("!!document.querySelector('.kids-form')"), false);
  await set('#shirt-model', 'UNISEX'); await set('#shirt-size', 'M');
  await click('.flow-category-bar button');
  await until(() => evaluate("!!document.querySelector('.category-selection')"));
  await click('[data-category=kids]');
  await until(() => evaluate("!!document.querySelector('#kids-name')"));
  assert.equal(await evaluate("document.querySelector('#kids-name').value"), 'Nome preservado');
  await click('.flow-category-bar button');
  await until(() => evaluate("!!document.querySelector('.category-selection')"));
  await click('[data-category=adulto]');
  await until(() => evaluate("!!document.querySelector('#shirt-size')"));
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"), 'M');
  await click('.flow-category-bar button');
  await until(() => evaluate("!!document.querySelector('.category-selection')"));
  await click('[data-category=kids]');
  await until(() => evaluate("!!document.querySelector('#kids-name')"));
  const next = () => click('.kids-actions .next-button');
  assert.ok((await bodyText()).includes('30 vagas no total'));
  assert.ok((await bodyText()).includes('De 1 a 13 anos'));
  await set('#kids-name', 'Teste Idade Minima'); await set('#kids-birth', '30/11/2025'); await next();
  await until(() => evaluate("!!document.querySelector('.kids-error')"));
  assert.ok(await evaluate("!!document.querySelector('#kids-name')"), 'Menos de 1 ano no evento nao prossegue');
  await set('#kids-birth', '29/11/2025'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-guardian')"));
  await click('.kids-actions .text-action');
  await until(() => evaluate("!!document.querySelector('#kids-name')"));
  await set('#kids-name', 'Criança de Teste'); await set('#kids-birth', '29/11/2012'); await next();
  await until(() => evaluate("!!document.querySelector('.kids-error')"));
  assert.ok(await evaluate("!!document.querySelector('#kids-name')"), '14 anos nao prossegue');
  await set('#kids-birth', '30/11/2012'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-guardian')"));
  await set('#kids-guardian', 'Responsável de Teste'); await set('#kids-cpf', '52998224725');
  assert.equal(await evaluate("document.querySelector('#kids-cpf').value"), '529.982.247-25');
  await set('#kids-cpf', '529.982.247-25abc999');
  assert.equal(await evaluate("document.querySelector('#kids-cpf').value"), '529.982.247-25');
  await set('#kids-phone', '+55 (35) 99999-1234');
  assert.equal(await evaluate("document.querySelector('#kids-phone').value"), '(35) 99999-1234');
  await set('#kids-phone', '');
  assert.equal(await evaluate("document.querySelector('#kids-phone').value"), '');
  await set('#kids-relationship', 'Mãe'); await set('#kids-phone', '35999991234');
  assert.equal(await evaluate("document.querySelector('#kids-phone').value"), '(35) 99999-1234');
  await screenshot('kids-responsavel');
  await set('#kids-email', 'familia@example.com'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-skewer')"));
  assert.equal(await evaluate("document.querySelectorAll('input[name=kids-shirt]:checked').length"), 0, 'Camiseta exige escolha consciente');
  await click('.flow-check input[type=checkbox]');
  await until(() => evaluate("!!document.querySelector('#kids-emergency-phone')"));
  await set('#kids-emergency-phone', '35988885678');
  assert.equal(await evaluate("document.querySelector('#kids-emergency-phone').value"), '(35) 98888-5678');
  await click('.flow-check input[type=checkbox]');
  await click('input[name=kids-shirt][value=false]'); await next();
  await until(() => evaluate("document.querySelector('.kids-error')?.innerText.includes('Escolha o espetinho')"));
  await click('#kids-skewer button[aria-label="Aumentar carne"]');
  await click('#kids-skewer button[aria-label="Aumentar frango"]');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#kids-skewer .stepper-count')].map(el => el.textContent.trim())"), ['0', '1']);
  assert.equal(await evaluate("document.querySelector('#kids-skewer button[aria-label=\"Aumentar frango\"]').disabled"), true);
  await click('#kids-skewer input[type=checkbox]');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#kids-skewer .stepper-count')].map(el => el.textContent.trim())"), ['0', '0']);
  assert.equal(await evaluate("[...document.querySelectorAll('#kids-skewer button')].every(el => el.disabled)"), true);
  assert.ok(await evaluate("document.querySelector('#kids-skewer .skewer-summary-bar').innerText.includes('1 Vegetariano')"));
  await click('#kids-skewer input[type=checkbox]');
  await click('#kids-skewer button[aria-label="Aumentar frango"]');
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'Overflow espetinho Kids ' + width);
    if ([390,1440].includes(width)) await screenshot('kids-espetinho-' + width);
  }
  await next();
  await until(() => evaluate("!!document.querySelector('#kids-terms')"));
  assert.ok((await bodyText()).includes('Sem camiseta')); await click('#kids-terms');
  await evaluate("document.querySelector('.kids-actions .next-button').click();document.querySelector('.kids-actions .next-button').click()");
  await until(() => evaluate("!!document.querySelector('.payment-summary')"));
  await until(() => evaluate("document.querySelector('.payment-total')?.innerText.includes('40,00')"));
  assert.equal(created, 1, 'Clique duplo nao duplica pedido');
  assert.equal(lastPayload.shirtIncluded, false); assert.equal('shirtSize' in lastPayload, false); assert.equal('beer' in lastPayload, false);
  assert.equal(lastPayload.skewerChoice, '1 Frango');
  assert.equal(lastPayload.emergencyContactName, 'Responsável de Teste');
  assert.ok((await bodyText()).includes('Copo infantil') || (await bodyText()).includes('copo infantil'));
  await click('.kids-return .btn-vintage');
  await until(() => evaluate("!!document.querySelector('#kids-name')"));
  assert.equal(await evaluate("document.querySelector('#kids-name').value"), '');
  await set('#kids-name', 'Irmão de Teste'); await set('#kids-birth', '29/11/2018'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-guardian')"));
  assert.equal(await evaluate("document.querySelector('#kids-guardian').value"), 'Responsável de Teste');
  await next(); await until(() => evaluate("!!document.querySelector('#kids-skewer')"));
  await click('#kids-skewer button[aria-label="Aumentar carne"]'); await click('input[name=kids-shirt][value=true]');
  await until(() => evaluate("!!document.querySelector('#kids-shirt-size')"));
  await set('#kids-shirt-size', '6'); await next(); await until(() => evaluate("!!document.querySelector('#kids-terms')"));
  assert.ok((await bodyText()).includes('66,00')); await screenshot('kids-resumo'); await click('#kids-terms'); await next();
  await until(() => evaluate("document.querySelector('.payment-total')?.innerText.includes('66,00')"));
  assert.equal(created, 2); assert.equal(lastPayload.shirtSize, '6');
  await click('.kids-return .text-action');
  await until(() => evaluate("document.querySelectorAll('.kids-saved li').length === 2"));
  await evaluate("location.hash='#inscricao?categoria=kids&consulta=1'");
  await until(() => evaluate("!document.querySelector('.kids-form') && document.querySelector('.kids-saved')?.open"));
  await click('.kids-saved a[href="#inscricao?categoria=kids"]');
  await until(() => evaluate("!!document.querySelector('.kids-form')"));
  await evaluate("location.hash='#kids'");
  await until(() => evaluate("location.hash === '#kids' && !!document.querySelector('.kids-form')"));
  assert.equal(await evaluate("document.querySelector('.kids-saved').innerText.includes('Irmão de Teste')"), true);
  await command('Page.reload'); await until(() => evaluate("document.querySelectorAll('.kids-saved li').length === 2"));
  await set('#kids-name', 'Terceira Criança'); await set('#kids-birth', '29/11/2019'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-guardian')")); await next();
  await until(() => evaluate("!!document.querySelector('#kids-skewer')"));
  await click('#kids-skewer button[aria-label="Aumentar carne"]'); await click('input[name=kids-shirt][value=false]'); await next();
  await until(() => evaluate("!!document.querySelector('#kids-terms')")); await click('#kids-terms'); disconnect = true; await next();
  await until(() => evaluate("!!document.querySelector('.kids-error')"));
  const originalPayload = JSON.stringify(lastPayload), originalKey = kidsKeys.at(-1);
  assert.ok(originalKey);
  await command('Page.reload'); await until(() => evaluate("!!document.querySelector('#kids-terms')"));
  assert.ok((await bodyText()).includes('Terceira Criança'));
  disconnect = false; await next();
  await until(() => evaluate("document.querySelector('.payment-total')?.innerText.includes('40,00')"));
  assert.equal(kidsKeys.at(-1), originalKey, 'Recarregar conserva a chave da tentativa');
  assert.equal(JSON.stringify(lastPayload), originalPayload, 'Recarregar conserva o pedido original');
  kidsEnabled = false; await command('Page.reload'); await until(() => evaluate("document.querySelector('.kids-form-card')?.innerText.includes('ainda não estão abertas')"));
  assert.equal(await evaluate("!!document.querySelector('.kids-form')"), false);
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  console.log('PASS: Kids 320/390/768/1440, idade 13/14, kit, camiseta opcional, totais 40/66, clique duplo, pedido salvo, responsavel reutilizado, irmaos e recuperacao privada.');
} catch (error) {
  if (ws?.readyState === WebSocket.OPEN) {
    console.error('Browser failure:', await evaluate('({hash:location.hash,text:document.body.innerText})'), exceptions);
    await screenshot('kids-failure');
  }
  throw error;
} finally {
  ws?.close(); browser?.kill(); await vite?.close();
  await delay(300);
  const resolved = realpathSync(profile);
  if (dirname(resolved) === tempRoot && basename(resolved).startsWith('beer-kids-registration-')) {
    try { rmSync(resolved, { recursive: true, force: true }); } catch { /* Chrome pode liberar arquivos depois. */ }
  }
}
