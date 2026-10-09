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
let fail=false,confirmedOnly=false,requests=0;
const runner={name:'Joao Teste',nickname:'Relampago',modality:'corrida',drinksBeer:true};
const walker={name:'Atleta Pendente',nickname:'Passo Leve',modality:'caminhada',drinksBeer:false};
const api=createServer(async(req,res)=>{
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('content-type','application/json');
  assert.equal(req.url,'/api/athletes');
  assert.equal(req.method,'GET');
  assert.equal(req.headers['idempotency-key'],undefined);
  requests++;
  if(fail)res.writeHead(503).end('{}');
  else res.end(JSON.stringify({athletes:confirmedOnly?[runner]:[runner,walker],summary:{total:confirmedOnly?1:2,drinkers:1,nonDrinkers:confirmedOnly?0:1,preRegisteredCount:confirmedOnly?1:0,waitlistCount:33,capacity:2}}));
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
    define:{'import.meta.env.VITE_API_URL':'""',
      'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""','import.meta.env.VITE_GA_MEASUREMENT_ID':'"G-XXXXXXXXXX"'},
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
  await command('Page.addScriptToEvaluateOnNewDocument',{source:`
    sessionStorage.setItem('beer_run_staff_auth','true');
    localStorage.setItem('beer_run_athlete_waitlist',JSON.stringify([
      {id:1,name:'Aguardando Teste',status:'waiting',phone:'35999991231'},
      {id:2,name:'Convocado Teste',status:'called',phone:'35999991232'},
      {id:3,name:'Inscrito Teste',status:'registered',phone:'35999991233'},
      {id:4,name:'Cancelado Teste',status:'cancelled',phone:'35999991234'}
    ]));
  `});
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/athletes-test'});
  await until(()=>evaluate("!!document.querySelector('.tab-badge.badge-warning')"));
  await evaluate("document.querySelector('.tab-badge.badge-warning').closest('button').click()");
  await until(()=>evaluate("!!document.querySelector('[aria-label=\"Visualiza??o da lista de espera\"]')"));
  assert.equal(await evaluate("document.querySelector('.tab-badge.badge-warning').textContent"),'2');
  const listText=()=>evaluate("document.querySelector('.mobile-waitlist-list').textContent");
  assert.ok((await listText()).includes('Convocado Teste'));
  assert.ok(!(await listText()).includes('Inscrito Teste'));
  assert.ok(!(await listText()).includes('Cancelado Teste'));
  await evaluate("window.testStaff.updateWaitlistStatus(2,'registered')");
  await until(()=>evaluate("document.querySelector('.tab-badge.badge-warning').textContent==='1'"));
  assert.ok(!(await listText()).includes('Convocado Teste'));
  for(const width of [1100,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await evaluate(`(()=>{const el=document.querySelector('[aria-label="Visualiza??o da lista de espera"]');el.value='history';el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(async()=> (await listText()).includes('Inscrito Teste'));
    assert.ok((await listText()).includes('Convocado Teste'));
    assert.ok((await listText()).includes('Cancelado Teste'));
    assert.ok(!(await listText()).includes('Aguardando Teste'));
    await evaluate(`(()=>{const el=document.querySelector('[aria-label="Visualiza??o da lista de espera"]');el.value='active';el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(async()=> (await listText()).includes('Aguardando Teste'));
  }
  console.log('PASS: painel mostra fila ativa, atualiza contagem apos registered e preserva historico desktop/mobile.');
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
