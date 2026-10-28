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

let fail=false;
let teamFail=false, teamRequests=0;
const teamRows = [
  {name:'João Equipe',amount:5500,orders:{status:'PENDING_PAYMENT'},selection:{shirt:true,shirtModel:'UNISEX',shirtSize:'G'},items:[{id:'shirt',label:'Camiseta',quantity:1,unitAmount:2600},{id:'medal',label:'Medalha',quantity:1,unitAmount:1900},{id:'cup',label:'Copo',quantity:1,unitAmount:1000}]},
  {name:'Marina Equipe',amount:3500,orders:[{status:'PAID'}],selection:{skewerQuantity:2,skewerChoice:'Vegetariano',drink:'BEER'},items:[{id:'skewer',label:'Espetinho',quantity:2,unitAmount:1000},{id:'beer',label:'Bebida com chopp',quantity:1,unitAmount:1500}]},
  {name:'Sem Kit',amount:0,orders:null},
  ...['CANCELLED','EXPIRED','REFUNDED'].map(status=>({name:status,amount:1000,orders:{status},items:[{id:'cup',label:'Copo',quantity:1,unitAmount:1000}]})),
  {name:'Sem Pedido',amount:1000,orders:null,items:[{id:'cup',label:'Copo',quantity:1,unitAmount:1000}]},
].map((row,index)=>({id:index+1,email:`equipe${index}@example.test`,phone:'35999991234',created_at:'2026-10-20T12:00:00Z',selection:{},items:[],...row}));
const staffPin='private-browser-test';
const rows=[
 {id:1,name:'Pago Teste',payment_status:'completed',accepted_terms_at:'2026-10-01',modality:'corrida',drinks_beer:true,shirt_model:'UNISEX',shirt_size:'M',skewer_choice:'2 Carne'},
 {id:2,name:'Pendente Teste',payment_status:null,accepted_terms_at:'2026-10-01',modality:'caminhada',drinks_beer:false},
 {id:3,name:'Pre Teste',payment_status:null,modality:'corrida',drinks_beer:false},
 {id:4,name:'Pago Legado',payment_status:'completed',modality:'corrida',drinks_beer:true},
].map(row=>({nickname:null,phone:'35999991234',shirt_model:null,shirt_size:null,skewer_choice:null,accepted_terms_at:null,is_checked_in:false,...row}));
let sessionActive = false;
const csrfToken = 'b'.repeat(64);
const api=createServer(async(req,res)=>{
 res.setHeader('content-type','application/json');
 res.setHeader('cache-control','no-store');
 let body=''; for await (const chunk of req) body+=chunk;
 if(req.url==='/api/staff/login') {
   if(JSON.parse(body).pin!==staffPin){res.writeHead(401).end(JSON.stringify({error:{message:'Senha incorreta'}}));return;}
   sessionActive=true;
   res.setHeader('set-cookie','beer_run_staff=test-browser-session; Path=/; HttpOnly; SameSite=Strict');
   res.end(JSON.stringify({csrfToken,expiresAt:new Date(Date.now()+3600000).toISOString()}));return;
 }
 assert.equal(req.headers.authorization,undefined);
 if(!sessionActive || !req.headers.cookie?.includes('beer_run_staff=test-browser-session')){res.writeHead(401).end(JSON.stringify({error:{message:'Entre novamente'}}));return;}
 if(req.url==='/api/staff/session'){res.end(JSON.stringify({csrfToken,expiresAt:new Date(Date.now()+3600000).toISOString()}));return;}
 if(req.url==='/api/staff/logout') {
   assert.equal(req.headers['x-staff-csrf'],csrfToken);
   sessionActive=false;
   res.setHeader('set-cookie','beer_run_staff=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
   res.end(JSON.stringify({success:true}));return;
 }
 if(req.url==='/api/staff/team'){
   teamRequests++;
   if(teamFail){res.writeHead(503).end(JSON.stringify({error:{message:'Equipe indisponivel'}}));return;}
   res.end(JSON.stringify({rows:teamRows}));return;
 }
 if(req.url!=='/api/staff/athletes'){res.end(JSON.stringify({rows:[]}));return;}
 if(fail){res.writeHead(503).end(JSON.stringify({error:{message:'Dados indisponiveis'}}));return;}
 res.end(JSON.stringify({athletes:rows,summary:{total:4,confirmedCount:2,totalReceivedCents:7505,confirmedWithoutPaymentCount:1,currency:'BRL',capacity:100}}));
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
  name: 'athletes-browser-test',
  resolveId(id) { if (id === 'virtual:athletes-test') return '\0athletes-test'; },
  load(id) {
    if (id !== '\0athletes-test') return;
    return `import {createApp,h} from 'vue';
      import '/src/styles/main.css';
      import Registration from '/src/components/StaffDashboard.vue';
      import {useStaff} from '/src/composables/useStaff.js';
      window.testStaff=useStaff();
      createApp({render:()=>h(Registration)}).mount('#app');`;
  },
  configureServer(server) {
    server.middlewares.use('/athletes-test', (_req,res)=>{
      res.setHeader('content-type','text/html');
      res.end('<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="app"></div><script type="module" src="/@id/virtual:athletes-test"></script>');
    });
  },
};
try {
  vite=await createViteServer({root,envDir:false,configFile:false,plugins:[harness,(await import('@vitejs/plugin-vue')).default()],
    define:{'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:'+apiPort),
      'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""','import.meta.env.VITE_GA_MEASUREMENT_ID':'"G-XXXXXXXXXX"'},
    server:{host:'127.0.0.1',port:0,proxy:{'/api/staff':{target:'http://127.0.0.1:'+apiPort,changeOrigin:true}}},logLevel:'error'});
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
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/athletes-test'});

  await until(()=>evaluate("!!document.querySelector('#staff-pin-page')"));
  await until(()=>evaluate("document.querySelector('.login-form button[type=submit]')?.disabled===false"));
  const submitPin=async pin=>evaluate("(()=>{const input=document.querySelector('#staff-pin-page');input.value="+JSON.stringify(pin)+";input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.login-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));})()");
  await submitPin('incorrect');
  await until(()=>evaluate("!!document.querySelector('.login-form .error-banner')"));
  assert.equal(await evaluate("document.querySelectorAll('[data-testid=confirmed-kpi]').length"),0);
  await submitPin(staffPin);
  await until(()=>evaluate("document.querySelector('[data-testid=confirmed-kpi] .kpi-value')?.textContent==='2'"));
  assert.equal((await evaluate("document.querySelector('[data-testid=revenue-kpi] .kpi-value').textContent")).replace(/\s/g,''),'R$75,05');
  assert.equal(await evaluate("document.cookie.includes('beer_run_staff')"),false);
  assert.equal(await evaluate("sessionStorage.getItem('beer_run_staff_pin')"),null);
  assert.equal(await evaluate("JSON.stringify(localStorage).includes('private-browser-test')"),false);
  await command('Page.reload');
  await until(()=>evaluate("document.querySelector('[data-testid=confirmed-kpi] .kpi-value')?.textContent==='2'"));

  assert.ok((await evaluate("document.querySelector('[data-testid=revenue-kpi]').textContent")).includes('1 pagante(s)'));
  for(const width of [1100,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await sleep(100);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
  }
  await evaluate("[...document.querySelectorAll('.tab-btn')].find(button=>button.textContent.includes('Atletas')).click()");
  await until(()=>evaluate("document.querySelectorAll('.mobile-athletes-list .mobile-data-card').length===4"));
  assert.equal(await evaluate("document.querySelectorAll('.mobile-athletes-list .tag-paid').length"),2);
  assert.equal(await evaluate("document.querySelectorAll('.data-table .tag-paid').length"),2);
  assert.equal(await evaluate("document.querySelectorAll('.mobile-athletes-list .tag-wait-pay').length"),1);
  assert.ok((await evaluate("document.querySelector('.mobile-athletes-list').textContent")).includes('2 Carne'));
  assert.ok((await evaluate("document.querySelector('.data-table').textContent")).includes('Masculina / unissex'));
  const listStyles = () => evaluate(`(()=>{
    const selectors=['.pane-toolbar','.search-input','.pill-btn','.btn-sm','.table-container','.table-summary-bar','.data-table th','.data-table td','.tag-paid','.mobile-data-card'];
    const properties=['display','padding','backgroundColor','borderRadius','borderTopWidth','fontSize','fontFamily','color'];
    return Object.fromEntries(selectors.map(selector=>{const style=getComputedStyle(document.querySelector(selector));return [selector,Object.fromEntries(properties.map(prop=>[prop,style[prop]]))]}));
  })()`);
  const athleteStyles = {};
  mkdirSync(join(root,'artifacts'),{recursive:true});
  for(const width of [1050,390]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    athleteStyles[width]=await listStyles();
    const shot=await command('Page.captureScreenshot',{format:'png'});
    writeFileSync(join(root,`artifacts/staff-athletes-reference-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  const csv = await evaluate(`(async()=>{
    const originalCreate = URL.createObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    let blob;
    try {
      URL.createObjectURL = value => { blob = value; return 'blob:test'; };
      HTMLAnchorElement.prototype.click = function() {};
      window.testStaff.exportAthletesCSV();
      return await blob.text();
    } finally {
      URL.createObjectURL = originalCreate;
      HTMLAnchorElement.prototype.click = originalClick;
    }
  })()`);
  const csvLines = csv.trim().split('\n');
  assert.equal(csvLines[0], 'Posicao;Nome;Apelido;Telefone;Espetinhos Chegada;Tamanho Camiseta;Modalidade;Bebe Cerveja;Status Pagamento;Check-in Realizado;Responsavel;Nascimento');
  assert.equal(csvLines.length,5);
  assert.ok(csvLines[1].includes('2 Carne'));
  assert.ok(csvLines[2].includes('Aguardando Pagamento'));
  assert.ok(csvLines.every(line=>line.split(';').length===12));
  await evaluate("document.querySelector('.pill-completed').click()");
  await until(()=>evaluate("document.querySelectorAll('.mobile-athletes-list .mobile-data-card').length===2"));
  await evaluate("document.querySelector('.pill-status').click()");
  await until(()=>evaluate("document.querySelectorAll('.mobile-athletes-list .mobile-data-card').length===4"));
  fail=true;
  await evaluate('window.testStaff.fetchStaffAthletes()');
  assert.equal(await evaluate("document.querySelectorAll('.mobile-athletes-list .mobile-data-card').length"),0);
  assert.ok(await evaluate("!!document.querySelector('[role=alert]')"));
  await evaluate("[...document.querySelectorAll('.tab-btn')].find(button=>button.textContent.includes('Geral')).click()");
  assert.equal(await evaluate("document.querySelector('[data-testid=revenue-kpi] .kpi-value').textContent"),'\u2014');
  fail=false;
  await evaluate('window.testStaff.fetchStaffAthletes()');
  assert.equal(await evaluate("document.querySelector('[data-testid=confirmed-kpi] .kpi-value').textContent"),'2');
  await evaluate("[...document.querySelectorAll('.tab-btn')].find(button=>button.textContent.includes('Equipe')).click()");
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===7"));
  assert.equal(await evaluate("document.querySelectorAll('.team-stat, .team-heading').length"),0);
  assert.ok((await evaluate("document.querySelector('[data-status=PAID]').textContent")).includes('(1)'));
  assert.ok((await evaluate("document.querySelector('.team-row').textContent")).includes('unissex'));
  assert.ok((await evaluate("document.querySelector('.team-panel').textContent")).includes('Vegetariano'));
  assert.equal(await evaluate("document.querySelectorAll('.team-row .tag-paid').length"),1);
  const setSearch = value=>evaluate(`(()=>{const el=document.querySelector('[aria-label="Buscar na equipe"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const setFilter = value=>evaluate(`(()=>{const el=document.querySelector('[aria-label="Filtrar pagamento da equipe"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await setSearch('joao');
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===1"));
  await setSearch('(35) 99999-1234');
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===7"));
  await setSearch('equipe1@example.test');
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===1"));
  await setSearch('');
  for(const status of ['PAID','PENDING_PAYMENT','NO_PAYMENT','CANCELLED','EXPIRED','REFUNDED','UNKNOWN']) {
    await setFilter(status);
    await until(()=>evaluate("document.querySelectorAll('.team-row').length===1"));
    if(status==='NO_PAYMENT')assert.ok((await evaluate("document.querySelector('.team-row').textContent")).includes('Nenhum item selecionado'));
  }
  await setSearch('no results');
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===0"));
  assert.ok((await evaluate("document.querySelector('.table-empty').textContent")).includes('Nenhum cadastro encontrado'));
  await evaluate("document.querySelector('.clear-filters').click()");
  await until(()=>evaluate("document.querySelectorAll('.team-row').length===7"));
  // Clipboard succeeds or gives an actionable fallback without losing the link.
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedTeamLink=value}}});document.querySelector('.team-actions button').click()");
  await until(()=>evaluate("document.querySelector('.team-copy-feedback')?.textContent.includes('copiado')"));
  assert.equal(await evaluate('window.copiedTeamLink'),`http://127.0.0.1:${port}/cadastro-staff`);
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}});document.querySelector('.team-actions button').click()");
  await until(()=>evaluate("!!document.querySelector('.team-share-link input')"));
  assert.equal(await evaluate("document.querySelector('.team-share-link input').value"),`http://127.0.0.1:${port}/cadastro-staff`);
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});document.querySelector('.team-actions button').click()");
  const requestCount=teamRequests;
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Atualizar').click()");
  await until(()=>teamRequests>requestCount);
  teamFail=true;
  await evaluate("document.querySelector('.team-refresh').click()");
  await until(()=>evaluate("!!document.querySelector('.team-panel [role=alert]')"));
  assert.equal(await evaluate("document.querySelectorAll('.team-row').length"),7);
  assert.ok((await evaluate("document.querySelector('.team-panel [role=alert]').textContent")).includes('última atualização'));
  teamFail=false;
  await evaluate("document.querySelector('.team-refresh').click()");
  await until(()=>evaluate("document.querySelector('.team-panel').getAttribute('aria-busy')==='false' && !document.querySelector('.team-panel [role=alert]')"));
  mkdirSync(join(root,'artifacts'),{recursive:true});
  for(const width of [1440,1100,1050,900,768,390,320]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate('window.scrollTo(0,0)');
    await sleep(100);
    assert.equal(await evaluate("[...document.querySelectorAll('.team-panel *')].some(el=>el.getBoundingClientRect().right>innerWidth+1)"),false,`Team overflow at ${width}`);
    if(athleteStyles[width]) assert.deepEqual(await listStyles(),athleteStyles[width],`Team uses the same computed styles as athletes at ${width}`);
    if(width<=390)assert.equal(await evaluate("new Set([...document.querySelectorAll('.tab-btn')].map(el=>el.getBoundingClientRect().top)).size"),1,'All six mobile tabs share one row');
    if([1440,1050,390].includes(width)) {
      const shot=await command('Page.captureScreenshot',{format:'png'});
      writeFileSync(join(root,`artifacts/staff-team-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  await evaluate('window.testStaff.logout()');
  assert.equal(await evaluate("sessionStorage.getItem('beer_run_staff_pin')"),null);
  assert.equal(await evaluate('window.testStaff.athletes.value.length'),0);
  console.log('PASS: staff login, athletes, financial totals, team kit details, payment filters, search, copy link, refresh, errors, desktop/mobile and logout.');
} finally {
  try { if(ws?.readyState===WebSocket.OPEN)await command('Browser.close'); } catch {}
  ws?.close();
  if(chrome && chrome.exitCode===null){await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(3000)]);if(chrome.exitCode===null)chrome.kill();}
  await vite?.close();await new Promise(resolve=>api.close(resolve));
  // Somente o perfil temporario criado nesta execucao; nunca o perfil do usuario.
  if(dirname(realpathSync(profile))===tempRoot && basename(profile).startsWith('beer-run-browser-')) {
    rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:500});
  }
}
