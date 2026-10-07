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
let action='CONTINUE',fail=false,requests=0;
let manualChecks=0;
let submittedRegistration;
let registrationSuccess=false;
const athlete={name:'Atleta de Teste',nickname:'Corredor Teste',modality:'caminhada',drinksBeer:false,couponEligible:false};
let summary={status:'PENDING_PAYMENT',checkoutUrl:'https://checkout.infinitepay.io/test-link',reservationExpired:false,paymentReviewRequired:false};
const orderId='11365080-47dc-4ec7-9d40-ab1766dbaf83', key='c97a89c4-1c2b-4e8a-b0ba-15d2edb33720';
let expectedOrderKey=key;
const api=createServer(async(req,res)=>{
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-headers','content-type,idempotency-key');
  res.setHeader('access-control-allow-methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  res.setHeader('content-type','application/json');
  if(req.url==='/api/athletes') {
    res.end(JSON.stringify({athletes:[],summary:{total:0}}));return;
  }
  if(req.url==='/api/coupons/quote') {
    let raw='';for await(const chunk of req)raw+=chunk;
    const body=JSON.parse(raw);
    assert.equal(body.couponCode,'ABCDEF0123456789ABCDEF0123456789');
    const originalAmount=body.beer?10000:9000;
    res.end(JSON.stringify({originalAmount,discountAmount:1000,amount:originalAmount-1000,currency:'BRL'}));return;
  }
  if(req.url==='/api/registrations') {
    let raw='';for await(const chunk of req)raw+=chunk;
    submittedRegistration=JSON.parse(raw);
    if(registrationSuccess) {
      expectedOrderKey=req.headers['idempotency-key'];
      res.writeHead(201).end(JSON.stringify({orderId,amount:9000,discountAmount:0,currency:'BRL',status:'PENDING_PAYMENT'}));return;
    }
    res.writeHead(422).end(JSON.stringify({error:{message:'Teste: payload capturado.'}}));return;
  }
  if(req.url===`/api/orders/${orderId}/status`){
    assert.equal(req.headers['idempotency-key'],expectedOrderKey);
    res.end(JSON.stringify({orderId,status:'PENDING_PAYMENT',amount:9000,checkoutState:'READY',reservationExpired:false}));return;
  }
  if(req.url==='/api/registrations/payment-check') {
    assert.equal(req.method,'POST');assert.equal(req.headers['idempotency-key'],undefined);
    let raw='';for await(const chunk of req)raw+=chunk;
    assert.deepEqual(JSON.parse(raw),{phone:'(35) 99999-1234'});manualChecks++;
    res.end(JSON.stringify({action:'MISSING_REFERENCE',retryAfter:0}));return;
  }
  assert.equal(req.url,'/api/registrations/eligibility',`Rota inesperada: ${req.url}; origem: ${req.headers.referer}`);
  let raw='';for await(const chunk of req)raw+=chunk;
  const body=JSON.parse(raw);
  assert.equal(body.phone,'(35) 99999-1234');requests++;
  if(body.orderId){assert.equal(body.orderId,orderId);assert.equal(req.headers['idempotency-key'],key);}
  if(fail)res.writeHead(503).end(JSON.stringify({error:{message:'Nao foi possivel verificar sua pre-inscricao.'}}));
  else res.end(JSON.stringify({action,...(action==='CONTINUE'?{athlete}:{}),...(action==='RESUME_ORDER'?{orderId}:{}),...(action==='STATUS_AVAILABLE'?{summary}:{})}));
});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const apiPort=api.address().port;
let vite,chrome,ws;
const tempRoot=realpathSync(tmpdir());const profile=mkdtempSync(join(tempRoot,'beer-run-browser-'));
const pending=new Map();let sequence=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<100;i++){const value=await fn();if(value)return value;await sleep(100);}throw new Error('Browser test timed out');}
function command(method,params={}){
  const id=++sequence;
  return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
}
const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const harness = {
  name: 'registration-browser-test',
  resolveId(id) { if (id === 'virtual:registration-test') return '\0registration-test'; },
  load(id) {
    if (id !== '\0registration-test') return;
    return `import {createApp,h} from 'vue';
      import '/src/styles/main.css';
      import Registration from '/src/components/OfficialRegistrationPage.vue';
      createApp({render:()=>h(Registration)}).mount('#app');`;
  },
  configureServer(server) {
    server.middlewares.use('/registration-test', (_req,res)=>{
      res.setHeader('content-type','text/html');
      res.end('<div id="app"></div><script type="module" src="/@id/virtual:registration-test"></script>');
    });
  },
};
try {
  vite=await createViteServer({root,envDir:false,configFile:false,plugins:[harness,(await import('@vitejs/plugin-vue')).default()],
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
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/registration-test'});
  await until(()=>evaluate("!!document.querySelector('.auth-input')"));
  assert.equal(await evaluate("window.dataLayer.filter(a=>a[0]==='event'&&a[1]==='inscricao_visualizada').length"),1);
  // Confere o layout em desktop e celular; captura opcional para revisao visual.
  for(const width of [900,375]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    const layout=await evaluate(`(()=>{const input=document.querySelector('.auth-input').getBoundingClientRect();
      const button=document.querySelector('.btn-auth').getBoundingClientRect();return {
      overflow:document.documentElement.scrollWidth>innerWidth,stacked:button.top>=input.bottom+10,
      onlyOne:document.querySelectorAll('.auth-form button').length===1,
      oldButton:document.body.innerText.includes('ACOMPANHAR MEU PEDIDO')}})()`);
    assert.deepEqual(layout,{overflow:false,stacked:true,onlyOne:true,oldButton:false});
    if(process.env.CAPTURE_UI==='true'){
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,`registration-access-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  const load=async()=>{
    await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/registration-test'});
    await until(()=>evaluate("!!document.querySelector('.auth-input')"));
    await evaluate(`(()=>{const input=document.querySelector('.auth-input');input.value='35999991234';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await evaluate("document.querySelector('.auth-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  };
  // Rascunho antigo sem nome nao deve apagar o nome recebido da pre-inscricao.
  await evaluate(`localStorage.setItem('beer_run_draft_35999991234',JSON.stringify({currentStep:1,form:{name:''}}))`);
  await load();
  await until(()=>evaluate("document.body.innerText.includes('Localizamos sua')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('encontrado na lista'));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('.reg-form input[type=text]')"));
  assert.equal(await evaluate("document.querySelector('.reg-form input[type=text]').readOnly"),false);
  assert.equal(await evaluate("document.querySelector('.reg-form input[type=text]').value"),athlete.name);
  assert.equal(await evaluate("document.querySelector('.reg-form input[placeholder^=\"Ex: Mestre\"]').value"),athlete.nickname);
  assert.equal(await evaluate("document.querySelector('.reg-form input[placeholder=\"000.000.000-00\"]').value"),'');
  assert.equal(await evaluate("document.querySelector('.reg-form input[type=date]').value"),'');
  action='RECOVERY_REQUIRED';await load();
  await until(()=>evaluate("document.body.innerText.includes('cadastro precisa de')"));
  assert.equal(await evaluate("!!document.querySelector('.btn-start-wizard')"),false);
  action='NOT_FOUND';await load();
  await until(()=>evaluate("!!document.querySelector('.modal-form')"));
  assert.equal(await evaluate("document.querySelector('.modal-form input[type=tel]').value"),'(35) 99999-1234');
  assert.ok((await evaluate('document.body.innerText')).includes('Entre na lista de espera'));
  await evaluate("document.querySelector('.close-btn').click()");
  await until(()=>evaluate("!document.querySelector('.modal-overlay')"));
  assert.equal(await evaluate("document.querySelector('.auth-input').value"),'(35) 99999-1234');
  fail=true;await load();
  await until(()=>evaluate("document.body.innerText.includes('Nao foi possivel verificar')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('encontrado na lista'));
  assert.equal(requests,4);
  assert.equal(await evaluate("!!document.querySelector('.modal-form')"),false);
  fail=false;
  action='WAITLIST_NOT_CALLED';await load();
  await until(()=>evaluate("document.body.innerText.includes('Aguarde a convocação')"));
  assert.equal(await evaluate("!!document.querySelector('.btn-start-wizard')"),false);
  assert.equal(await evaluate("!!document.querySelector('.reg-form')"),false);
  assert.equal(await evaluate("!!document.querySelector('.modal-form')"),false);
  // Rascunho anterior a camiseta retorna a etapa 3; espetinhos nao viram tamanho.
  action='CONTINUE';
  await evaluate(`localStorage.setItem('beer_run_draft_35999991234',JSON.stringify({currentStep:4,form:{
    name:'Atleta Teste',cpf:'52998224725',birthDate:'1990-01-01',email:'teste@example.com',
    emergencyContactName:'Contato Teste',emergencyContactPhone:'35999995678',cityState:'Natercia / MG',
    skewerChoice:'2 Carne',shirtSize:'2 Carne',acceptedTerms:true,couponCode:'ABCDEF0123456789ABCDEF0123456789'}}))`);
  await load();await until(()=>evaluate("!!document.querySelector('.btn-start-wizard')"));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('#shirt-size')"));
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"),'');
  assert.equal(await evaluate("document.querySelector('#shirt-size').disabled"),true);
  assert.equal(await evaluate("document.querySelector('#shirt-model').value"),'');
  await evaluate("document.querySelector('.btn-step-next').click()");
  assert.ok((await evaluate('document.body.innerText')).includes('selecione o modelo e o tamanho'));
  const chooseShirt = async (id,value) => evaluate(`(()=>{const s=document.getElementById(${JSON.stringify(id)});s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await chooseShirt('shirt-model','UNISEX');
  assert.deepEqual(await evaluate("[...document.querySelector('#shirt-size').options].map(o=>o.value)"),['','P','M','G','GG','EXG','EXGG','G1','G2','G3']);
  await chooseShirt('shirt-size','G3');
  assert.ok((await evaluate("document.querySelector('#shirt-measurements').textContent")).includes('91 cm de altura × 78 cm'));
  await chooseShirt('shirt-model','BABYLOOK');
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"),'');
  assert.deepEqual(await evaluate("[...document.querySelector('#shirt-size').options].map(o=>o.value)"),['','P','M','G','GG','EXG','EXGG']);
  await chooseShirt('shirt-size','G');
  assert.ok((await evaluate("document.querySelector('#shirt-measurements').textContent")).includes('58 cm de altura × 47 cm'));
  await chooseShirt('shirt-size','EXGG');
  assert.ok((await evaluate("document.querySelector('#shirt-measurements').textContent")).includes('65 cm de altura × 52 cm'));
  await command('Page.bringToFront');
  await evaluate("document.querySelector('.shirt-guide summary').focus()");
  assert.equal(await evaluate("document.activeElement === document.querySelector('.shirt-guide summary')"),true);
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate("document.querySelector('.shirt-guide').open"),true);
  assert.equal(await evaluate("document.querySelectorAll('.shirt-guide tr.selected').length"),1);
  for(const width of [900,375,320]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    const guideLayout = await evaluate("[...document.querySelectorAll('.shirt-guide table')].map(t=>{const r=t.getBoundingClientRect();return {left:r.left,right:r.right,viewport:innerWidth,guide:document.querySelector('.shirt-guide').getBoundingClientRect().width,card:document.querySelector('.step-card').getBoundingClientRect().width}})");
    assert.ok(guideLayout.every(r=>r.left>=0&&r.right<=r.viewport),JSON.stringify({width,guideLayout}));
  }
  await evaluate("document.querySelector('.shirt-guide summary').click()");
  assert.equal(await evaluate("document.querySelector('.shirt-guide').open"),false);
  console.log('PASS: modelos e grades, medidas, teclado e tabelas dentro da tela em 900/375/320px.');
  await until(()=>evaluate("JSON.parse(localStorage.getItem('beer_run_draft_35999991234')).form.shirtSize==='EXGG'"));
  await load();await until(()=>evaluate("!!document.querySelector('.btn-start-wizard')"));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('#shirt-size')"));
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"),'EXGG');
  assert.equal(await evaluate("document.querySelector('#shirt-model').value"),'BABYLOOK');
  await evaluate("document.querySelector('.skewer-row-veg input').click()");
  assert.equal(await evaluate("document.querySelector('#shirt-size').value"),'EXGG');
  for(const width of [900,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    if(process.env.CAPTURE_UI==='true') {
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,`registration-shirts-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  await evaluate("document.querySelector('.btn-step-next').click()");
  await until(()=>evaluate("!!document.querySelector('.regulation-card')"));
  assert.equal(await evaluate("document.querySelectorAll('.step-tab').length"),5);
  assert.equal(await evaluate("!!document.querySelector('.btn-submit-registration')"),false);
  assert.equal(await evaluate("!!document.querySelector('#registration-coupon')"),false);
  await evaluate("document.querySelector('.terms-checkbox-label input').click()");
  assert.equal(await evaluate("document.querySelector('.btn-step-next').disabled"),true);
  await evaluate("document.querySelector('.reg-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  assert.equal(submittedRegistration,undefined,'Etapa de regulamento nao deve criar pedido');
  assert.equal(await evaluate("!!document.querySelector('.regulation-card')"),true);
  await evaluate("document.querySelector('.terms-checkbox-label input').click()");
  await evaluate("document.querySelector('.btn-step-next').click()");
  await until(()=>evaluate("!!document.querySelector('.btn-submit-registration')"));
  assert.ok((await evaluate("document.querySelector('.review-total').textContent")).includes('90,00'));
  assert.equal(await evaluate("!!document.querySelector('#registration-coupon')"),false);
  await evaluate("document.querySelector('.reg-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await until(()=>submittedRegistration);
  assert.equal(submittedRegistration.shirtSize,'EXGG');
  assert.equal(submittedRegistration.shirtModel,'BABYLOOK');
  assert.equal(submittedRegistration.skewerChoice,'Vegetariano');
  assert.equal(submittedRegistration.amount,undefined);
  assert.equal(submittedRegistration.couponCode,undefined,'Cupom antigo no rascunho nao pode ser enviado sem elegibilidade');
  await until(()=>evaluate("window.dataLayer.some(a=>a[1]==='inscricao_erro'&&a[2].etapa===5)"));
  const analyticsEvents=await evaluate("window.dataLayer.filter(a=>a[0]==='event').map(a=>[a[1],a[2]])");
  for(const name of ['inscricao_visualizada','inscricao_consulta','inscricao_inicio','inscricao_etapa_visualizada','inscricao_etapa_concluida','submit_inscricao_oficial','inscricao_erro']) {
    assert.ok(analyticsEvents.some(([event])=>event===name),name);
  }
  assert.ok(analyticsEvents.some(([event,p])=>event==='inscricao_etapa_concluida'&&p.etapa===3&&p.camiseta==='EXGG'));
  assert.ok(!analyticsEvents.some(([event])=>event==='conversao_inscricao_oficial_sucesso'),'422 nao conta conversao');
  const sent=JSON.stringify(analyticsEvents);
  for(const privateValue of ['35999991234','52998224725','Atleta de Teste','Contato Teste','ABCDEF0123456789ABCDEF0123456789']) assert.ok(!sent.includes(privateValue));
  console.log('PASS: funil GA4, kit, validacao e erro da API sem conversao falsa nem dados pessoais.');
  console.log('PASS: camiseta obrigatoria, migracao e restauracao de rascunho, espetinhos independentes, layout e payload.');
  athlete.couponEligible=true;
  await load();await until(()=>evaluate("!!document.querySelector('.btn-start-wizard')"));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('#registration-coupon')"));
  await evaluate("(()=>{const input=document.querySelector('#registration-coupon');input.value='ABCDEF0123456789ABCDEF0123456789';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  assert.equal(await evaluate("document.querySelector('.btn-submit-registration').disabled"),true);
  await evaluate("document.querySelector('.coupon-controls button').click()");
  await until(()=>evaluate("!!document.querySelector('.review-discount')"));
  assert.ok((await evaluate("document.querySelector('.review-total').textContent")).includes('80,00'));
  assert.equal(await evaluate("window.dataLayer.filter(a=>a[1]==='inscricao_cupom'&&a[2].resultado==='aplicado'&&a[2].desconto===10).length"),1);
  // Voltar para editar o kit invalida a previa e recalcula a inscricao com chopp.
  await evaluate("document.querySelector('.review-edit-button').click()");
  await until(()=>evaluate("!!document.querySelector('#shirt-size')"));
  await evaluate("document.querySelectorAll('.choice-cards-row')[1].querySelector('input').click()");
  await evaluate("document.querySelector('.btn-step-next').click()");
  await until(()=>evaluate("!!document.querySelector('.regulation-card')"));
  await evaluate("document.querySelector('.btn-step-next').click()");
  await until(()=>evaluate("!!document.querySelector('.payment-review-card')"));
  assert.equal(await evaluate("!!document.querySelector('.review-discount')"),false);
  assert.ok((await evaluate("document.querySelector('.review-total').textContent")).includes('100,00'));
  assert.equal(await evaluate("document.querySelector('.btn-submit-registration').disabled"),true);
  await evaluate("document.querySelector('.coupon-controls button').click()");
  await until(()=>evaluate("!!document.querySelector('.review-discount')"));
  assert.ok((await evaluate("document.querySelector('.review-total').textContent")).includes('90,00'));
  for(const width of [900,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    if(process.env.CAPTURE_UI==='true') {
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,`registration-review-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  submittedRegistration=null;
  await evaluate("document.querySelector('.reg-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await until(()=>submittedRegistration);
  assert.equal(submittedRegistration.couponCode,'ABCDEF0123456789ABCDEF0123456789');
  assert.equal(submittedRegistration.beer,true);
  assert.equal(submittedRegistration.amount,undefined);
  await until(()=>evaluate("JSON.parse(localStorage.getItem('beer_run_draft_35999991234')).form.couponCode==='ABCDEF0123456789ABCDEF0123456789'"));
  athlete.couponEligible=false;
  await load();await until(()=>evaluate("!!document.querySelector('.btn-start-wizard')"));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('.btn-submit-registration')"));
  assert.equal(await evaluate("!!document.querySelector('#registration-coupon')"),false);
  submittedRegistration=null;
  await evaluate("document.querySelector('.reg-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await until(()=>submittedRegistration);
  assert.equal(submittedRegistration.couponCode,undefined);
  console.log('PASS: campo de cupom somente para celular elegivel, envio autorizado e remocao de cupom antigo apos revogacao.');
  console.log('PASS: cinco etapas, aceite obrigatorio, resumo sem/com chopp, desconto e recalculo apos editar o kit.');
  // Outro navegador, sem credenciais: consulta publica exibe pagamento sem dados privados.
  await evaluate('localStorage.clear()');
  action='STATUS_AVAILABLE';await load();
  await until(()=>evaluate("!!document.querySelector('.public-status')"));
  assert.ok((await evaluate('document.body.innerText')).includes('Pagamento pendente'));
  assert.equal(await evaluate('localStorage.length'),0);
  assert.equal(await evaluate("!!document.querySelector('.private-access-card')"),false);
  assert.equal(manualChecks,0);
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Atualizar status')).click()");
  await until(()=>evaluate("document.body.innerText.includes('Ainda não recebemos os identificadores')"));
  assert.equal(manualChecks,1);
  for(const width of [900,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
  }
  // Reconsulta antes de abrir o checkout: pagamento confirmado elimina o botao e nao navega.
  summary={...summary,status:'PAID',checkoutUrl:null};
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Continuar pagamento')).click()");
  await until(()=>evaluate("document.body.innerText.includes('Inscrição confirmada')"));
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Continuar pagamento'))"),false);
  assert.ok((await evaluate('location.href')).includes('/registration-test'));
  action='AMBIGUOUS';await load();
  await until(()=>evaluate("document.body.innerText.includes('mais de um cadastro')"));
  assert.equal(await evaluate("!!document.querySelector('.public-status')"),false);
  // Link publico valido abre apenas o checkout; nao grava a chave privada.
  action='STATUS_AVAILABLE';summary={...summary,status:'PENDING_PAYMENT',checkoutUrl:'https://checkout.infinitepay.io/test-link'};
  await load();
  await until(()=>evaluate("!!document.querySelector('.public-status')"));
  let checkoutOpened=false;
  const observeCheckout=event=>{const m=JSON.parse(event.data);if(m.method==='Fetch.requestPaused' && m.params.request.url===summary.checkoutUrl)checkoutOpened=true;};
  ws.addEventListener('message',observeCheckout);
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Continuar pagamento')).click()");
  await until(()=>checkoutOpened);
  ws.removeEventListener('message',observeCheckout);
  action='NOT_FOUND';await load();
  await evaluate(`localStorage.setItem('beer_run_order_v1_${orderId}',JSON.stringify({orderId:'${orderId}',key:'${key}'}));localStorage.setItem('beer_run_last_order_v1','${orderId}')`);
  // Um contexto salvo nao exibe botao extra nem ignora a consulta de telefone.
  action='RECOVERY_REQUIRED';await load();
  await until(()=>evaluate("document.body.innerText.includes('cadastro precisa de')"));
  assert.ok(!(await evaluate('document.body.innerText')).includes('ACOMPANHAR MEU PEDIDO'));
  action='RESUME_ORDER';await load();
  await until(()=>evaluate("[...document.querySelectorAll('button')].some(button=>button.textContent.includes('Continuar pagamento'))"));
  assert.ok((await evaluate('document.body.innerText')).includes(orderId));
  // Sucesso real da API simulada: mede pedido salvo, sem afirmar que foi pago.
  action='CONTINUE';registrationSuccess=true;
  await evaluate(`localStorage.setItem('beer_run_draft_35999991234',JSON.stringify({currentStep:5,form:{
    name:'Atleta de Teste',cpf:'52998224725',birthDate:'1990-01-01',gender:'M',email:'teste@example.com',
    phone:'35999991234',cityState:'Natercia / MG',emergencyContactName:'Contato Teste',emergencyContactPhone:'35999995678',
    modality:'corrida',drinksBeer:false,skewerChoice:'2 Carne',shirtSize:'G',shirtModel:'UNISEX',acceptedTerms:true}}))`);
  await load();await until(()=>evaluate("!!document.querySelector('.btn-start-wizard')"));
  await evaluate("document.querySelector('.btn-start-wizard').click()");
  await until(()=>evaluate("!!document.querySelector('.btn-submit-registration')"));
  await evaluate("document.querySelector('.reg-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await until(()=>evaluate("window.dataLayer.some(a=>a[1]==='conversao_inscricao_oficial_sucesso')"));
  const successes=await evaluate("window.dataLayer.filter(a=>a[1]==='conversao_inscricao_oficial_sucesso').map(a=>a[2])");
  assert.equal(successes.length,1);assert.equal(successes[0].value,90);assert.equal(successes[0].camiseta,'G');
  assert.equal(successes[0].currency,'BRL');assert.equal(successes[0].com_cupom,'nao');
  const successCommands=await evaluate("JSON.stringify(window.dataLayer)");
  for(const secret of [orderId,key,'52998224725','35999991234','teste@example.com']) assert.ok(!successCommands.includes(secret));
  assert.equal(await evaluate("window.dataLayer.some(a=>a[1]==='purchase')"),false);
  console.log('PASS: conversao de pedido salvo com valor em reais, sem purchase e sem identificadores privados.');
  console.log('PASS: pre-inscricao preenche nome e apelido editaveis; CPF e nascimento vazios; recuperacao e falha nao viram numero inexistente.');
  console.log('PASS: consulta unica, layout desktop/mobile e retomada de pedido validada pelo backend.');
  console.log('PASS: consulta publica sem chave, checkout existente, revalidacao antes de pagar e ambiguidade.');
  // Botao principal usa a mesma consulta de /#inscricao antes da lista de espera.
  action='NOT_FOUND';
  await evaluate('localStorage.clear()');
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
  await until(()=>evaluate("!!document.querySelector('.hero-btn')"));
  await evaluate("document.querySelector('.hero-btn').click()");
  await until(()=>evaluate("!!document.querySelector('.auth-input')"));
  assert.equal(await evaluate('location.hash'),'#inscricao');
  assert.equal(await evaluate("!!document.querySelector('.modal-form')"),false);
  const beforeInvalid=requests;
  for(const invalid of ['359999','35899991234']) {
    await evaluate(`(()=>{const input=document.querySelector('.auth-input');input.value='${invalid}';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await evaluate("document.querySelector('.auth-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
    await until(()=>evaluate("document.body.innerText.includes('válido com DDD')"));
    assert.equal(await evaluate("!!document.querySelector('.modal-form')"),false);
  }
  assert.equal(requests,beforeInvalid);
  await evaluate("(()=>{const input=document.querySelector('.auth-input');input.value='35999991234';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await evaluate("document.querySelector('.auth-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await until(()=>evaluate("!!document.querySelector('.modal-form')"));
  assert.equal(await evaluate("document.querySelector('.modal-form input[type=tel]').value"),'(35) 99999-1234');
  console.log('PASS: botao principal abre consulta; celular invalido pede correcao; nao encontrado abre lista com WhatsApp preenchido.');
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
