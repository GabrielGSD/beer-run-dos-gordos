// Navegador isolado, API simulada e rede externa bloqueada. Nao usa .env real.
import {createServer as createViteServer} from 'vite';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,realpathSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const id='11365080-47dc-4ec7-9d40-ab1766dbaf83';
const key='c97a89c4-1c2b-4e8a-b0ba-15d2edb33720';
const nsu='af1d8a1b-a967-498a-a39a-071b05cb90c6';
let paid=false,enqueued=0,review=false,expired=false;
let manualChecks=0,manualAction='MISSING_REFERENCE',markPaidOnCheck=false;
let apiRequests=0;
const registration={name:'Atleta de Teste',nickname:'Corredor',cpf:'52998224725',birthDate:'1990-01-01',gender:'M',
  phone:'35999991234',email:'atleta@example.com',cityState:'Natercia / MG',modality:'corrida',beer:false,skewerChoice:'2 Frango',
  emergencyContactName:'Contato de Teste',emergencyContactPhone:'35999991235',medicalNotes:'Observacao particular para conferencia.',acceptedTermsAt:'2026-09-29T18:00:00Z'};
const api=createServer(async(req,res)=>{
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-headers','content-type,idempotency-key');
  res.setHeader('access-control-allow-methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  apiRequests++;
  res.setHeader('content-type','application/json');
  if(req.headers['idempotency-key']!==key){res.writeHead(404).end(JSON.stringify({error:{message:'Pedido nao encontrado.'}}));return;}
  if(req.url.endsWith('/status'))res.end(JSON.stringify({orderId:id,orderNsu:nsu,amount:6500,originalAmount:7500,discountAmount:1000,currency:'BRL',
    registration,createdAt:'2026-09-29T18:00:00Z',paymentReviewRequired:review,
    status:paid?'PAID':'PENDING_PAYMENT',checkoutState:review?'UNKNOWN':'READY',expiresAt:'2099-01-01T00:00:00Z',reservationExpired:expired}));
  else if(req.url.endsWith('/reconcile')){enqueued++;res.writeHead(202).end('{"accepted":true}');}
  else if(req.url.endsWith('/refresh')){
    assert.equal(req.method,'POST');manualChecks++;
    if(markPaidOnCheck)paid=true;
    res.end(JSON.stringify({action:manualAction,retryAfter:manualAction==='MISSING_REFERENCE'?0:30}));
  }
  else res.writeHead(404).end('{}');
});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const apiPort=api.address().port;
let vite,chrome,ws;
const tempRoot=realpathSync(tmpdir());const profile=mkdtempSync(join(tempRoot,'beer-run-browser-'));
const pending=new Map();let sequence=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){
  for(let i=0;i<100;i++){
    try { const value=await fn();if(value)return value; }
    catch(error) { if(!/Inspected target navigated or closed|Cannot find context|Execution context was destroyed/.test(error.message))throw error; }
    await sleep(100);
  }
  throw new Error('Browser test timed out');
}
function command(method,params={}){
  const id=++sequence;
  return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
}
const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
try {
  vite=await createViteServer({root,envDir:false,configFile:false,plugins:[(await import('@vitejs/plugin-vue')).default()],
    define:{'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:'+apiPort),
      'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""',
      'import.meta.env.VITE_GA_MEASUREMENT_ID':'"G-TESTREG"','import.meta.env.VITE_GA_DEBUG':'"true"'},
    server:{host:'127.0.0.1',port:0},logLevel:'error'});
  await vite.listen();const port=vite.httpServer.address().port;
  const binary=process.env.BROWSER_BINARY||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if(!existsSync(binary))throw new Error('Configure BROWSER_BINARY com o caminho do Chrome/Edge.');
  chrome=spawn(binary,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
  const debugPort=await until(()=>{try{return Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);}catch{return null;}});
  const tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json')).json();
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',async event=>{
    const message=JSON.parse(event.data);
    if(message.id){const p=pending.get(message.id);pending.delete(message.id);if(message.error)p?.reject(new Error(message.error.message));else p?.resolve(message.result);}
    if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params;const url=new URL(request.url);
      const local=['127.0.0.1','localhost'].includes(url.hostname);
      await command(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId}:{requestId,errorReason:'BlockedByClient'});
    }
  });
  await command('Page.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const seeder=await command('Page.addScriptToEvaluateOnNewDocument',{source:`if(location.hostname==='127.0.0.1')localStorage.setItem('beer_run_order_v1_${id}',JSON.stringify({orderId:'${id}',key:'${key}'}));`});
  const url='http://127.0.0.1:'+port+'/pagamento-concluido?orderId='+id;
  await command('Page.navigate',{url:url+'&paid=true&status=PAID'});
  await until(()=>evaluate("document.body.innerText.includes('R$')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('Pagamento confirmado'));
  assert.equal(enqueued,0);
  const pageText=await evaluate('document.body.innerText');
  for(const value of ['Atleta de Teste','529.982.247-25','01/01/1990','Sem chopp','2 Frango','Contato de Teste','Observacao particular','65,00','10,00'])assert.ok(pageText.includes(value),value);
  const contact=await evaluate("document.querySelector('.contact-button').href");
  const contactUrl=new URL(contact);
  assert.equal(contactUrl.hostname,'wa.me');
  assert.ok(contactUrl.searchParams.get('text').includes(id));
  for(const secret of [key,registration.cpf,registration.medicalNotes,registration.phone])assert.ok(!decodeURIComponent(contact).includes(secret));
  for(const width of [1920,1100,800,375]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    const layout=await evaluate(`(()=>{const page=document.querySelector('.payment-return-page');
      const rect=page.getBoundingClientRect(),style=getComputedStyle(page);
      const card=document.querySelector('.summary-card').getBoundingClientRect();
      return {fillsViewport:rect.width===document.documentElement.clientWidth && rect.height>=innerHeight,
        continuous:style.backgroundRepeat.split(',').every(value=>value.trim()==='no-repeat') && style.backgroundSize.split(',').every(value=>value.trim()==='cover'),
        gutters:card.left>=12 && card.right<=innerWidth-12};})()`);
    assert.deepEqual(layout,{fillsViewport:true,continuous:true,gutters:true});
    if(process.env.CAPTURE_UI==='true'){
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,`payment-summary-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  assert.equal(manualChecks,0);
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Atualizar status')).click()");
  await until(()=>evaluate("document.body.innerText.includes('Ainda não recebemos os identificadores')"));
  assert.equal(manualChecks,1);
  manualAction='CHECKED';
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Atualizar status')).click()");
  await until(()=>evaluate("document.body.innerText.includes('Pagamento consultado na InfinitePay')"));
  assert.equal(await evaluate("document.querySelector('.refresh-button').disabled"),true);
  await evaluate("document.querySelector('.refresh-button').click()");
  assert.equal(manualChecks,2);
  await command('Page.navigate',{url});
  await until(()=>evaluate("!!document.querySelector('.refresh-button') && !document.querySelector('.refresh-button').disabled"));
  markPaidOnCheck=true;
  await evaluate("document.querySelector('.refresh-button').click()");
  await until(()=>evaluate("document.body.innerText.includes('Pagamento confirmado')"));
  assert.equal(manualChecks,3);
  paid=false;markPaidOnCheck=false;
  await command('Page.navigate',{url:url+'&transaction_nsu=test-transaction&slug=test-invoice&order_nsu='+nsu});
  await until(()=>enqueued===1);
  assert.ok(!(await evaluate('document.body.innerText')).includes('Pagamento confirmado'));
  paid=true;
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Atualizar status')).click()");
  await until(()=>evaluate("document.body.innerText.includes('Pagamento confirmado')"));
  assert.ok(!(await evaluate('location.href')).includes('transaction_nsu'));
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Continuar pagamento'))"),false);
  for(const mode of ['review','expired']){
    paid=false;review=mode==='review';expired=mode==='expired';
    await command('Page.navigate',{url});
    await until(()=>evaluate("document.body.innerText.includes('R$')"));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Continuar pagamento'))"),false);
  }
  console.log('PASS: resumo pessoal, desconto, contato sem dados sensiveis, desktop/mobile e pagamento bloqueado em revisao/expiracao.');
  console.log('PASS: retorno adulterado nao confirma; reconciliacao enfileirada; tela confirma somente apos PAID do backend.');
  // O link pode ser copiado mesmo quando o clipboard esta indisponivel.
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('blocked')}}})");
  await evaluate("document.querySelector('.private-access-card button').click()");
  await until(()=>evaluate("!!document.querySelector('.private-access-card input')"));
  const privateUrl=await evaluate("document.querySelector('.private-access-card input').value");
  const parsed=new URL(privateUrl);
  assert.equal(parsed.search,'');
  assert.equal(new URLSearchParams(parsed.hash.slice(1)).get('acesso'),key);
  assert.equal(new URLSearchParams(parsed.hash.slice(1)).get('pedido'),id);
  await command('Page.removeScriptToEvaluateOnNewDocument',{identifier:seeder.identifier});
  await evaluate('localStorage.clear()');
  review=false;expired=false;
  // Retorno em outro navegador: referencias do pagamento nao autorizam dados pessoais.
  paid=true;
  const requestsBefore=apiRequests,queuedBefore=enqueued;
  await command('Page.navigate',{url:url+'&transaction_nsu=test-transaction&slug=test-invoice&order_nsu='+nsu});
  await until(()=>evaluate("!!document.querySelector('.restore-form') && !location.search.includes('transaction_nsu')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes(registration.name));
  assert.equal(await evaluate("document.querySelector('.phone-status-link').getAttribute('href')"),'/#inscricao');
  assert.equal(apiRequests,requestsBefore);
  assert.equal(enqueued,queuedBefore);
  await command('Page.navigate',{url:privateUrl});
  await until(()=>evaluate("document.body.innerText.includes('Atleta de Teste')"));
  assert.equal(await evaluate('location.hash'),'');
  assert.ok(!(await evaluate('location.href')).includes(key));
  assert.equal(await evaluate("!!document.querySelector('script[src*=googletagmanager]')"),false);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('beer_run_order_v1_${id}')).key`),key);
  // Uma chave incorreta nunca sobrescreve o acesso valido nem mostra dados do ultimo pedido.
  const wrongKey='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await command('Page.navigate',{url:privateUrl.replace(key,wrongKey)});
  await until(()=>evaluate("location.hash==='' && document.readyState==='complete' && document.body.innerText.includes('não corresponde a um pedido')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('Atleta de Teste'));
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('beer_run_order_v1_${id}')).key`),key);
  await command('Page.navigate',{url:privateUrl.replace(key,'incompleto')});
  await until(()=>evaluate("location.hash==='' && document.readyState==='complete' && document.body.innerText.includes('link de acesso é inválido')"));
  assert.equal(await evaluate('location.hash'),'');
  assert.ok(!(await evaluate('document.body.innerText')).includes('Atleta de Teste'));
  await command('Page.navigate',{url:privateUrl.split('&acesso=')[0]});
  await until(()=>evaluate("location.hash==='' && document.readyState==='complete' && document.body.innerText.includes('link de acesso é inválido')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('Atleta de Teste'));
  // Sem armazenamento, o acesso funciona em memoria e permite guardar o link.
  await evaluate('localStorage.clear()');
  const blockedStorage=await command('Page.addScriptToEvaluateOnNewDocument',{source:"Storage.prototype.setItem=function(){throw new Error('blocked')}"});
  await command('Page.navigate',{url:privateUrl});
  await until(()=>evaluate("document.body.innerText.includes('Atleta de Teste')"));
  assert.ok((await evaluate('document.body.innerText')).includes('não conseguiu guardá-lo'));
  assert.equal(await evaluate("!!document.querySelector('.private-access-card button')"),true);
  await command('Page.removeScriptToEvaluateOnNewDocument',{identifier:blockedStorage.identifier});
  console.log('PASS: link privado em navegador sem armazenamento anterior; fragmento removido; sem analytics; chave invalida rejeitada; armazenamento bloqueado e copia manual.');
  console.log('PASS: fundo continuo em desktop/tablet/mobile; retorno sem acesso salvo oferece consulta por celular e nao expoe dados pessoais.');
} finally {
  try { if(ws?.readyState===WebSocket.OPEN)await command('Browser.close'); } catch {}
  ws?.close();
  if(chrome && chrome.exitCode===null){await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(3000)]);if(chrome.exitCode===null)chrome.kill();}
  await vite?.close();await new Promise(resolve=>api.close(resolve));
  // Somente o perfil temporario criado nesta execucao; nunca o perfil do usuario.
  if(dirname(realpathSync(profile))===tempRoot && basename(profile).startsWith('beer-run-browser-')) {
    rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
