<template>
  <section class="payment-page font-condensed" aria-labelledby="registration-summary-title">
    <header class="summary-header">
      <span class="payment-eyebrow">BEER RUN DOS GORDOS · ÁREA DO ATLETA</span>
      <h1 id="registration-summary-title">{{ title }}</h1>
    </header>

    <p v-if="error" role="alert" class="payment-error">{{ error }}</p>
    <form v-if="!context" class="summary-card restore-form" @submit.prevent="restore">
      <h2>Recuperar acesso</h2>
      <p>Para ver seus dados completos, abra o link privado que você guardou ou use o navegador em que fez a inscrição. Você também pode informar o número do pedido e sua chave de acesso abaixo.</p>
      <a class="text-button phone-status-link" href="/#inscricao">Consultar status pelo celular</a>
      <label>ID do pedido<input v-model="manualId" required autocomplete="off" /></label>
      <label>Chave de acesso<input v-model="manualKey" type="password" required autocomplete="off" /></label>
      <button class="btn-vintage" :disabled="busy">Consultar pedido</button>
    </form>

    <div v-else class="summary-layout">
      <div class="registration-details">
        <section class="summary-card athlete-card">
          <div class="card-heading"><span class="section-number">01</span><h2>Dados do atleta</h2></div>
          <template v-if="registration">
            <p class="athlete-name font-slab">{{ display(registration.name) }}</p>
            <dl class="data-grid">
              <div v-for="field in personalFields" :key="field.label"><dt>{{ field.label }}</dt><dd>{{ field.value }}</dd></div>
            </dl>
          </template>
          <p v-else class="empty-details">{{ status ? 'Os dados da inscrição não estão disponíveis. Fale com a organização para conferi-los.' : 'Consultando sua inscrição…' }}</p>
        </section>

        <section v-if="registration" class="summary-card">
          <div class="card-heading"><span class="section-number">02</span><h2>Sua participação</h2></div>
          <dl class="data-grid">
            <div><dt>Modalidade</dt><dd>{{ modality }}</dd></div>
            <div><dt>Chopp</dt><dd>{{ registration.beer === true ? 'Com chopp' : registration.beer === false ? 'Sem chopp' : 'Não informado' }}</dd></div>
            <div><dt>Espetinhos</dt><dd>{{ display(registration.skewerChoice) }}</dd></div>
            <div><dt>Camiseta</dt><dd>{{ formatShirtSelection(registration.shirtModel, registration.shirtSize) }}</dd></div>
            <div><dt>Regulamento aceito em</dt><dd>{{ dateTime(registration.acceptedTermsAt) }}</dd></div>
          </dl>
        </section>

        <section v-if="registration" class="summary-card">
          <div class="card-heading"><span class="section-number">03</span><h2>Emergência e observações</h2></div>
          <dl class="data-grid">
            <div><dt>Contato de emergência</dt><dd>{{ display(registration.emergencyContactName) }}</dd></div>
            <div><dt>Telefone de emergência</dt><dd>{{ phone(registration.emergencyContactPhone) }}</dd></div>
            <div class="full-row"><dt>Observações médicas</dt><dd class="medical-notes">{{ display(registration.medicalNotes) }}</dd></div>
          </dl>
        </section>
      </div>

      <aside class="summary-sidebar">
        <section class="summary-card payment-summary">
          <div class="payment-ribbon">RESUMO DA INSCRIÇÃO</div>
          <div class="payment-summary-body">
            <div class="status-row">
              <span class="status-badge" :class="{ confirmed: status?.status === 'PAID' }">{{ statusLabel }}</span>
              <button v-if="!terminal" class="refresh-button" @click="refresh(true)" :disabled="busy || retrySeconds > 0">{{ busy ? 'Consultando…' : retrySeconds ? `Aguarde ${retrySeconds}s` : 'Atualizar status' }}</button>
            </div>
            <p class="status-message" aria-live="polite">{{ statusMessage }}</p>
            <p v-if="checkMessage" class="status-message" role="status">{{ checkMessage }}</p>
            <template v-if="status">
              <dl v-if="status.discountAmount > 0" class="price-breakdown">
                <div><dt>Inscrição</dt><dd>{{ money(status.originalAmount) }}</dd></div>
                <div><dt>Desconto aplicado</dt><dd>− {{ money(status.discountAmount) }}</dd></div>
              </dl>
              <div class="payment-total"><span>{{ status.status === 'PAID' ? 'Valor da inscrição' : 'Total da inscrição' }}</span><strong class="font-slab">{{ money(status.amount) }}</strong></div>
              <p v-if="status.createdAt" class="order-date">Pedido criado em {{ dateTime(status.createdAt) }}</p>
            </template>
            <div v-if="canPay" class="payment-actions">
              <button class="btn-vintage" @click="pay" :disabled="busy">Continuar pagamento</button>
            </div>
            <div v-if="status" class="private-access-card">
              <div class="private-access-row">
                <p><strong>Link privado</strong><br />Acesse em outro navegador.<br />Guarde como uma senha.</p>
                <button class="quiet-button" aria-label="Copiar link privado" @click="copyPrivateLink">Copiar link</button>
              </div>
              <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
              <label v-if="showPrivateLink">Seu link privado
                <input :value="privateLink" readonly autocomplete="off" @focus="$event.target.select()" />
              </label>
            </div>
            <p v-if="context" class="order-number"><span>Número do pedido</span>{{ context.orderId }}</p>
            <a class="contact-button" :href="organizerUrl" target="_blank" rel="noopener noreferrer">Falar com a organização <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </aside>
    </div>
    <a v-if="!context" class="contact-button restore-contact" :href="organizerUrl" target="_blank" rel="noopener noreferrer">Entrar em contato com o organizador ↗</a>
    <footer class="summary-footer">
      <button class="text-button" @click="$emit('go-home')">← Voltar ao site</button>
      <button v-if="context" class="text-button" @click="changeOrder" :disabled="busy">Consultar outro pedido</button>
    </footer>
  </section>
</template>
<script setup>
import { formatShirtSelection } from '../services/shirts.js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { loadOrderContext, saveOrderContext, getOrderStatus, reconcileOrder, recoverCheckout, openCheckout, refreshOrderPayment } from '../services/checkout.js'
import { usePaymentCheck } from '../composables/usePaymentCheck.js'
import { createPrivateAccessLink, takePrivateAccessLink } from '../services/private-access.js'
const props = defineProps({ orderId: { type: String, default: '' } })
defineEmits(['go-home'])
const context = ref(null), status = ref(null), error = ref(''), busy = ref(false)
const { checkPayment, checkMessage, retrySeconds, resetCheck } = usePaymentCheck(() => refreshOrderPayment(context.value))
const manualId = ref(''), manualKey = ref('')
const copyMessage = ref(''), showPrivateLink = ref(false)
const privateLink = computed(() => context.value && status.value ? createPrivateAccessLink(context.value) : '')
async function copyPrivateLink() {
  if (!privateLink.value) return
  try {
    await navigator.clipboard.writeText(privateLink.value)
    copyMessage.value = 'Link copiado. Guarde-o para acessar sua inscrição depois.'
  } catch {
    showPrivateLink.value = true
    copyMessage.value = 'Selecione e copie o link abaixo para guardá-lo.'
  }
}
const terminal = computed(() => ['PAID', 'REFUNDED', 'CANCELLED', 'EXPIRED'].includes(status.value?.status))
const title = computed(() => status.value?.status === 'PAID' ? 'Pagamento confirmado' : terminal.value ? 'Situação do pedido' : 'Acompanhe sua inscrição')
const registration = computed(() => status.value?.registration)
const display = value => typeof value === 'string' && value.trim() ? value : 'Não informado'
const phone = value => {
  const digits = (value || '').replace(/\D/g, '').replace(/^55(?=\d{11}$)/, '')
  return digits.length === 11 ? digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : display(value)
}
const dateTime = value => value && !Number.isNaN(Date.parse(value))
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value)) : 'Não informado'
const personalFields = computed(() => {
  const r = registration.value || {}
  const cpf = (r.cpf || '').replace(/\D/g, '')
  return [
    { label: 'Apelido', value: display(r.nickname) },
    { label: 'CPF', value: cpf.length === 11 ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : display(r.cpf) },
    { label: 'Data de nascimento', value: /^\d{4}-\d{2}-\d{2}$/.test(r.birthDate || '') ? r.birthDate.split('-').reverse().join('/') : display(r.birthDate) },
    { label: 'Gênero', value: ({ M: 'Masculino', F: 'Feminino', O: 'Outro' })[r.gender] || display(r.gender) },
    { label: 'WhatsApp', value: phone(r.phone) },
    { label: 'E-mail', value: display(r.email) },
    { label: 'Cidade / UF', value: display(r.cityState) },
  ]
})
const modality = computed(() => ({ corrida: 'Corrida', caminhada: 'Caminhada', RUN: 'Corrida', WALK: 'Caminhada' })[registration.value?.modality] || display(registration.value?.modality))
const needsReview = computed(() => status.value?.paymentReviewRequired || status.value?.checkoutState === 'UNKNOWN')
const statusLabel = computed(() => {
  const s = status.value
  if (!s) return 'Consultando pedido'
  if (s.status === 'PENDING_PAYMENT' && needsReview.value) return 'Em verificação'
  if (s.status === 'PENDING_PAYMENT' && s.reservationExpired) return 'Reserva expirada'
  return ({ PAID: 'Inscrição confirmada', PENDING_PAYMENT: 'Pagamento pendente', CANCELLED: 'Pedido cancelado', EXPIRED: 'Reserva expirada', REFUNDED: 'Pagamento reembolsado' })[s.status] || 'Consultar organização'
})
const statusMessage = computed(() => {
  const s = status.value
  if (!s) return 'Aguarde enquanto consultamos a situação do seu pedido.'
  if (s.status === 'PAID') return 'Pagamento confirmado. Sua participação está garantida!'
  if (s.status === 'REFUNDED') return 'O pagamento deste pedido consta como reembolsado.'
  if (s.status === 'CANCELLED') return 'Este pedido foi cancelado. Fale com a organização para continuar.'
  if (needsReview.value) return 'A organização precisa verificar este pedido. Não faça outro pagamento.'
  if (s.reservationExpired || s.status === 'EXPIRED') return 'O prazo da reserva terminou. Se já pagou, fale com a organização e não faça outro pagamento.'
  return 'Aguardando confirmação. Atualização automática.'
})
const organizerUrl = computed(() => 'https://wa.me/5535997500430?text=' + encodeURIComponent(
  'Olá! Preciso de ajuda com minha inscrição na Beer Run dos Gordos.' + (context.value ? '\nPedido: ' + context.value.orderId : '')
))
const canPay = computed(() => status.value?.status === 'PENDING_PAYMENT' && !status.value?.reservationExpired && !status.value?.paymentReviewRequired && ['READY', 'FAILED', 'NOT_STARTED'].includes(status.value?.checkoutState))
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
let timer, disposed = false, polls = 0, reference = null, queued = false
function changeOrder() { resetCheck(); context.value = null; status.value = null; error.value = ''; manualId.value = ''; manualKey.value = ''; copyMessage.value = ''; showPrivateLink.value = false; reference = null; queued = false; clearTimeout(timer) }
async function refresh(manual = false) {
  if (busy.value || !context.value || disposed) return
  clearTimeout(timer); if (manual) polls = 0
  busy.value = true; error.value = ''
  try {
    const result = await getOrderStatus(context.value)
    if (disposed) return
    if (reference?.order_nsu && reference.order_nsu !== result.orderNsu) {
      throw new Error('O retorno não corresponde ao pedido salvo neste navegador. Consulte a organização com o ID correto.')
    }
    status.value = result
    // Persistir somente depois que o backend validar o acesso, inclusive links privados.
    try { saveOrderContext(context.value.orderId, context.value.key) }
    catch { error.value = 'Acesso validado, mas este navegador não conseguiu guardá-lo. Copie seu link privado antes de sair.' }
    if (reference && !queued && result.status === 'PENDING_PAYMENT') {
      await reconcileOrder(context.value, reference); queued = true
    }
    if (manual && result.status === 'PENDING_PAYMENT') {
      await checkPayment()
      if (!disposed) status.value = await getOrderStatus(context.value)
    }
  } catch (e) {
    error.value = e.message
    if (!status.value && [404, 422].includes(e.status)) {
      context.value = null
      error.value = 'O link ou a chave de acesso não corresponde a um pedido. Confira o link completo ou fale com a organização.'
    }
  }
  finally {
    busy.value = false
    if (!disposed && context.value && !terminal.value && ++polls < 60) timer = setTimeout(() => refresh(), 30000)
  }
}
async function restore() {
  try {
    const candidate = { orderId: manualId.value.trim(), key: manualKey.value.trim() }
    createPrivateAccessLink(candidate)
    context.value = candidate; manualKey.value = ''; await refresh()
  }
  catch (e) { error.value = e.message }
}
async function pay() {
  busy.value = true; error.value = ''
  try { const result = await recoverCheckout(context.value); openCheckout(result.checkoutUrl) }
  catch (e) { error.value = e.message }
  finally { busy.value = false }
}
function handlePrivateLinkChange() {
  // Colar outro link na mesma aba muda apenas o hash; recarregar evita misturar
  // respostas em andamento e credenciais de dois pedidos diferentes.
  const params = new URLSearchParams(window.location.hash.slice(1))
  if (params.has('acesso') || params.has('pedido')) window.location.reload()
}
onMounted(() => {
  window.addEventListener('hashchange', handlePrivateLinkChange)
  const privateAccess = takePrivateAccessLink()
  const url = new URL(window.location.href)
  const id = privateAccess?.orderId || props.orderId || url.searchParams.get('orderId') || ''
  manualId.value = id
  if (privateAccess?.error) { error.value = privateAccess.error; return }
  context.value = privateAccess || loadOrderContext(id)
  const transaction = url.searchParams.get('transaction_nsu'), slug = url.searchParams.get('slug')
  if (transaction && slug) {
    reference = { transaction_nsu: transaction, invoice_slug: slug }
    if (url.searchParams.get('order_nsu')) reference.order_nsu = url.searchParams.get('order_nsu')
  }
  for (const key of ['transaction_nsu', 'slug', 'order_nsu', 'receipt_url', 'capture_method']) url.searchParams.delete(key)
  history.replaceState(null, '', url.pathname + url.search + url.hash)
  refresh()
})
onUnmounted(() => { disposed = true; clearTimeout(timer); window.removeEventListener('hashchange', handlePrivateLinkChange) })
</script>
<style scoped>
.payment-page { max-width: 960px; margin: 0 auto; padding: 18px 16px 24px; color: var(--text-dark); }
.summary-header { margin-bottom: 14px; }
.payment-eyebrow { display: inline-block; padding: 6px 10px; border-radius: 4px; background: var(--accent-dark); color: var(--accent-gold); font-size: .76rem; font-weight: 800; letter-spacing: .6px; }
h1 { font-size: clamp(1.35rem, 3.5vw, 1.75rem); line-height: 1.2; margin: 10px 0 0; }
.summary-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: start; }
.registration-details, .summary-sidebar { display: grid; gap: 12px; min-width: 0; }
.summary-card { padding: 16px; background: #fffdfa; border: 1px solid #dfd5c4; border-radius: 10px; box-shadow: 0 4px 20px rgba(25,23,20,.05); min-width: 0; }
.card-heading { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; margin-bottom: 10px; border-bottom: 1px solid #e9e0d2; }
h2 { font-size: 1rem; line-height: 1.4; }
.section-number { font-weight: 800; font-size: .75rem; color: #8b4c14; background: #f8ebd6; border: 1px solid #ebd4b1; border-radius: 5px; padding: 4px 6px; }
.athlete-name { font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; overflow-wrap: anywhere; }
.data-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px 16px; }
dt { font-size: .78rem; color: var(--text-muted); margin-bottom: 3px; }
.data-grid dt { text-transform: uppercase; letter-spacing: .3px; }
dd { font-size: .94rem; font-weight: 600; overflow-wrap: anywhere; }
.full-row { grid-column: 1 / -1; }
.medical-notes { white-space: pre-wrap; line-height: 1.6; font-weight: 400; }
.empty-details { color: var(--text-muted); line-height: 1.6; }
.payment-summary { padding: 0; overflow: hidden; }
.payment-ribbon { background: var(--accent-dark); color: var(--accent-gold); padding: 11px 16px; font-weight: 800; font-size: .84rem; letter-spacing: .5px; }
.payment-summary-body { padding: 12px 16px; }
.status-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.refresh-button { border: 0; background: none; color: var(--text-muted); font: inherit; font-size: .8rem; text-decoration: underline; cursor: pointer; min-height: 44px; padding: 4px; }
.status-badge { display: inline-block; border: 1px solid #edce9d; background: #fff0d8; color: #794409; border-radius: 5px; font-size: .8rem; font-weight: 800; padding: 6px 9px; }
.status-badge.confirmed { color: #2c4b23; border-color: #bbcfb0; background: #eef5e9; }
.status-message { margin: 4px 0 12px; line-height: 1.4; color: var(--text-muted); font-size: .88rem; }
.price-breakdown { border-top: 1px dashed #dfd5c4; padding-top: 8px; }
.price-breakdown > div { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 5px; }
.price-breakdown dt, .price-breakdown dd { font-size: .9rem; }
.payment-total { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-bottom: 6px; }
.payment-total > span, .order-date { font-size: .82rem; color: var(--text-muted); }
.payment-total strong { font-size: 1.65rem; line-height: 1.2; white-space: nowrap; }
.order-date { margin-bottom: 10px; }
.payment-actions { display: grid; gap: 8px; }
.btn-vintage { width: 100%; font-size: .9rem; padding: 12px 10px; min-height: 46px; }
.quiet-button { border: 1px solid #d9ccb8; border-radius: 5px; background: #fffdfa; color: var(--text-dark); padding: 12px; font: inherit; cursor: pointer; }
.quiet-button:hover { background: #f8f1e5; }
button:disabled { opacity: .6; cursor: wait; }
.order-number { margin: 10px 0; padding-top: 8px; border-top: 1px dashed #dfd5c4; color: var(--text-muted); font-size: .72rem; overflow-wrap: anywhere; }
.order-number span { display: block; font-weight: 700; margin-bottom: 2px; font-size: .78rem; }
.private-access-card { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e9e0d2; }
.private-access-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.private-access-card p { margin: 0; line-height: 1.4; font-size: .82rem; color: var(--text-muted); }
.private-access-card strong { color: var(--text-dark); }
.private-access-card p[role=status], .private-access-card label { display: block; margin-top: 8px; }
.private-access-card button { flex-shrink: 0; padding: 8px 10px; min-height: 44px; font-size: .85rem; }
.private-access-card input { display: block; width: 100%; min-width: 0; padding: 10px; margin-top: 8px; font: inherit; }
.contact-button { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; min-height: 44px; border: 1px solid #384b28; border-radius: 5px; background: #f0f4e9; color: #2d4420; font-weight: 700; font-size: .88rem; text-decoration: none; text-align: center; line-height: 1.4; }
.contact-button:hover { background: #e3ebd8; }
.summary-footer { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 12px; }
.text-button { border: 0; background: none; color: var(--text-muted); font: inherit; font-size: .9rem; text-decoration: underline; cursor: pointer; padding: 8px 0; }
.payment-error { margin-bottom: 20px; padding: 14px 16px; background: #fdf3f2; border: 1px solid #d79990; color: #78281f; border-radius: 6px; line-height: 1.5; }
.restore-form { max-width: 560px; }
.restore-form > p { margin-top: 12px; line-height: 1.6; }
.phone-status-link { display: inline-block; margin-top: 8px; }
.restore-form label { display: block; margin: 18px 0; }
.restore-form input { display: block; width: 100%; margin-top: 7px; padding: 12px; border: 1px solid #d9ccb8; border-radius: 5px; font: inherit; }
.restore-contact { max-width: 560px; margin-top: 18px; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: 3px; }
@media(max-width: 720px) {
  .payment-page { padding: 12px 12px 20px; }
  .summary-layout { grid-template-columns: minmax(0,1fr); gap: 12px; }
  .summary-sidebar { grid-row: 1; }
  .summary-header { margin-bottom: 12px; }
  .data-grid { gap: 10px 12px; }
}
</style>
