import { ref, onMounted, onUnmounted } from 'vue'

export function usePublicAthletes() {
  const athletes = ref([])
  const summary = ref(null)
  const loading = ref(true)
  const error = ref('')
  let active = false
  let timer
  let controller
  async function refresh() {
    if (active) return
    active = true
    loading.value = true
    error.value = ''
    controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      if (!base) throw new Error('API indisponível')
      const response = await fetch(base + '/api/athletes', { signal: controller.signal, cache: 'no-store', credentials: 'omit' })
      if (!response.ok) throw new Error('Consulta indisponível')
      const data = await response.json()
      if (!Array.isArray(data.athletes) || !data.summary || data.summary.total !== data.athletes.length) throw new Error('Resposta inválida')
      if (!Number.isInteger(data.summary.preRegisteredCount) || data.summary.preRegisteredCount < 0) throw new Error('Resposta inválida')
      athletes.value = data.athletes
      summary.value = data.summary
    } catch {
      athletes.value = []
      summary.value = null
      error.value = 'Não foi possível carregar os atletas. Tente novamente em instantes.'
    } finally {
      clearTimeout(timeout)
      active = false
      loading.value = false
    }
  }
  const refreshVisible = () => { if (document.visibilityState === 'visible') refresh() }
  onMounted(() => {
    refresh()
    timer = setInterval(refreshVisible, 60000)
    document.addEventListener('visibilitychange', refreshVisible)
  })
  onUnmounted(() => {
    clearInterval(timer)
    controller?.abort()
    document.removeEventListener('visibilitychange', refreshVisible)
  })
  return { athletes, summary, loading, error, refresh }
}
