<template>
  <div class="coupon-entry font-condensed">
    <label for="registration-coupon">Cupom de desconto (opcional)</label>
    <div class="coupon-controls">
      <input id="registration-coupon" :value="modelValue" class="vintage-input"
        type="text" maxlength="32" autocomplete="off" autocapitalize="characters" spellcheck="false"
        :disabled="disabled" placeholder="Digite seu cupom"
        @input="emit('update:modelValue', $event.target.value.trim().toUpperCase())" />
      <button type="button" class="btn-vintage font-condensed" :disabled="disabled || checking || !modelValue"
        @click="apply">{{ checking ? 'CONFERINDO...' : 'APLICAR' }}</button>
    </div>
    <p>Uso único para o seu celular.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="quote && showTotal" aria-live="polite">
      Inscrição: {{ money(quote.originalAmount) }} · Desconto: {{ money(quote.discountAmount) }}
      · <strong>Total: {{ money(quote.amount) }}</strong>
    </p>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { quoteCoupon } from '../services/checkout.js'
import { trackRegistrationEvent } from '../services/analytics.js'
import { analyticsErrorKind } from '../services/analytics-policy.js'

const props = defineProps({ modelValue: { type: String, default: '' }, phone: String, beer: Boolean, disabled: Boolean, showTotal: { type: Boolean, default: true } })
const emit = defineEmits(['update:modelValue', 'quote'])
const checking = ref(false)
const error = ref('')
const quote = ref(null)
let revision = 0
onUnmounted(() => { revision++ })
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)

watch(() => [props.modelValue, props.phone, props.beer], () => {
  revision++
  checking.value = false
  quote.value = null
  error.value = ''
  emit('quote', null)
}, { flush: 'sync' })

async function apply() {
  trackRegistrationEvent('inscricao_cupom', { resultado: 'tentativa' })
  const current = ++revision
  quote.value = null
  emit('quote', null)
  error.value = ''
  if (!/^[0-9A-F]{32}$/.test(props.modelValue)) {
    trackRegistrationEvent('inscricao_cupom', { resultado: 'formato_invalido' })
    error.value = 'Confira o código de 32 caracteres enviado pela organização.'
    return
  }
  checking.value = true
  try {
    const result = await quoteCoupon({ couponCode: props.modelValue, phone: props.phone, beer: props.beer })
    if (current !== revision) return
    trackRegistrationEvent('inscricao_cupom', { resultado: 'aplicado', desconto: result.discountAmount / 100, currency: 'BRL' })
    quote.value = result
    emit('quote', result)
  } catch (failure) {
    if (current === revision) {
      trackRegistrationEvent('inscricao_cupom', { resultado: [409, 422].includes(failure.status) ? 'rejeitado' : 'indisponivel', tipo_erro: analyticsErrorKind(failure) })
      error.value = failure.message
    }
  } finally {
    if (current === revision) checking.value = false
  }
}
</script>

<style scoped>
.coupon-entry { margin: 20px 0; padding: 16px; border: 1px solid currentColor; border-radius: 8px; }
.coupon-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.coupon-controls input { flex: 1; min-width: 180px; padding: 10px; }
.coupon-controls button { padding: 10px 16px; }
.coupon-entry p { margin-top: 10px; }
</style>
