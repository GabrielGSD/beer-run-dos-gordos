// Chrome isolado, API simulada e nenhum pedido/pagamento real.
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = realpathSync(tmpdir()), profile = mkdtempSync(join(tempRoot, 'beer-staff-registration-'));
const orderId = '11365080-47dc-4ec7-9d40-ab1766dbaf83', registrationId = '11365080-47dc-4ec7-9d40-ab1766dbaf84';
const checkoutUrl = 'https://checkout.infinitepay.io/test-only';
const items = [['shirt','Camiseta',2600],['medal','Medalha',1900],['cup','Copo',1000],['skewer','Espetinho (unidade)',1000],['beer','Bebida com chopp',1500],['softDrink','Bebida sem chopp',1000]].map(([id,label,unit_amount]) => ({id,label,unit_amount}));
let vite, browser, ws, sequence = 0, created = 0, lastPayload, disconnect = false, paid = false, unknown = false, disabled = false;
const exceptions = [], keys = [], pending = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label = 'condicao') { for (let i = 0; i < 150; i++) { const result = await fn(); if (result) return result; await delay(100); } throw new Error('Timeout: ' + label); }
function command(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
const evaluate = async expression => { const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const set = (selector, value) => evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
const screenshot = async name => { const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); mkdirSync(join(root, 'artifacts/staff-registration'), { recursive: true }); writeFileSync(join(root, 'artifacts/staff-registration', name + '.png'), Buffer.from(shot.data, 'base64')); };
try {
  vite = await createServer({ root, envDir: false, configFile: false, plugins: [vue()], define: {
    'import.meta.env.VITE_API_URL': '"http://127.0.0.1:19999"', 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""', 'import.meta.env.VITE_GA_MEASUREMENT_ID': '""',
  }, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await vite.listen();
  const origin = 'http://127.0.0.1:' + vite.httpServer.address().port;
  browser = spawn(process.env.BROWSER_BINARY || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { stdio:'ignore',windowsHide:true });
  const port = await until(() => { try { return Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]); } catch { return null; } }, 'Chrome');
  const tabs = await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  ws = new WebSocket(tabs.find(tab => tab.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',async event=>{
    const message=JSON.parse(event.data);
    if(message.id){const task=pending.get(message.id);pending.delete(message.id);message.error?task?.reject(new Error(message.error.message)):task?.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if(message.method!=='Fetch.requestPaused')return;
    const {requestId,request}=message.params,url=new URL(request.url);
    const respond=(data,status=200)=>command('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'content-type',value:'application/json'},{name:'access-control-allow-origin',value:'*'},{name:'access-control-allow-headers',value:'content-type,idempotency-key'},{name:'access-control-allow-methods',value:'GET,POST,OPTIONS'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});
    if(url.port==='19999'){
      if(request.method==='OPTIONS'){await respond({});return;}
      if(url.pathname==='/api/registrations/staff/offer')await respond({enabled:!disabled,requiresCode:false,items});
      else if(url.pathname==='/api/registrations/staff'){
        created++;lastPayload=JSON.parse(request.postData);keys.push(Object.entries(request.headers).find(([key])=>key.toLowerCase()==='idempotency-key')?.[1]);
        await delay(150);
        if(disconnect){await command('Fetch.failRequest',{requestId,errorReason:'ConnectionReset'});return;}
        await respond({created:true,registrationId,orderId:paid?orderId:null,amount:paid?9000:0,status:paid?'PENDING_PAYMENT':'NO_PAYMENT_REQUIRED',checkoutUrl:paid&&!unknown?checkoutUrl:null},unknown?202:201);
      } else await respond({athletes:[],summary:{},rows:[]});
      return;
    }
    if(url.origin===origin){await command('Fetch.continueRequest',{requestId});return;}
    await command('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});
  });
  await command('Page.enable');await command('Runtime.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await command('Page.navigate',{url:origin+'/cadastro-staff'});
  await until(()=>evaluate("!!document.querySelector('#team-next')"),'formulario');
  async function checkWidths(stage) {
    for(const width of [320,390,768,1440]) {
      await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
      assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,'overflow '+stage+' '+width);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.flow-bottom-bar')).position"),'fixed');
      await evaluate('window.scrollTo({top:0,behavior:"instant"})');
      await screenshot('staff-'+stage+'-'+width);
    }
  }
  assert.ok(await evaluate("!!document.querySelector('.registration-flow .flow-top-bar')"));
  assert.equal(await evaluate("[...document.querySelectorAll('.team-fields input[type=checkbox]')].some(e=>e.checked)"),false);
  await checkWidths('kit');
  async function toData() { await click('#team-next'); await until(()=>evaluate("!!document.querySelector('#team-name')")); }
  async function fill() { await set('#team-name','Equipe Teste');await set('#team-cpf','52998224725');await set('#team-birth','01011990');await set('#team-phone','35999991234');await set('#team-email','staff@example.com'); }
  async function review() { await click('#team-next');await until(()=>evaluate("!!document.querySelector('#team-terms')")); }
  async function accept() { await click('#team-terms'); }
  await toData();await click('#team-next');
  assert.equal(created,0,'dados vazios nao geram cadastro');
  assert.equal(await evaluate("!!document.querySelector('#team-name')"),true,'validar antes de avancar');
  await fill();await checkWidths('dados');
  await set('#team-birth','31021990');await click('#team-next');
  assert.equal(await evaluate("!!document.querySelector('#team-name')"),true,'data invalida nao avanca');
  await set('#team-birth','01011990');await review();
  assert.ok((await evaluate("document.querySelector('#team-submit').innerText")).toLowerCase().includes('sem kit'));
  await checkWidths('revisao');
  await click('#team-submit');assert.equal(created,0,'aceite obrigatorio');
  await accept();await evaluate("document.querySelector('#team-submit').click();document.querySelector('#team-submit').click()");
  await until(()=>evaluate("!!document.querySelector('.success')"));
  assert.equal(created,1,'clique duplo cria apenas uma requisicao');
  assert.equal(lastPayload.registration.shirt,false);assert.equal(lastPayload.registration.skewerQuantity,0);assert.equal(lastPayload.registration.drink,'NONE');
  assert.equal(lastPayload.registration.birthDate,'1990-01-01');
  assert.ok((await evaluate('document.body.innerText')).includes('Nenhum pagamento é necessário'));
  async function restart(){await evaluate("sessionStorage.clear();location.reload()");await until(()=>evaluate("!!document.querySelector('#team-next')"));}
  await restart();paid=true;
  for(const id of ['shirt','medal','cup'])await click('#team-'+id);
  await click('#team-next');
  assert.equal(await evaluate("!!document.querySelector('#team-shirt-model')"),true,'modelo e tamanho obrigatorios quando camiseta selecionada');
  await set('#team-shirt-model','BABYLOOK');await until(()=>evaluate("document.querySelector('#team-shirt-size').options.length>1"));
  assert.equal(await evaluate("[...document.querySelector('#team-shirt-size').options].some(e=>e.value==='G3')"),false);
  await set('#team-shirt-size','M');await set('#team-skewer-quantity',2);await set('#team-skewer-choice','Carne');await click('#team-beer');
  assert.ok((await evaluate("document.querySelector('.total').innerText")).includes('90,00'));
  await toData();await fill();await set('#team-birth','01012015');await click('#team-next');
  assert.equal(await evaluate("!!document.querySelector('#team-name')"),true,'menor nao avanca com chopp');
  await set('#team-birth','01011990');await review();
  assert.ok((await evaluate('document.body.innerText')).includes('Babylook'));
  await checkWidths('revisao-kit');
  await click('#team-previous');await until(()=>evaluate("!!document.querySelector('#team-name')"));
  assert.equal(await evaluate("document.querySelector('#team-name').value"),'Equipe Teste','voltar preserva dados');
  await click('#team-previous');await until(()=>evaluate("!!document.querySelector('#team-shirt')"));
  assert.equal(await evaluate("document.querySelector('#team-shirt').checked"),true,'voltar preserva kit');
  assert.equal(await evaluate("document.querySelector('#team-shirt-size').value"),'M');
  await toData();await review();await accept();
  await click('#team-submit');await until(()=>evaluate("!!document.querySelector('.success')"));
  assert.equal(created,2);assert.equal(lastPayload.registration.shirtSize,'M');assert.equal(lastPayload.registration.skewerQuantity,2);assert.equal(lastPayload.registration.amount,undefined);
  assert.ok((await evaluate('document.body.innerText')).includes('Copiar link de pagamento'));
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('beer_run_order_v1_${orderId}')).orderId`),orderId);
  await restart();await click('#team-medal');await toData();await fill();await review();await accept();disconnect=true;await click('#team-submit');
  await until(()=>evaluate("!!document.querySelector('.error')"));const original=JSON.stringify(lastPayload),originalKey=keys.at(-1);
  await command('Page.reload');await until(()=>evaluate("!!document.querySelector('#team-submit')"));
  assert.ok((await evaluate('document.body.innerText')).includes('Equipe Teste'),'retomada na revisao');
  disconnect=false;unknown=true;await click('#team-submit');await until(()=>evaluate("!!document.querySelector('.success')"));
  assert.equal(keys.at(-1),originalKey);assert.equal(JSON.stringify(lastPayload),original);
  assert.equal(await evaluate("!!document.querySelector('.actions')"),false);
  assert.ok((await evaluate('document.body.innerText')).includes('Acompanhar pedido'));
  disabled=true;await evaluate("sessionStorage.clear();location.reload()");await until(()=>evaluate("document.body.innerText.includes('ainda não está disponível')"));
  assert.equal(await evaluate("!!document.querySelector('#team-submit')"),false);
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log('PASS: staff no padrao dos atletas, 3 etapas, 320/390/768/1440, validacao, voltar, opcionais, totais, pagamento e retomada idempotente.');
} catch(error){if(ws?.readyState===WebSocket.OPEN){console.error(await evaluate('document.body.innerText'));await screenshot('staff-failure');}throw error;}
finally{ws?.close();browser?.kill();await vite?.close();await delay(300);const resolved=realpathSync(profile);if(dirname(resolved)===tempRoot&&basename(resolved).startsWith('beer-staff-registration-')){try{rmSync(resolved,{recursive:true,force:true});}catch{}}}
