<template>
  <section class="public-status vintage-card font-condensed" aria-labelledby="public-status-title">
    <h1 id="public-status-title" class="font-slab">Situação da inscrição</h1>
    <p class="phone">Celular consultado: {{ phone }}</p>
    <p class="status" role="status">{{ label }}</p>
    <p>{{ message }}</p>
    <p v-if="checkMessage" role="status">{{ checkMessage }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button v-if="summary.checkoutUrl" class="btn-vintage" :disabled="busy" @click="refresh(true)">Continuar pagamento</button>
      <button class="btn-vintage" :disabled="busy || retrySeconds > 0" @click="refresh(false)">{{ busy ? 'Consultando…' : retrySeconds ? `Aguarde ${retrySeconds}s` : 'Atualizar status' }}</button>
    </div>
    <p class="private-help">Para conferir seus dados pessoais, abra o link privado que você guardou ao fazer a inscrição ou use o navegador original.</p>
    <a href="https://wa.me/5535997500430?text=Preciso%20de%20ajuda%20com%20minha%20inscri%C3%A7%C3%A3o%20na%20Beer%20Run." target="_blank" rel="noopener noreferrer">Falar com a organização</a>
    <button class="another" :disabled="busy" @click="$emit('back')">Consultar outro celular</button>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { getRegistrationEligibility, openCheckout, refreshPaymentByPhone } from '../services/checkout.js'
import { usePaymentCheck } from '../composables/usePaymentCheck.js'
const props = defineProps({ phone: { type: String, required: true }, initialStatus: { type: Object, required: true } })
const emit = defineEmits(['back', 'resume'])
const summary = ref(props.initialStatus), busy = ref(false), error = ref('')
const { checkPayment, checkMessage, retrySeconds } = usePaymentCheck(() => refreshPaymentByPhone(props.phone))
const review = computed(() => summary.value.paymentReviewRequired || summary.value.status === 'REVIEW_REQUIRED')
const label = computed(() => {
  if (review.value) return 'Em verificação pela organização'
  if (summary.value.reservationExpired) return 'Reserva expirada'
  return ({ PENDING_PAYMENT: 'Pagamento pendente', PAID: 'Inscrição confirmada', CANCELLED: 'Pedido cancelado', EXPIRED: 'Reserva expirada', REFUNDED: 'Pagamento reembolsado' })[summary.value.status] || 'Consulte a organização'
})
const message = computed(() => {
  if (review.value) return 'A organização precisa conferir esta inscrição. Se já pagou, não faça outro pagamento.'
  if (summary.value.status === 'PAID') return 'Seu pagamento está confirmado.'
  if (summary.value.checkoutUrl) return 'Você pode continuar o pagamento pelo link da sua inscrição.'
  if (summary.value.status === 'PENDING_PAYMENT' && !summary.value.reservationExpired) return 'O link de pagamento ainda não está disponível. Atualize o status em instantes ou fale com a organização.'
  return 'Para esclarecer a situação da inscrição, entre em contato com a organização.'
})
async function refresh(pay) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    if (!pay && summary.value.status === 'PENDING_PAYMENT') await checkPayment()
    const result = await getRegistrationEligibility(props.phone)
    if (result.action === 'RESUME_ORDER') { emit('resume', result.orderId); return }
    if (result.action !== 'STATUS_AVAILABLE' || !result.summary) {
      summary.value = { status: 'REVIEW_REQUIRED', checkoutUrl: null }
      throw new Error('Não foi possível identificar uma inscrição única. Consulte novamente o celular ou fale com a organização.')
    }
    summary.value = result.summary
    if (pay && result.summary.checkoutUrl) openCheckout(result.summary.checkoutUrl)
  } catch (e) { error.value = e.message }
  finally { busy.value = false }
}
</script>
<style scoped>
.public-status { max-width: 620px; margin: 32px auto; padding: 28px; }
h1 { font-size: 1.6rem; }
p { margin: 16px 0; line-height: 1.6; }
.phone, .private-help { color: var(--text-muted); }
.status { font-size: 1.3rem; font-weight: 700; }
.actions { display: grid; gap: 12px; margin: 22px 0; }
.btn-vintage { width: 100%; padding: 14px; }
.another { display: block; margin-top: 24px; background: none; border: 0; text-decoration: underline; font: inherit; cursor: pointer; }
.error { color: #78281f; }
button:disabled { opacity: .6; cursor: wait; }
</style>
