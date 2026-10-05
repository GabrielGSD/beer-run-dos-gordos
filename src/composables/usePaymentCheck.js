import { ref, onUnmounted } from 'vue'

export function usePaymentCheck(requestCheck) {
  const checkMessage = ref(''), retrySeconds = ref(0)
  let timer, disposed = false
  function wait(seconds) {
    clearInterval(timer)
    const until = Date.now() + Math.max(0, seconds) * 1000
    const tick = () => {
      retrySeconds.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      if (!retrySeconds.value) clearInterval(timer)
    }
    tick()
    if (retrySeconds.value) timer = setInterval(tick, 1000)
  }
  function resetCheck() { clearInterval(timer); retrySeconds.value = 0; checkMessage.value = '' }
  async function checkPayment() {
    if (retrySeconds.value) return
    checkMessage.value = ''
    try {
      const result = await requestCheck()
      if (disposed) return
      wait(result.retryAfter || 0)
      checkMessage.value = ({
        CHECKED: 'Pagamento consultado na InfinitePay.',
        MISSING_REFERENCE: 'Ainda não recebemos os identificadores deste pagamento. Se já pagou, aguarde o retorno da InfinitePay ou fale com a organização.',
        IN_PROGRESS: 'A verificação já está em andamento. Aguarde alguns segundos e atualize novamente.',
        COOLDOWN: 'O pagamento foi consultado há pouco. Aguarde para verificar novamente.',
        REVIEW_REQUIRED: 'Este pagamento precisa de conferência pela organização. Não faça outro pagamento.',
        PROVIDER_UNAVAILABLE: 'Não foi possível confirmar o pagamento na InfinitePay agora. A verificação será tentada novamente.',
        FINAL: 'Situação do pedido atualizada.',
      })[result.action] || 'Não foi possível verificar o pagamento.'
    } catch (error) {
      if (!disposed) wait(error.retryAfter || 0)
      throw error
    }
  }
  onUnmounted(() => { disposed = true; clearInterval(timer) })
  return { checkPayment, checkMessage, retrySeconds, resetCheck }
}
