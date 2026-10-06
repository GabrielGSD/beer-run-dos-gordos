// Formulario real, Supabase simulado e rede externa bloqueada. Nao usa .env real.
import { createServer as createViteServer } from 'vite';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const attempts = [], saved = [], unexpected = [];
let fail = false;
const api = createServer(async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', '*');
  res.setHeader('access-control-allow-methods', 'POST,HEAD,GET,OPTIONS');
  res.setHeader('access-control-expose-headers', 'content-range');
  res.setHeader('content-type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/rest/v1/athlete_waitlist' && req.method === 'POST') {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const [record] = JSON.parse(raw);
    attempts.push(record);
    if (fail) { res.writeHead(403).end(JSON.stringify({ code: '42501', message: 'Simulated failure' })); return; }
    saved.push(record);
    res.writeHead(201).end(JSON.stringify({ id: crypto.randomUUID(), ...record }));
    return;
  }
  if (path === '/rest/v1/athlete_waitlist' && req.method === 'HEAD') {
    res.setHeader('content-range', `0-${saved.length - 1}/${saved.length}`);
    res.writeHead(200).end(); return;
  }
  unexpected.push({ path, method: req.method });
  res.writeHead(400).end('{}');
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiBase = 'http://127.0.0.1:' + api.address().port;
let vite, chrome, ws;
const tempRoot = realpathSync(tmpdir());
const profile = mkdtempSync(join(tempRoot, 'beer-run-preregistration-'));
const pending = new Map(); let sequence = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) {
  for (let i = 0; i < 100; i++) { const value = await fn(); if (value) return value; await sleep(100); }
  throw new Error('Browser test timed out');
}
function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
const evaluate = async expression => {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const harness = {
  name: 'preregistration-test',
  resolveId(id) { if (id === 'virtual:preregistration-test') return '\0preregistration-test'; },
  load(id) {
    if (id !== '\0preregistration-test') return;
    return `import {createApp,h} from 'vue';
      import '/src/styles/main.css';
      import Registration from '/src/components/RegistrationModal.vue';
      import {useAthletes,MAX_ATHLETES} from '/src/composables/useAthletes.js';
      import {initGA} from '/src/services/analytics.js';
      initGA();
      window.testAthletes=useAthletes(); window.testCapacity=MAX_ATHLETES;
      createApp({render:()=>h(Registration,{isOpen:true})}).mount('#app');`;
  },
  configureServer(server) {
    server.middlewares.use('/preregistration-test', (_req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end('<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="app"></div><script type="module" src="/@id/virtual:preregistration-test"></script>');
    });
  },
};
try {
  vite = await createViteServer({ root, envDir: false, configFile: false,
    plugins: [harness, (await import('@vitejs/plugin-vue')).default()],
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(apiBase),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(apiBase),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key-no-real-credentials'),
      'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify('G-TESTPREREG'),
      'import.meta.env.VITE_GA_DEBUG': JSON.stringify('true') },
    server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await vite.listen();
  const pageUrl = 'http://127.0.0.1:' + vite.httpServer.address().port + '/preregistration-test';
  const binary = process.env.BROWSER_BINARY || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!existsSync(binary)) throw new Error('Configure BROWSER_BINARY com o caminho do Chrome/Edge.');
  chrome = spawn(binary, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const debugPort = await until(() => { try { return Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch { return null; } });
  const tabs = await (await fetch('http://127.0.0.1:' + debugPort + '/json')).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) { const p = pending.get(message.id); pending.delete(message.id); if (message.error) p?.reject(new Error(message.error.message)); else p?.resolve(message.result); }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const local = ['127.0.0.1', 'localhost'].includes(new URL(request.url).hostname);
      await command(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', local ? { requestId } : { requestId, errorReason: 'BlockedByClient' });
    }
  });
  await command('Page.enable'); await command('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const loadForm = async count => {
    await command('Page.navigate', { url: pageUrl });
    await until(() => evaluate("!!document.querySelector('.modal-form')"));
    await evaluate(`window.testAthletes.athletes.value=Array.from({length:${count}},(_,id)=>({id,name:'Atleta existente'}));localStorage.clear()`);
    await evaluate(`(()=>{const inputs=document.querySelectorAll('.modal-form input');
      ['Atleta Teste','Apelido','35999991234'].forEach((value,i)=>{inputs[i].value=value;inputs[i].dispatchEvent(new Event('input',{bubbles:true}));});})()`);
  };
  const submit = () => evaluate("document.querySelector('.modal-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await loadForm(0);
  const capacity = await evaluate('window.testCapacity');
  for (const count of [0, capacity, capacity + 1]) {
    await loadForm(count);
    const before = saved.length;
    await submit();
    await until(() => evaluate("!!document.querySelector('.waitlist-ticket-card')"));
    assert.equal(saved.length, before + 1);
    assert.equal(saved.at(-1).status, 'waiting');
    assert.equal(saved.at(-1).name, 'Atleta Teste');
    assert.equal(saved.at(-1).phone, '(35) 99999-1234');
    assert.equal(await evaluate('window.testAthletes.athletes.value.length'), count);
    assert.ok((await evaluate('document.body.innerText')).includes('Aguarde a convocação'));
    assert.equal(await evaluate("window.dataLayer.filter(e=>e[1]==='join_waitlist').length"), 1);
    assert.equal(await evaluate("window.dataLayer.filter(e=>e[1]==='sign_up').length"), 0);
  }
  console.log('PASS: pre-inscricao grava somente athlete_waitlist com status waiting, abaixo/no/acima do limite.');
  fail = true;
  await loadForm(0);
  const before = saved.length, attemptsBefore = attempts.length;
  await submit();
  await until(() => evaluate("!!document.querySelector('.error-banner')"));
  assert.equal(attempts.length, attemptsBefore + 1);
  assert.equal(saved.length, before);
  assert.equal(await evaluate("!!document.querySelector('.waitlist-ticket-card')"), false);
  assert.equal(await evaluate("localStorage.getItem('beer_run_athlete_waitlist')"), null);
  assert.equal(await evaluate("window.dataLayer.filter(e=>e[1]==='join_waitlist').length"), 0);
  assert.equal(await evaluate("document.querySelector('.modal-form input').value"), 'Atleta Teste');
  fail = false;
  await submit();
  await until(() => evaluate("!!document.querySelector('.waitlist-ticket-card')"));
  assert.equal(saved.length, before + 1);
  assert.deepEqual(unexpected, [], 'Nao deve ler/gravar athletes nem criar pedido na pre-inscricao');
  console.log('PASS: erro no Supabase nao gera sucesso ou fallback local; dados preservados para nova tentativa.');
} finally {
  try { if (ws?.readyState === WebSocket.OPEN) await command('Browser.close'); } catch {}
  ws?.close();
  if (chrome && chrome.exitCode === null) { await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), sleep(3000)]); if (chrome.exitCode === null) chrome.kill(); }
  await vite?.close(); await new Promise(resolve => api.close(resolve));
  if (dirname(realpathSync(profile)) === tempRoot && basename(profile).startsWith('beer-run-preregistration-')) {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
