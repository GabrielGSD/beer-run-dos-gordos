import { ref, readonly, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

// Lista e bloqueio compartilham o mesmo retrato, inclusive nos links diretos.
const athletes = ref([]), summary = ref(null), loading = ref(true), error = ref('')
let pending, timer, consumers = 0, checkedAt = 0
async function refresh(force = true) {
  if (pending) return pending
  if (!force && Date.now() - checkedAt < 10000) return
  loading.value = true
  pending = (async () => {
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      if (!base) throw new Error('API indisponível')
      const response = await fetch(base + '/api/athletes', { signal: AbortSignal.timeout(15000), cache: 'no-store', credentials: 'omit' })
      if (!response.ok) throw new Error('Consulta indisponível')
      const data = await response.json()
      if (!Array.isArray(data.athletes) || !data.summary || data.summary.total !== data.athletes.length) throw new Error('Resposta inválida')
      if (!Number.isInteger(data.summary.preRegisteredCount) || data.summary.preRegisteredCount < 0) throw new Error('Resposta inválida')
      athletes.value = data.athletes
      summary.value = data.summary
      error.value = ''
    } catch {
      athletes.value = []
      summary.value = null
      error.value = 'Não foi possível carregar os atletas. Tente novamente em instantes.'
    } finally {
      checkedAt = Date.now()
      loading.value = false
      pending = null
    }
  })()
  return pending
}
const refreshVisible = () => { if (document.visibilityState !== 'hidden') void refresh() }

export function usePublicAthletes() {
  let active = false
  function start() {
    if (active) return
    active = true
    if (++consumers === 1) {
      timer = setInterval(refreshVisible, 30000)
      document.addEventListener('visibilitychange', refreshVisible)
      window.addEventListener('focus', refreshVisible)
    }
    void refresh(false)
  }
  function stop() {
    if (!active) return
    active = false
    if (--consumers === 0) {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshVisible)
      window.removeEventListener('focus', refreshVisible)
    }
  }
  onMounted(start)
  onActivated(start)
  onDeactivated(stop)
  onUnmounted(stop)
  return { athletes: readonly(athletes), summary: readonly(summary), loading: readonly(loading), error: readonly(error), refresh }
}
