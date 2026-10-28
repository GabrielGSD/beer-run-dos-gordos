<template>
  <div class="registration-flow staff-registration font-condensed">
    <header class="flow-top-bar">
      <div class="container flow-top-content">
        <a class="flow-back-home" href="/"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>VOLTAR AO SITE</span></a>
        <div class="flow-brand"><i class="fa-solid fa-beer-mug-empty" aria-hidden="true"></i><span>BEER RUN DOS GORDOS • 1ª EDIÇÃO 2026</span></div>
      </div>
    </header>
    <main class="flow-content">
      <div class="flow-category-bar"><span><i class="fa-solid fa-people-group" aria-hidden="true"></i> CADASTRO <strong>STAFF</strong></span><span>Equipe do evento</span></div>
      <p v-if="error" class="flow-error error" role="alert">{{ error }}</p>

      <section v-if="result" class="flow-card success" aria-live="polite">
        <div class="flow-step-header"><h1 class="section-title font-slab">{{ result.amount === 0 ? 'CADASTRO CONCLUÍDO' : 'CADASTRO RECEBIDO' }}</h1><p class="flow-subtitle">Equipe staff · Beer Run dos Gordos</p></div>
        <p v-if="result.amount === 0">Você escolheu participar sem itens do kit. Nenhum pagamento é necessário.</p>
        <template v-else>
          <dl class="flow-summary"><div><dt>Total dos itens</dt><dd>{{ money(result.amount) }}</dd></div></dl>
          <p class="flow-note">A confirmação do pagamento aparece no acompanhamento do pedido.</p>
          <div v-if="result.checkoutUrl" class="flow-return actions"><button class="btn-vintage font-slab" @click="pay">Abrir pagamento</button><button class="flow-text-button" @click="copyLink">Copiar link de pagamento</button></div>
          <p v-else class="flow-notice">{{ result.message || 'Consulte a situação do seu pedido para continuar.' }}</p>
          <label v-if="showLink" class="flow-field"><span>Link de pagamento</span><input class="vintage-input" :value="result.checkoutUrl" readonly @focus="$event.target.select()" /></label>
          <p v-if="copyMessage" class="flow-note" role="status">{{ copyMessage }}</p>
          <a class="flow-text-button" :href="'/pagamento-concluido?orderId=' + result.orderId">Acompanhar pedido e pagamento →</a>
        </template>
        <p class="flow-note protocol">Protocolo: {{ result.registrationId }}</p>
      </section>
      <section v-else-if="loading" class="flow-card"><p role="status">Carregando opções da equipe…</p></section>
      <section v-else-if="!offer?.enabled" class="flow-card">
        <p class="flow-notice">{{ offer ? 'O cadastro da equipe ainda não está disponível. Aguarde a liberação da organização.' : 'Não foi possível carregar as opções do kit. Tente novamente.' }}</p>
        <button class="flow-text-button" @click="loadOffer">Tentar novamente</button>
      </section>

      <section v-else class="flow-card">
        <form ref="formElement" class="flow-form" novalidate @submit.prevent="next">
          <fieldset :disabled="busy" class="team-fields">
            <div class="flow-step-header">
              <h1 ref="stepHeading" class="section-title font-slab" tabindex="-1"><span class="flow-step-number">{{ step }}</span>{{ steps[step - 1] }}</h1>
              <p class="flow-subtitle">Etapa {{ step }} de 3 · {{ subtitles[step - 1] }}</p>
            </div>

            <template v-if="step === 1">
              <section class="flow-offer" aria-label="Kit opcional da equipe">
                <p><strong>Você escolhe o que quer levar.</strong><br />Camiseta, medalha, copo, espetinhos e bebida são opcionais. Para participar sem kit, basta continuar sem selecionar itens.</p>
                <AthleteKitPreview />
              </section>
              <h2 class="kit-label font-slab">ITENS DO KIT · OPCIONAIS</h2>
              <div class="flow-choice-row kit-choices">
                <label v-for="id in ['shirt', 'medal', 'cup']" :key="id" class="flow-choice" :class="{ selected: form[id], unavailable: !price(id) }">
                  <input :id="'team-' + id" v-model="form[id]" type="checkbox" :disabled="!price(id)" />
                  <span><strong>{{ item(id)?.label || labels[id] }}</strong><span>{{ priceLabel(id) }}</span><small>Opcional</small></span>
                </label>
              </div>
              <template v-if="form.shirt">
                <div class="flow-fields">
                  <label class="flow-field"><span>Modelo da camiseta *</span><select id="team-shirt-model" class="vintage-input" v-model="form.shirtModel" required @change="form.shirtSize = ''"><option value="" disabled>Escolha o modelo</option><option v-for="model in SHIRT_MODELS" :key="model.value" :value="model.value">{{ model.label }}</option></select></label>
                  <label class="flow-field"><span>Tamanho da camiseta *</span><select id="team-shirt-size" class="vintage-input" v-model="form.shirtSize" required><option value="" disabled>Escolha o tamanho</option><option v-for="size in shirtSizes" :key="size" :value="size">{{ size }}</option></select></label>
                </div>
                <ShirtSizeGuide v-if="form.shirtModel" class="staff-shirt-guide" :model="form.shirtModel" :size="form.shirtSize" />
              </template>

              <h2 class="kit-label font-slab">ESPETINHOS · OPCIONAIS</h2>
              <div class="flow-fields">
                <label class="flow-field"><span>Quantidade · {{ priceLabel('skewer') }} por unidade</span><select id="team-skewer-quantity" class="vintage-input" v-model.number="form.skewerQuantity" :disabled="!price('skewer')"><option v-for="n in 11" :key="n" :value="n - 1">{{ n === 1 ? 'Sem espetinho' : `${n - 1} ${n === 2 ? 'espetinho' : 'espetinhos'}` }}</option></select></label>
                <label v-if="form.skewerQuantity" class="flow-field"><span>Sabor dos espetinhos *</span><select id="team-skewer-choice" class="vintage-input" v-model="form.skewerChoice" required><option disabled value="">Escolha o sabor</option><option>Carne</option><option>Frango</option><option>Vegetariano</option></select></label>
              </div>

              <fieldset class="staff-drinks">
                <legend class="kit-label font-slab">BEBIDA · OPCIONAL</legend>
                <div class="flow-choice-row kit-choices">
                  <label class="flow-choice" :class="{ selected: form.drink === 'NONE' }"><input v-model="form.drink" type="radio" name="team-drink" value="NONE" /><span><strong>Sem bebida</strong><span>R$ 0,00</span></span></label>
                  <label v-for="choice in drinks" :key="choice.id" class="flow-choice" :class="{ selected: form.drink === choice.value, unavailable: !price(choice.id) }"><input :id="'team-' + choice.id" v-model="form.drink" type="radio" name="team-drink" :value="choice.value" :disabled="!price(choice.id)" /><span><strong>{{ item(choice.id)?.label || choice.label }}</strong><span>{{ priceLabel(choice.id) }}</span></span></label>
                </div>
              </fieldset>
              <p v-if="form.drink === 'BEER'" class="flow-note">Chopp disponível somente para maiores de 18 anos.</p>
            </template>

            <template v-else-if="step === 2">
              <p class="flow-note">Informe os dados de quem vai participar da equipe staff.</p>
              <label class="flow-field"><span>Nome completo *</span><input id="team-name" class="vintage-input" v-model="form.name" required minlength="3" maxlength="120" autocomplete="name" placeholder="Nome e sobrenome" /></label>
              <div class="flow-fields">
                <label class="flow-field"><span>CPF *</span><input id="team-cpf" class="vintage-input" v-model="form.cpf" required maxlength="20" inputmode="numeric" placeholder="000.000.000-00" /></label>
                <label class="flow-field"><span>Data de nascimento *</span><BirthDateInput id="team-birth" class="vintage-input" v-model="form.birthDate" :max="today" required /></label>
                <label class="flow-field"><span>WhatsApp com DDD *</span><input id="team-phone" class="vintage-input" v-model="form.phone" type="tel" required maxlength="25" autocomplete="tel" placeholder="(35) 99999-9999" /></label>
                <label class="flow-field"><span>E-mail *</span><input id="team-email" class="vintage-input" v-model="form.email" type="email" required maxlength="254" autocomplete="email" placeholder="seuemail@exemplo.com" /></label>
              </div>
            </template>

            <template v-else>
              <div class="review-heading"><h2 class="kit-label font-slab">SEUS DADOS</h2><button type="button" class="flow-text-button" @click="go(2)">Editar dados</button></div>
              <dl class="flow-summary">
                <div><dt>Nome</dt><dd>{{ form.name }}</dd></div><div><dt>CPF</dt><dd>{{ form.cpf }}</dd></div><div><dt>Nascimento</dt><dd>{{ form.birthDate.split('-').reverse().join('/') }}</dd></div><div><dt>WhatsApp</dt><dd>{{ form.phone }}</dd></div><div><dt>E-mail</dt><dd>{{ form.email }}</dd></div>
              </dl>
              <div class="review-heading"><h2 class="kit-label font-slab">SEU KIT</h2><button type="button" class="flow-text-button" @click="go(1)">Editar kit</button></div>
              <dl v-if="selectedItems.length" class="flow-summary">
                <div v-for="line in selectedItems" :key="line.id"><dt>{{ line.quantity }} × {{ line.label }}</dt><dd>{{ money(line.quantity * line.unitAmount) }}<small v-if="line.id === 'shirt'">{{ formatShirtSelection(form.shirtModel, form.shirtSize, 'staff') }}</small><small v-if="line.id === 'skewer'">{{ form.skewerChoice }}</small></dd></div>
              </dl>
              <p v-else class="flow-notice">Sem itens do kit. Seu cadastro será gratuito.</p>
              <label v-if="offer.requiresCode" class="flow-field"><span>Código de convite *</span><input class="vintage-input" v-model="invitationCode" required type="password" autocomplete="off" /></label>
              <label class="flow-check"><input id="team-terms" v-model="form.acceptedTerms" type="checkbox" required /><span>Confirmo meus dados e minha participação na equipe staff. Estou ciente de que os itens escolhidos serão confirmados após o pagamento.</span></label>
              <p class="flow-note">{{ total ? 'Ao confirmar, você receberá o link de pagamento pela InfinitePay.' : 'Sem cobrança e sem necessidade de cartão.' }}</p>
            </template>
          </fieldset>

          <footer class="flow-bottom-bar" :class="{ 'is-first-step': step === 1 }">
            <div class="flow-running-total total" aria-live="polite"><span>TOTAL DO KIT STAFF</span><strong class="font-slab">{{ money(total) }}</strong></div>
            <button v-if="step > 1" id="team-previous" type="button" class="btn-vintage flow-previous font-slab" :disabled="busy || navigating" @click="go(step - 1)">VOLTAR</button>
            <button :id="step === 3 ? 'team-submit' : 'team-next'" class="btn-vintage next-button font-slab" :disabled="busy || navigating">{{ busy ? 'SALVANDO…' : step < 3 ? 'CONTINUAR →' : total ? 'GERAR LINK DE PAGAMENTO' : 'CONCLUIR CADASTRO SEM KIT' }}</button>
          </footer>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { SHIRT_MODELS, formatShirtSelection } from '../services/shirts.js'
import ShirtSizeGuide from './ShirtSizeGuide.vue'
import AthleteKitPreview from './AthleteKitPreview.vue'
import BirthDateInput from './BirthDateInput.vue'
import { getStaffOffer, loadStaffRegistration, submitStaffRegistration } from '../services/staff-registration.js'
import { openCheckout } from '../services/checkout.js'

const saved = loadStaffRegistration()
const form = reactive({ name: '', cpf: '', birthDate: '', phone: '', email: '', shirt: false, medal: false, cup: false, shirtModel: '', shirtSize: '', skewerQuantity: 0, skewerChoice: '', drink: 'NONE', acceptedTerms: false, ...saved.pending?.registration })
const offer = ref(null), loading = ref(true), busy = ref(false), error = ref(''), result = ref(saved.result), invitationCode = ref('')
const copyMessage = ref(''), showLink = ref(false)
const step = ref(saved.pending ? 3 : 1), navigating = ref(false), formElement = ref(null), stepHeading = ref(null)
const steps = ['ESCOLHA SEU KIT', 'DADOS PESSOAIS', 'REVISÃO E CONFIRMAÇÃO']
const subtitles = ['Personalize seu kit. Todos os itens são opcionais.', 'Preencha seus dados para o cadastro da equipe.', 'Confira seus dados, kit e valor total antes de confirmar.']
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const labels = { shirt: 'Camiseta', medal: 'Medalha', cup: 'Copo' }
const drinks = [{ id: 'beer', value: 'BEER', label: 'Bebida com chopp' }, { id: 'softDrink', value: 'SOFT_DRINK', label: 'Bebida sem chopp' }]
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
const item = id => offer.value?.items.find(item => item.id === id)
const price = id => item(id)?.unit_amount || 0
const priceLabel = id => price(id) ? money(price(id)) : 'Indisponível'
const shirtSizes = computed(() => SHIRT_MODELS.find(model => model.value === form.shirtModel)?.sizes.map(size => size[0]) || [])
const selectedItems = computed(() => (offer.value?.items || []).map(item => ({ id: item.id, label: item.label, unitAmount: item.unit_amount, quantity: ['shirt', 'medal', 'cup'].includes(item.id) ? Number(form[item.id]) : item.id === 'skewer' ? form.skewerQuantity : Number(form.drink === (item.id === 'beer' ? 'BEER' : 'SOFT_DRINK')) })).filter(item => item.quantity > 0))
const total = computed(() => selectedItems.value.reduce((sum, line) => sum + line.quantity * line.unitAmount, 0))

async function loadOffer() { loading.value = true; error.value = ''; try { offer.value = await getStaffOffer() } catch (e) { error.value = e.message } finally { loading.value = false } }
async function go(target) {
  if (busy.value || navigating.value) return
  navigating.value = true
  step.value = target
  error.value = ''
  await nextTick()
  stepHeading.value?.focus({ preventScroll: true })
  window.scrollTo({ top: 0, behavior: 'smooth' })
  navigating.value = false
}
function validCpf(value) {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  return [9, 10].every(size => { let sum = 0; for (let i = 0; i < size; i++) sum += Number(digits[i]) * (size + 1 - i); return Number(digits[size]) === ((sum * 10) % 11) % 10 })
}
async function next() {
  if (busy.value || navigating.value || !formElement.value.reportValidity()) return
  error.value = ''
  if (step.value === 1 && !loadStaffRegistration().pending && selectedItems.value.some(item => !item.unitAmount)) {
    error.value = 'Um item selecionado ficou indisponível. Confira suas escolhas.'
    return
  }
  if (step.value === 2) {
    const age = Number(today.slice(0, 4)) - Number(form.birthDate.slice(0, 4)) - Number(today.slice(5) < form.birthDate.slice(5))
    if (!form.birthDate || form.birthDate > today) { error.value = 'Informe uma data de nascimento válida.'; document.getElementById('team-birth')?.focus(); return }
    if (!validCpf(form.cpf)) { error.value = 'Confira o CPF informado.'; document.getElementById('team-cpf')?.focus(); return }
    if (!/^[1-9]\d9\d{8}$/.test(form.phone.replace(/\D/g, '').replace(/^55(?=\d{11}$)/, ''))) { error.value = 'Confira o WhatsApp com DDD.'; document.getElementById('team-phone')?.focus(); return }
    if (form.drink === 'BEER' && age < 18) { error.value = 'Chopp disponível somente para maiores de 18 anos. Volte ao kit e escolha outra bebida.'; return }
  }
  if (step.value < 3) { await go(step.value + 1); return }
  await submit()
}
async function submit() {
  if (busy.value) return
  error.value = ''
  if (!loadStaffRegistration().pending && selectedItems.value.some(item => !item.unitAmount)) { error.value = 'Um item selecionado ficou indisponível. Confira suas escolhas.'; return }
  const registration = { name: form.name, cpf: form.cpf, birthDate: form.birthDate, phone: form.phone, email: form.email, shirt: form.shirt, medal: form.medal, cup: form.cup,
    ...(form.shirt ? { shirtModel: form.shirtModel, shirtSize: form.shirtSize } : {}), skewerQuantity: form.skewerQuantity,
    ...(form.skewerQuantity ? { skewerChoice: form.skewerChoice } : {}), drink: form.drink, acceptedTerms: form.acceptedTerms }
  busy.value = true
  try { result.value = await submitStaffRegistration(registration, invitationCode.value); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  catch (e) { error.value = e.message; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  finally { busy.value = false }
}
function pay() { try { openCheckout(result.value.checkoutUrl) } catch (e) { error.value = e.message } }
async function copyLink() { try { await navigator.clipboard.writeText(result.value.checkoutUrl); copyMessage.value = 'Link copiado!' } catch { showLink.value = true; copyMessage.value = 'Selecione e copie o link abaixo.' } }
onMounted(loadOffer)
</script>

<style src="../styles/registration-flow.css"></style>
<style scoped>
.flow-back-home { text-decoration: none; }
.kit-label { font-size: .95rem; margin: 24px 0 8px; }
.kit-choices { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.flow-choice { min-width: 0; }
.flow-choice strong { text-transform: uppercase; font-size: .85rem; }
.flow-choice:focus-within { outline: 2px solid var(--accent-gold); outline-offset: 3px; }
.flow-choice.unavailable { opacity: .6; cursor: not-allowed; }
.staff-shirt-guide { margin-top: 16px; }
.flow-form .staff-drinks { width: 100%; margin-top: 24px; }
.staff-drinks legend { font-weight: 800; margin: 0 0 8px; }
.review-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.review-heading + .flow-summary { margin-top: 8px; }
.flow-summary small { display: block; color: #756c60; font-weight: 400; margin-top: 4px; }
.protocol { overflow-wrap: anywhere; }
.actions { margin: 24px 0; }
.success > .flow-text-button { display: inline-block; margin-top: 12px; }
.flow-step-header h1 { scroll-margin-top: 110px; }
@media (max-width: 600px) {
  .kit-choices { grid-template-columns: 1fr; }
  .kit-choices .flow-choice { align-items: center; }
  .kit-choices .flow-choice > span { flex: 1; flex-direction: row; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 12px; }
  .kit-choices .flow-choice small { width: 100%; }
  .actions { align-items: stretch; flex-direction: column; gap: 12px; }
}
</style>
