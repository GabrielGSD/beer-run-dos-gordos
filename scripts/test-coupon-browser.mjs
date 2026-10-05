// Navegador isolado, API simulada e rede externa bloqueada. Nao usa .env real.
import {createServer as createViteServer} from 'vite';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const coupon='ABCDEF0123456789ABCDEF0123456789';
let requests=0, delayNext=false;
const api=createServer(async(req,res)=>{
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-headers','content-type,idempotency-key');
  res.setHeader('access-control-allow-methods','POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  res.setHeader('content-type','application/json');
  if(req.url!=='/api/coupons/quote'){res.writeHead(404).end('{}');return;}
  let raw='';for await(const chunk of req)raw+=chunk;
  const body=JSON.parse(raw);requests++;
  assert.deepEqual(Object.keys(body).sort(),['beer','couponCode','phone']);
  if(delayNext){delayNext=false;await new Promise(resolve=>setTimeout(resolve,400));}
  if(body.couponCode!==coupon || body.phone!=='35999991234'){
    res.writeHead(409).end(JSON.stringify({error:{code:'COUPON_UNAVAILABLE',message:'Cupom indisponivel para este celular.'}}));return;
  }
  const originalAmount=body.beer?10000:9000;
  res.end(JSON.stringify({originalAmount,discountAmount:1000,amount:originalAmount-1000,currency:'BRL'}));
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
  name: 'coupon-browser-test',
  resolveId(id) { if (id === 'virtual:coupon-test') return '\0coupon-test'; },
  load(id) {
    if (id !== '\0coupon-test') return;
    return `import {createApp,reactive,h} from 'vue';
      import CouponEntry from '/src/components/CouponEntry.vue';
      const state=reactive({code:'',phone:'35999991234',beer:true}); window.couponTest=state;
      createApp({render:()=>h(CouponEntry,{modelValue:state.code,phone:state.phone,beer:state.beer,
        'onUpdate:modelValue':value=>state.code=value})}).mount('#app');`;
  },
  configureServer(server) {
    server.middlewares.use('/coupon-test', (_req,res)=>{
      res.setHeader('content-type','text/html');
      res.end('<div id="app"></div><script type="module" src="/@id/virtual:coupon-test"></script>');
    });
  },
};
try {
  vite=await createViteServer({root,envDir:false,configFile:false,plugins:[harness,(await import('@vitejs/plugin-vue')).default()],
    define:{'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:'+apiPort),
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
  await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/coupon-test'});
  await until(()=>evaluate("!!document.querySelector('#registration-coupon')"));
  const typeCode=async value=>evaluate(`(()=>{const input=document.querySelector('#registration-coupon');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const apply=()=>evaluate("document.querySelector('button').click()");
  const hasTotal=()=>evaluate("document.body.innerText.includes('Total:')");
  await typeCode(coupon.toLowerCase());await apply();
  await until(hasTotal);
  assert.ok((await evaluate('document.body.innerText')).includes('90,00'));
  await evaluate('window.couponTest.beer=false');
  await until(async()=>!(await hasTotal()));
  await apply();await until(hasTotal);
  assert.ok((await evaluate('document.body.innerText')).includes('80,00'));
  await evaluate("window.couponTest.phone='35999991235'");
  await until(async()=>!(await hasTotal()));
  await apply();await until(()=>evaluate("document.body.innerText.includes('indisponivel')"));
  assert.equal(await hasTotal(),false);
  await evaluate("window.couponTest.phone='35999991234'");
  delayNext=true;const before=requests;await apply();await until(()=>requests>before);
  await typeCode('B'.repeat(32));await sleep(600);
  assert.equal(await hasTotal(),false,'Resposta antiga nao pode restaurar desconto de outro codigo');
  await typeCode('');
  assert.equal(await evaluate("document.querySelector('button').disabled"),true);
  console.log('PASS: previa, normalizacao, troca de kit/celular, erro e resposta atrasada no navegador.');
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
