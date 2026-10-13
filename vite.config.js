import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const api = env.VITE_API_URL || ''
  if (env.VITE_STAFF_PIN) throw new Error('Remova VITE_STAFF_PIN. Credenciais do staff pertencem somente ao backend.')
  if (api) {
    const url = new URL(api)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('VITE_API_URL deve conter somente a origem da API.')
    if (process.env.NETLIFY && url.protocol !== 'https:') throw new Error('A API deve usar HTTPS no Netlify.')
  }
  return {
    plugins: [vue(), {
      name: 'staff-same-origin-proxy',
      writeBundle(options) {
        const redirects = readFileSync(path.resolve('public/_redirects'), 'utf8')
        if (!api) throw new Error('Configure VITE_API_URL para publicar o painel com seguranca.')
        writeFileSync(path.resolve(options.dir, '_redirects'), `/api/staff/* ${api.replace(/\/$/, '')}/api/staff/:splat 200!\n${redirects}`)
      },
    }],
    server: { proxy: api ? { '/api/staff': { target: api, changeOrigin: true } } : {} },
    resolve: { alias: { '@': path.resolve('./src') } },
  }
})
