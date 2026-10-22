<template>
  <div class="kids-registration">
    <template v-if="selectedOrder">
      <PaymentStatusPage :key="selectedOrder" :order-id="selectedOrder" @go-home="$emit('go-home')" />
      <div class="kids-return flow-return"><button class="btn-vintage" @click="anotherChild">Inscrever outra criança</button><button class="text-action flow-text-button" @click="selectedOrder = ''; loadSaved()">Ver minhas inscrições Kids</button></div>
    </template>
    <template v-else>
      <section v-if="!consultationOnly" class="flow-card kids-form-card">
        <p v-if="loading" role="status">Carregando informações da inscrição…</p>
        <p v-if="error" class="kids-error flow-error" role="alert">{{ error }}</p>
        <button v-if="!loading && !offer" class="flow-text-button" @click="loadOffer">Tentar novamente</button>
        <p v-if="offer && !offer.enabled" class="flow-notice">As inscrições Kids ainda não estão abertas. Acompanhe a abertura por aqui.</p>
        <template v-if="offer?.enabled">
          <form ref="formElement" class="kids-form flow-form" @submit.prevent="next">
            <fieldset :disabled="busy">
              <div class="flow-step-header">
                <h2 class="section-title font-slab" tabindex="-1" ref="stepHeading"><span class="flow-step-number font-condensed">{{ step }}</span>{{ steps[step - 1] }}</h2>
                <p class="flow-subtitle">Etapa {{ step }} de 4 · Inscrição Kids</p>
              </div>
              <template v-if="step === 1">
                <section class="flow-offer" aria-label="Kit e regras da corrida Kids">
                  <p><strong>De {{ offer.minAge }} a {{ offer.maxAge }} anos · {{ offer.capacity }} vagas no total</strong><br />Idade considerada em {{ eventDateLabel }}, na data do evento.</p>
                  <p class="flow-note"><strong>No kit da criança:</strong> 1 espetinho, bebida sem álcool, copo infantil, medalha e participação nos sorteios.</p>
                  <dl class="flow-prices">
                    <div><dt>SEM CAMISETA</dt><dd class="font-slab">{{ money(offer.amount) }}</dd></div>
                    <div><dt>COM CAMISETA</dt><dd class="font-slab">{{ money(offer.amount + offer.shirtAmount) }}</dd></div>
                  </dl>
                </section>
                <label class="flow-field" for="kids-name"><span>Nome completo da criança *</span><input class="vintage-input" id="kids-name" v-model.trim="form.name" required minlength="3" maxlength="120" autocomplete="off" placeholder="Nome e sobrenome" /></label>
                <label class="flow-field" for="kids-birth"><span>Data de nascimento *</span><BirthDateInput class="vintage-input" id="kids-birth" v-model="form.birthDate" :max="today" required /></label>
                <p v-if="age !== null" class="flow-note">{{ age }} {{ age === 1 ? 'ano' : 'anos' }} na data do evento.</p>
                <p class="flow-note">Na próxima etapa, você informa os dados do responsável.</p>
              </template>
              <template v-else-if="step === 2">
                <p class="flow-note">O contato e o pagamento ficam em nome do responsável pela criança.</p>
                <label class="flow-field" for="kids-guardian"><span>Nome completo do responsável *</span><input class="vintage-input" id="kids-guardian" v-model.trim="form.guardianName" required minlength="3" maxlength="120" autocomplete="name" /></label>
                <div class="flow-fields">
                  <label class="flow-field" for="kids-cpf"><span>CPF do responsável *</span><input class="vintage-input" id="kids-cpf" :value="maskedValue('guardianCpf', form.guardianCpf)" @input="maskField('guardianCpf', $event)" required inputmode="numeric" maxlength="14" placeholder="000.000.000-00" /></label>
                  <label class="flow-field" for="kids-relationship"><span>Vínculo com a criança *</span><input class="vintage-input" id="kids-relationship" v-model.trim="form.guardianRelationship" placeholder="Ex.: mãe, pai, tutor" required minlength="2" maxlength="80" /></label>
                  <label class="flow-field" for="kids-phone"><span>WhatsApp com DDD *</span><input class="vintage-input" id="kids-phone" :value="maskedValue('phone', form.phone)" @input="maskField('phone', $event)" type="tel" required maxlength="25" autocomplete="tel" placeholder="(35) 99999-9999" /></label>
                  <label class="flow-field" for="kids-email"><span>E-mail do responsável *</span><input class="vintage-input" id="kids-email" v-model.trim="form.email" type="email" required maxlength="254" autocomplete="email" /></label>
                </div>
              </template>
              <template v-else-if="step === 3">
                <div class="flow-field">
                  <span id="kids-skewer-label">CHURRASCO DE CHEGADA: 1 ESPETINHO 🍢 *</span>
                  <div id="kids-skewer" class="skewer-box" role="group" aria-labelledby="kids-skewer-label" tabindex="-1">
                    <div class="skewer-rows-list">
                      <div v-for="option in skewerOptions" :key="option.value" class="skewer-row-item" :class="{ 'is-disabled': form.skewerChoice === 'Vegetariano' }">
                        <div class="skewer-item-label"><span class="skewer-icon" aria-hidden="true">{{ option.icon }}</span><div class="skewer-item-names"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></div></div>
                        <div class="stepper-actions">
                          <button type="button" class="btn-stepper font-slab" :disabled="form.skewerChoice !== option.value" :aria-label="`Diminuir ${option.label.toLowerCase()}`" @click="form.skewerChoice = ''"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
                          <span class="stepper-count font-slab" :aria-label="`${option.label}: ${form.skewerChoice === option.value ? 1 : 0}`">{{ form.skewerChoice === option.value ? 1 : 0 }}</span>
                          <button type="button" class="btn-stepper font-slab" :disabled="form.skewerChoice === option.value || form.skewerChoice === 'Vegetariano'" :aria-label="`Aumentar ${option.label.toLowerCase()}`" @click="form.skewerChoice = option.value"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
                        </div>
                      </div>
                      <label class="skewer-row-item skewer-row-veg" :class="{ active: form.skewerChoice === 'Vegetariano' }">
                        <input class="skewer-veg-input" type="checkbox" :checked="form.skewerChoice === 'Vegetariano'" @change="form.skewerChoice = $event.target.checked ? 'Vegetariano' : ''" />
                        <div class="skewer-item-label"><span class="skewer-icon" aria-hidden="true">🌱</span><div class="skewer-item-names"><strong>Vegetariano</strong><small>Não consumo carne / refeição sem carne</small></div></div>
                        <div class="veg-toggle-action" aria-hidden="true"><span class="veg-switch" :class="{ checked: form.skewerChoice === 'Vegetariano' }"><i v-if="form.skewerChoice === 'Vegetariano'" class="fa-solid fa-check"></i></span></div>
                      </label>
                    </div>
                    <div class="skewer-summary-bar font-condensed" aria-live="polite"><span :class="form.skewerChoice === 'Vegetariano' ? 'text-veg' : 'text-standard'">{{ form.skewerChoice ? `Seleção: ${form.skewerChoice === 'Vegetariano' ? '1 Vegetariano' : form.skewerChoice} (1 espetinho incluso)` : 'Escolha carne, frango ou vegetariano (1 espetinho incluso).' }}</span></div>
                  </div>
                </div>
                <h3>CAMISETA INFANTIL OPCIONAL</h3>
                <div class="flow-choice-row" role="group" aria-label="Camiseta opcional">
                  <label class="flow-choice" :class="{ selected: form.shirtIncluded === false }"><input type="radio" name="kids-shirt" :value="false" v-model="form.shirtIncluded" required /><span><strong>SEM CAMISETA</strong><span>{{ money(offer.amount) }}</span></span></label>
                  <label class="flow-choice" :class="{ selected: form.shirtIncluded === true }"><input type="radio" name="kids-shirt" :value="true" v-model="form.shirtIncluded" required /><span><strong>COM CAMISETA</strong><span>{{ money(offer.amount + offer.shirtAmount) }}</span><small>Adicional de {{ money(offer.shirtAmount) }}</small></span></label>
                </div>
                <label v-if="form.shirtIncluded" class="flow-field" for="kids-shirt-size"><span>Tamanho da camiseta infantil *</span><select class="vintage-input" id="kids-shirt-size" v-model="form.shirtSize" required><option disabled value="">Escolha o tamanho</option><option v-for="size in offer.shirtSizes" :key="size" :value="size">{{ size }}</option></select></label>
                <h3>CONTATO PARA EMERGÊNCIA</h3>
                <label class="flow-check"><input type="checkbox" v-model="sameEmergency" />Usar os dados do responsável</label>
                <div v-if="!sameEmergency" class="flow-fields">
                  <label class="flow-field" for="kids-emergency-name"><span>Nome do contato *</span><input class="vintage-input" id="kids-emergency-name" v-model.trim="form.emergencyContactName" required minlength="3" maxlength="120" /></label>
                  <label class="flow-field" for="kids-emergency-phone"><span>Telefone com DDD *</span><input class="vintage-input" id="kids-emergency-phone" :value="maskedValue('emergencyContactPhone', form.emergencyContactPhone)" @input="maskField('emergencyContactPhone', $event)" type="tel" required maxlength="25" placeholder="(35) 99999-9999" /></label>
                </div>
                <label class="flow-field" for="kids-notes"><span>Informação importante para o atendimento (opcional)</span><textarea class="vintage-input" id="kids-notes" v-model.trim="form.medicalNotes" maxlength="2000" rows="2" placeholder="Informe apenas o que a equipe precisa saber para atender a criança." /></label>
              </template>
              <template v-else>
                <dl class="flow-summary">
                  <div><dt>Criança</dt><dd>{{ form.name }} · {{ age }} {{ age === 1 ? 'ano' : 'anos' }}</dd></div>
                  <div><dt>Responsável</dt><dd>{{ form.guardianName }}</dd></div>
                  <div><dt>Contato</dt><dd>{{ form.phone }}<br />{{ form.email }}</dd></div>
                  <div><dt>Alimentação</dt><dd>{{ form.skewerChoice === 'Vegetariano' ? '1 Vegetariano' : form.skewerChoice }} + bebida sem álcool</dd></div>
                  <div><dt>Incluído</dt><dd>Copo infantil, medalha e participação nos sorteios</dd></div>
                  <div><dt>Inscrição</dt><dd>{{ money(offer.amount) }}</dd></div>
                  <div><dt>Camiseta</dt><dd>{{ form.shirtIncluded ? 'Infantil · ' + form.shirtSize + ' · + ' + money(offer.shirtAmount) : 'Sem camiseta' }}</dd></div>
                </dl>
                <label class="flow-check"><input id="kids-terms" v-model="form.acceptedTerms" type="checkbox" required /><span>Declaro que sou responsável legal pela criança, que os dados informados estão corretos e autorizo sua participação na corrida Kids. Estou ciente de que o kit é destinado à criança e de que a inscrição será confirmada após o pagamento.</span></label>
                <p class="flow-note">Guarde o link privado do pedido para consultar esta inscrição. Cada criança terá seu próprio pedido.</p>
              </template>
            </fieldset>
            <footer class="kids-actions flow-bottom-bar" :class="{ 'is-first-step': step === 1 }">
              <div class="flow-running-total" aria-live="polite"><span>TOTAL DO KIT KIDS</span><strong class="font-slab">{{ money(total) }}</strong></div>
              <button v-if="step > 1" type="button" class="text-action btn-vintage flow-previous font-slab" :disabled="busy" @click="go(step - 1)">VOLTAR</button>
              <button class="btn-vintage next-button font-slab" :disabled="busy">{{ busy ? 'SALVANDO PEDIDO…' : step === 4 ? 'CONFIRMAR E PAGAR' : 'CONTINUAR →' }}</button>
            </footer>
          </form>
        </template>
      </section>
      <details class="kids-saved flow-card flow-saved" :open="consultationOnly || saved.length > 0">
        <summary>JÁ INSCREVEU UMA CRIANÇA? CONSULTE AQUI</summary>
        <p>Consulte os pedidos salvos neste navegador ou abra o link privado que você guardou.</p>
        <p v-if="savedError" role="status">{{ savedError }}</p>
        <ul v-if="saved.length"><li v-for="order in saved" :key="order.orderId"><button class="flow-text-button" @click="selectedOrder = order.orderId">{{ order.registration.name }} — {{ order.status === 'PAID' ? 'Pagamento confirmado' : 'Consultar pedido' }}</button></li></ul>
        <a href="/pagamento-concluido">Acessar com o número do pedido e a chave</a>
        <p v-if="consultationOnly"><a href="#inscricao?categoria=kids">Fazer uma inscrição Kids →</a></p>
      </details>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onMounted, reactive, ref, watch } from 'vue'
import BirthDateInput from './BirthDateInput.vue'
import PaymentStatusPage from './PaymentStatusPage.vue'
import { publicRequest } from '../services/public-api.js'
import { submitRegistration, openCheckout, listOrderContexts, getOrderStatus, loadPendingKidsRegistration } from '../services/checkout.js'
defineProps({ consultationOnly: { type: Boolean, default: false } })
const emit = defineEmits(['go-home', 'navigation-lock'])
const steps = ['DADOS DA CRIANÇA', 'DADOS DO RESPONSÁVEL', 'KIT E PARTICIPAÇÃO', 'RESUMO E AUTORIZAÇÃO']
const step = ref(1), busy = ref(false), loading = ref(true), error = ref(''), offer = ref(null)
const selectedOrder = ref(''), saved = ref([]), savedError = ref(''), formElement = ref(null), stepHeading = ref(null)
const sameEmergency = ref(true)
const skewerOptions = [
  { value: '1 Carne', label: 'Carne', icon: '🥩', description: 'Espetinho bovino' },
  { value: '1 Frango', label: 'Frango', icon: '🍗', description: 'Espetinho temperado' },
]
watch(busy, value => emit('navigation-lock', value))
onActivated(() => emit('navigation-lock', busy.value))
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const empty = () => ({ name: '', birthDate: '', guardianName: '', guardianCpf: '', guardianRelationship: '', phone: '', email: '', skewerChoice: '', shirtIncluded: null, shirtSize: '', emergencyContactName: '', emergencyContactPhone: '', medicalNotes: '', acceptedTerms: false })
const form = reactive(empty())
watch(() => form.skewerChoice, () => {
  if (error.value.startsWith('Escolha o espetinho da criança:')) error.value = ''
})
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
const total = computed(() => (offer.value?.amount || 4000) + (form.shirtIncluded ? offer.value?.shirtAmount || 2600 : 0))
const age = computed(() => !form.birthDate || !offer.value ? null : Number(offer.value.eventDate.slice(0, 4)) - Number(form.birthDate.slice(0, 4)) - Number(offer.value.eventDate.slice(5) < form.birthDate.slice(5)))
const eventDateLabel = computed(() => offer.value?.eventDate.split('-').reverse().join('/'))
const phoneDigits = value => value.replace(/\D/g, '').replace(/^55(?=\d{11}$)/, '')
function maskedValue(key, value) {
  if (key === 'guardianCpf') return value.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\.\d{3})(\d)/, '$1-$2')
  const digits = phoneDigits(value).slice(0, 11)
  return digits.length > 7 ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : digits.length > 2 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : digits
}
function maskField(key, event) {
  const value = maskedValue(key, event.target.value)
  form[key] = value
  event.target.value = value
}
const validPhone = value => /^[1-9]\d9\d{8}$/.test(phoneDigits(value))
function validCpf(value) {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  return [9, 10].every(size => { let sum = 0; for (let i = 0; i < size; i++) sum += Number(digits[i]) * (size + 1 - i); return Number(digits[size]) === ((sum * 10) % 11) % 10 })
}
async function go(target) { step.value = target; error.value = ''; await nextTick(); stepHeading.value?.focus(); formElement.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
async function next() {
  if (busy.value || !formElement.value.reportValidity()) return
  error.value = ''
  if (step.value === 1 && (!form.birthDate || form.birthDate > today || age.value < offer.value.minAge || age.value > 13)) { error.value = `Informe uma data válida. A criança deve ter ${offer.value.minAge ? `entre ${offer.value.minAge} e 13` : 'até 13'} anos na data do evento.`; return }
  if (step.value === 2 && (!validCpf(form.guardianCpf) || !validPhone(form.phone))) { error.value = 'Confira o CPF e o WhatsApp com DDD do responsável.'; return }
  if (step.value === 3 && !['1 Carne', '1 Frango', 'Vegetariano'].includes(form.skewerChoice)) { error.value = 'Escolha o espetinho da criança: carne, frango ou vegetariano.'; document.getElementById('kids-skewer')?.focus(); return }
  if (step.value === 3 && ((!sameEmergency.value && !validPhone(form.emergencyContactPhone)) || form.shirtIncluded === null || (form.shirtIncluded && !offer.value.shirtSizes.includes(form.shirtSize)))) { error.value = 'Confira o contato de emergência e a escolha da camiseta.'; return }
  if (step.value < 4) { await go(step.value + 1); return }
  busy.value = true
  try {
    const { shirtSize, ...body } = form
    const result = await submitRegistration({ ...body, ...(form.shirtIncluded ? { shirtSize } : {}), emergencyContactName: sameEmergency.value ? form.guardianName : form.emergencyContactName, emergencyContactPhone: sameEmergency.value ? form.phone : form.emergencyContactPhone }, 'KIDS')
    try { sessionStorage.setItem('beer_run_kids_guardian', JSON.stringify({ guardianName: form.guardianName, guardianCpf: form.guardianCpf, guardianRelationship: form.guardianRelationship, phone: form.phone, email: form.email })) } catch {}
    selectedOrder.value = result.orderId
    if (result.checkoutUrl) openCheckout(result.checkoutUrl)
  } catch (e) { error.value = e.code === 'REGISTRATION_CONFLICT' ? 'Já existe uma inscrição para esta criança e responsável. Consulte o pedido salvo ou fale com a organização.' : e.message }
  finally { busy.value = false }
}
function restoreGuardian() {
  try { const data = JSON.parse(sessionStorage.getItem('beer_run_kids_guardian') || '{}'); for (const key of ['guardianName', 'guardianCpf', 'guardianRelationship', 'phone', 'email']) if (typeof data[key] === 'string') form[key] = data[key] } catch {}
}
function anotherChild() { window.location.hash = '#inscricao?categoria=kids'; Object.assign(form, empty()); restoreGuardian(); sameEmergency.value = true; selectedOrder.value = ''; go(1); loadSaved() }
async function loadOffer() {
  loading.value = true; error.value = ''
  try { offer.value = await publicRequest('registrations/kids/offer') } catch { error.value = 'Não foi possível carregar as inscrições Kids. Tente novamente.' }
  finally { loading.value = false }
}
async function loadSaved() {
  const results = await Promise.allSettled(listOrderContexts().map(context => getOrderStatus(context)))
  saved.value = results.filter(result => result.status === 'fulfilled' && result.value.registration?.modality === 'kids').map(result => result.value)
  savedError.value = results.some(result => result.status === 'rejected') ? 'Alguns pedidos não puderam ser consultados agora. Você pode abri-los pelo link privado.' : ''
}
onMounted(() => {
  restoreGuardian()
  const pending = loadPendingKidsRegistration()
  if (pending) {
    for (const key of Object.keys(form)) if (key in pending) form[key] = pending[key]
    sameEmergency.value = false
    step.value = 4
  }
  loadOffer(); loadSaved()
})
</script>

<style scoped src="../styles/skewer-selector.css"></style>
<style scoped>
.skewer-veg-input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.skewer-row-veg:focus-within, .btn-stepper:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: 3px; }
.skewer-box .btn-stepper:disabled { opacity: .25; cursor: not-allowed; }
.skewer-item-label { min-width: 0; }
.stepper-actions, .veg-toggle-action { flex-shrink: 0; }
@media (max-width: 380px) { .skewer-row-item { padding: 8px 6px; gap: 6px; } .skewer-item-label { gap: 6px; } }
</style>
