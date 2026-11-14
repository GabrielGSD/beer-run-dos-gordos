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
const productionUI=process.argv.includes('--production-ui');
let fail=false,confirmedOnly=false,longList=false,kidsList=false,requests=0;
const runner={name:'Joao Teste',nickname:'Relampago',modality:'corrida',drinksBeer:true};
const walker={name:'Atleta Confirmado',nickname:'Passo Leve',modality:'caminhada',drinksBeer:false};
const kid={name:'Crianca Confirmada',nickname:null,modality:'kids',drinksBeer:false};
const api=createServer(async(req,res)=>{
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('content-type','application/json');
  assert.equal(req.url,'/api/athletes');
  assert.equal(req.method,'GET');
  assert.equal(req.headers['idempotency-key'],undefined);
  requests++;
  if(fail)res.writeHead(503).end('{}');
  else {
    const athletes=longList?Array.from({length:30},(_,index)=>({...runner,name:`Atleta ${index+1}`})):confirmedOnly?[runner]:kidsList?[runner,kid]:[runner,walker];
    res.end(JSON.stringify({athletes,summary:{total:athletes.length,drinkers:longList?30:1,nonDrinkers:confirmedOnly||longList?0:1,preRegisteredCount:confirmedOnly?1:0,waitlistCount:33,capacity:2}}));
  }
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
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},10000);
    pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const harness = {
  name: 'athletes-browser-test',
  resolveId(id) { if (id === 'virtual:athletes-test') return '\0athletes-test'; },
  load(id) {
    if (id !== '\0athletes-test') return;
    return `import {createApp,h} from 'vue';
      import '/src/styles/main.css';
      import Registration from '/src/components/ConfirmedAthletesSection.vue';
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
    define:{'import.meta.env.DEV':!productionUI,'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:'+apiPort),
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
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/athletes-test'});
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===2"));
  if(productionUI){
    assert.equal(await evaluate("document.querySelector('.scroll-controls')"),null);
    longList=true;
    await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
    await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===30"));
    for(const width of [1100,375]){
      await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
      assert.equal(await evaluate("document.querySelector('.scroll-controls')"),null);
      assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
      assert.ok(await evaluate("(()=>{const el=document.querySelector('.athletes-scroll-wrapper');el.scrollTop=100;return el.scrollTop>0})()"));
      await evaluate("(()=>{const input=document.querySelector('input');input.value='Atleta 30';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
      await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===1"));
      await evaluate("document.querySelector('.clear-search-btn').click()");
      await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===30"));
      assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),0);
    }
    longList=false;kidsList=true;
    await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
    await until(()=>evaluate("!!document.querySelector('.kids-badge')"));
    assert.equal(await evaluate("document.querySelector('.scroll-controls')"),null);
    console.log('PASS: production UI has no recording controls, manual scrolling and search work on desktop/mobile, KIDS badge preserved.');
  } else {
  assert.equal(await evaluate("document.querySelectorAll('[role=tab], [aria-pressed], .athletes-groups').length"),0);
  assert.equal(await evaluate("document.querySelector('.section-title').textContent"),'ATLETAS CONFIRMADOS');
  assert.equal(await evaluate("document.querySelector('.counter-label').textContent"),'ATLETAS CONFIRMADOS');
  assert.equal(await evaluate("document.querySelector('.counter-number').textContent"),'02');
  assert.equal(await evaluate("document.querySelectorAll('.drinks-yes').length"),1);
  assert.equal(await evaluate("document.querySelectorAll('.drinks-no').length"),1);
  assert.equal(await evaluate("document.querySelector('.pill-waitlist')"),null);
  assert.equal(await evaluate("document.querySelector('.btn-auto-scroll').disabled"),true);
  assert.equal((await evaluate("document.querySelector('.pill-pre-registered').textContent")).trim(),'0 PRÉ INSCRITOS');
  assert.equal(await evaluate("document.querySelector('.athlete-name').textContent"),'Joao "Relampago" Teste');
  const initial=await evaluate("document.querySelector('.athletes-list').textContent");
  await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await until(()=>requests>=2);
  await until(()=>evaluate("document.querySelector('.athletes-scroll-wrapper').getAttribute('aria-busy')==='false'"));
  assert.equal(await evaluate("document.querySelector('.athletes-list').textContent"),initial);
  await evaluate("(()=>{const input=document.querySelector('input');input.value='passo';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===1"));
  assert.equal(await evaluate("document.querySelector('.athlete-number').textContent"),'#01');
  await evaluate("(()=>{const input=document.querySelector('input');input.value='ausente';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===0"));
  await evaluate("document.querySelector('.clear-search-btn').click()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===2"));
  kidsList=true;
  await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await until(()=>evaluate("!!document.querySelector('.kids-badge')"));
  assert.equal((await evaluate("document.querySelector('.kids-badge').textContent")).trim(),'KIDS');
  assert.equal(await evaluate("document.querySelector('.kids-badge').closest('.athlete-row').querySelector('.beer-status-tag')"),null);
  assert.equal(await evaluate("document.querySelector('.counter-number').textContent"),'02');
  assert.equal(await evaluate("document.querySelector('.counter-label').textContent"),'ATLETAS CONFIRMADOS');
  await evaluate("(()=>{const input=document.querySelector('input');input.value='crianca';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===1"));
  assert.equal(await evaluate("document.querySelector('.athlete-name').textContent"),'Crianca Confirmada');
  assert.equal(await evaluate("document.querySelector('.athlete-number').textContent"),'#01');
  await evaluate("document.querySelector('.clear-search-btn').click()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===2"));
  for(const width of [1100,375]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await sleep(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.vintage-search')).borderTopWidth"),'2px');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.athlete-row')).display"),'flex');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.athlete-row')).flexDirection"),width>860?'row':'column');
    assert.ok(await evaluate("document.querySelector('.vintage-search').getBoundingClientRect().height>=38"));
    if(process.env.CAPTURE_UI==='true'){
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
      writeFileSync(join(folder,'public-athletes-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
  }
  kidsList=false;
  confirmedOnly=true;
  await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===1"));
  assert.equal(await evaluate("document.querySelectorAll('[role=tab], [aria-pressed]').length"),0);
  assert.equal((await evaluate("document.querySelector('.pill-pre-registered').textContent")).trim(),'1 PRÉ INSCRITOS');
  assert.equal(await evaluate("document.querySelector('.counter-number').textContent"),'01');
  longList=true;
  await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===30"));
  for(const width of [1100,375]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await evaluate("document.querySelector('.scroll-reset').click()");
    await until(()=>evaluate("!document.querySelector('.btn-auto-scroll').disabled"));
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    const controls=await evaluate("(()=>{const el=document.querySelector('.scroll-controls');const r=el.getBoundingClientRect();return {position:getComputedStyle(el).position,left:r.left,bottom:innerHeight-r.bottom,width:r.width,height:r.height}})()");
    assert.equal(controls.position,'fixed');
    assert.equal(controls.left,10);
    assert.equal(controls.bottom,10);
    assert.ok(controls.width<240 && controls.height<=52,'Floating controls stay compact');
    assert.equal(await evaluate("document.querySelector('.scroll-duration input').value"),'30');
    const distance=await evaluate("(()=>{const el=document.querySelector('.athletes-scroll-wrapper');return el.scrollHeight-el.clientHeight})()");
    await evaluate("document.querySelector('.btn-auto-scroll').click()");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
    await sleep(500);
    assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),distance);
    assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
    await until(()=>evaluate("!!document.querySelector('.is-auto-scrolling')"));
    const before=await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop");
    assert.ok(before>distance*.98,'Playback starts at the bottom');
    await sleep(500);
    const after=await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop");
    assert.ok((before-after)/distance>.01 && (before-after)/distance<.04,'Moves upward at a pace of one full list per 30 seconds');
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
    assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    const paused=await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop");
    await sleep(200);
    assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),paused);
    await evaluate("document.querySelector('.btn-auto-scroll').click()");
    await evaluate("document.querySelector('.athletes-scroll-wrapper').dispatchEvent(new WheelEvent('wheel'))");
    await sleep(1100);
    assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
    assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    await evaluate("document.querySelector('.scroll-reset').click()");
    assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),distance);
    await evaluate("document.querySelector('.btn-auto-scroll').click()");
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
    await evaluate("(()=>{const el=document.querySelector('.athletes-scroll-wrapper');el.scrollTop=(el.scrollHeight-el.clientHeight)*.02;document.querySelector('.btn-auto-scroll').click()})()");
    await until(()=>evaluate("!!document.querySelector('.is-auto-scrolling')"));
    await until(()=>evaluate("!document.querySelector('.is-auto-scrolling')"));
    assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),0);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    await sleep(500);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    await until(()=>evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display!=='none'"));
    await evaluate("document.querySelector('.btn-auto-scroll').click()");
    assert.ok(await evaluate("(()=>{const el=document.querySelector('.athletes-scroll-wrapper');return el.scrollTop>(el.scrollHeight-el.clientHeight)*.98})()"));
    await evaluate("(()=>{const input=document.querySelector('input');input.value='ausente';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await until(()=>evaluate("document.querySelector('.btn-auto-scroll').disabled"));
    assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
    await evaluate("document.querySelector('.clear-search-btn').click()");
    await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===30"));
  }
  // Advance animation timestamps deterministically to verify the full duration,
  // including dropped frames, without waiting a real minute for each recording.
  await evaluate(`(() => {
    const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
    const callbacks = new Map(); let id = 0, now;
    window.requestAnimationFrame = callback => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = handle => callbacks.delete(handle);
    window.startScrollClock = () => { now = performance.now(); };
    window.advanceScrollClock = ms => { now += ms; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(now)); };
    window.restoreScrollClock = () => { window.requestAnimationFrame = request; window.cancelAnimationFrame = cancel; };
  })()`);
  for(const seconds of [23,47.5]){
    await evaluate(`(() => { const input=document.querySelector('.scroll-duration input');input.value='${seconds}';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.scroll-reset').click(); })()`);
    await evaluate("document.querySelector('.btn-auto-scroll').click()");
    await until(()=>evaluate("!!document.querySelector('.is-auto-scrolling')"));
    await evaluate("window.startScrollClock()");
    await evaluate(`window.advanceScrollClock(${seconds*500})`);
    const remaining=await evaluate("(()=>{const el=document.querySelector('.athletes-scroll-wrapper');return el.scrollTop/(el.scrollHeight-el.clientHeight)})()");
    assert.ok(Math.abs(remaining-.5)<.01,'Half the chosen time covers half the list');
    await evaluate(`window.advanceScrollClock(${seconds*500})`);
    assert.equal(await evaluate("document.querySelector('.athletes-scroll-wrapper').scrollTop"),0);
    assert.equal(await evaluate("document.querySelector('.is-auto-scrolling')"),null);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display"),'none');
    await until(()=>evaluate("getComputedStyle(document.querySelector('.scroll-controls')).display!=='none'"));
  }
  await evaluate("window.restoreScrollClock()");
  for(const value of ['', '0', '-5']){
    await evaluate(`(() => { const input=document.querySelector('.scroll-duration input');input.value='${value}';input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    assert.equal(await evaluate("document.querySelector('.btn-auto-scroll').disabled"),true);
  }
  await evaluate("(()=>{const input=document.querySelector('.scroll-duration input');input.value='30';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
  assert.equal(await evaluate("document.querySelector('.btn-auto-scroll').disabled"),false);
  longList=false;
  fail=true;
  await evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await until(()=>evaluate("!!document.querySelector('[role=alert]')"));
  assert.equal(await evaluate("document.querySelectorAll('.athlete-row').length"),0);
  fail=false;confirmedOnly=false;
  await evaluate("document.querySelector('[role=alert] button').click()");
  await until(()=>evaluate("document.querySelectorAll('.athlete-row').length===2"));
  assert.ok(requests>=7, 'Consultas explicitas e atualizacoes automaticas');
  console.log('PASS: confirmed list including Kids, KIDS badge without beverage tag, adult capacity, search, retry, desktop/mobile, custom durations, hidden controls, 1s lead-in and end delay, Escape pause, pending start cancellation and stop at top.');
  }
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
