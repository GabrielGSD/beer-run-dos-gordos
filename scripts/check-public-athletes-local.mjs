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
try {
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
      const local=['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'].includes(url.hostname);
      await command(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId}:{requestId,errorReason:'BlockedByClient'});
    }
  });
  await command('Page.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await command('Page.navigate',{url:'http://localhost:5173/'});
  await until(()=>evaluate("document.querySelectorAll('#atletas .athlete-row').length>0"));
  await evaluate('document.fonts.ready.then(()=>true)');
  for(const width of [1164,375]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate("document.querySelector('#atletas').scrollIntoView({behavior:'instant'})");
    await sleep(300);
    const styles=await evaluate("(()=>{const read=s=>getComputedStyle(document.querySelector('#atletas '+s));return {badge:read('.counter-badge').display,background:read('.counter-badge').backgroundColor,row:read('.athlete-row').flexDirection,info:read('.athlete-main-info').display,beer:read('.beer-status-tag').borderTopWidth,search:read('.search-icon').position,tabs:document.querySelectorAll('#atletas [aria-pressed]').length}})()");
    assert.ok(['flex','inline-flex'].includes(styles.badge));assert.equal(styles.background,'rgb(25, 23, 20)');
    assert.equal(styles.row,width>860?'row':'column');assert.equal(styles.info,'flex');
    assert.ok(parseFloat(styles.beer)>=1);assert.equal(styles.search,'absolute');assert.equal(styles.tabs,0);
    const clip=await evaluate("(()=>{const r=document.querySelector('#atletas').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()");
    const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
    const folder=join(root,'artifacts');mkdirSync(folder,{recursive:true});
    writeFileSync(join(folder,'public-athletes-live-'+width+'.png'),Buffer.from(shot.data,'base64'));
    console.log('PASS localhost full page '+width+': correct counter, row layout, badges and search styles.');
  }
} finally {
  try { if(ws?.readyState===WebSocket.OPEN)await command('Browser.close'); } catch {}
  ws?.close();
  if(chrome && chrome.exitCode===null){await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(3000)]);if(chrome.exitCode===null)chrome.kill();}
  
  // Somente o perfil temporario criado nesta execucao; nunca o perfil do usuario.
  if(dirname(realpathSync(profile))===tempRoot && basename(profile).startsWith('beer-run-browser-')) {
    rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
