<template>
  <section class="raffle-panel font-condensed" aria-labelledby="raffle-title" :aria-busy="loading">
    <header class="raffle-heading">
      <div>
        <p class="raffle-eyebrow font-slab">BEER RUN DOS GORDOS</p>
        <h2 id="raffle-title" class="font-slab">Sorteio dos Gordos</h2>
        <p>A turma toda participa. Um nome, uma comemoração.</p>
      </div>
      <button type="button" class="btn-vintage btn-sm raffle-secondary font-slab" :disabled="loading || drawing" @click="load"><RotateCw :size="17" :class="{ 'raffle-loading-icon': loading }" aria-hidden="true" />{{ loading ? 'Carregando…' : 'Atualizar participantes' }}</button>
    </header>

    <p v-if="error" class="raffle-error" role="alert">{{ error }} O sorteio fica bloqueado até carregar as duas listas. Tente atualizar os participantes.</p>
    <p v-if="storageError" class="raffle-error" role="alert">Não foi possível salvar nesta aba. Mantenha a página aberta para preservar os participantes extras e resultados.</p>

    <div class="raffle-layout">
      <div class="raffle-main">
        <div class="raffle-stage vintage-card">
          <RaffleDisplay v-if="!presentationOpen" :drawing="drawing" :winner="winner" :preview="preview" :loading="loading" :audience-label="audienceLabel" />
          <div class="raffle-controls">
            <div class="raffle-audience">
              <div class="filter-pills" role="group" aria-label="Participantes do sorteio" aria-describedby="raffle-filter-note">
                <button v-for="option in audienceOptions" :key="option.value" type="button" class="pill-btn" :class="{ active: audience === option.value }" :value="option.value" :aria-pressed="audience === option.value" :disabled="drawing || loading" @click="audience = option.value">{{ option.label }}</button>
              </div>
              <p id="raffle-filter-note" class="raffle-note">{{ audience === 'kids' ? 'Atletas da modalidade Kids e convidados marcados como Kids.' : audience === 'adults' ? 'Todos os participantes, exceto atletas e convidados Kids. Inclui staff.' : 'Todos os atletas, staff e convidados, incluindo Kids e cadastros pendentes.' }}</p>
            </div>
            <button type="button" class="btn-vintage raffle-draw font-slab" :disabled="!ready || loading || drawing || !pool.length" @click="draw"><Gift :size="23" aria-hidden="true" />{{ drawing ? 'SORTEANDO…' : !groupParticipants.length ? 'SEM PARTICIPANTES' : !pool.length ? 'TODOS JÁ FORAM SORTEADOS' : winner ? 'SORTEAR PRÓXIMO' : 'SORTEAR UM NOME' }}</button>
            <p class="raffle-caption">{{ loading ? 'Buscando atletas e staff…' : !groupParticipants.length ? 'Nenhum participante neste grupo. Escolha outro filtro ou adicione convidados.' : !pool.length ? 'Este grupo já foi sorteado. Reinicie os sorteios ou permita repetir ganhadores.' : `${pool.length} participantes neste sorteio. Todos têm a mesma chance.` }}</p>
            <label class="raffle-repeat"><input v-model="allowRepeat" type="checkbox" :disabled="drawing" /> Permitir que uma pessoa ganhe novamente</label>
          </div>
          <div class="raffle-counts" aria-live="polite"><span><strong class="font-slab">{{ groupParticipants.length }}</strong> neste grupo</span><span><strong class="font-slab">{{ pool.length }}</strong> disponíveis</span><span><strong class="font-slab">{{ history.length }}</strong> sorteios realizados</span></div>
        </div>

        <section class="raffle-card raffle-history vintage-card">
          <div class="raffle-card-heading"><h3 class="font-slab"><Trophy :size="20" aria-hidden="true" />Quem já ganhou</h3><button type="button" class="btn-vintage btn-sm raffle-secondary font-slab" :disabled="drawing || !history.length" @click="resetHistory"><RotateCw :size="16" aria-hidden="true" />Reiniciar sorteios</button></div>
          <p v-if="!history.length" class="raffle-history-empty">O primeiro ganhador vai aparecer aqui.</p>
          <ol v-else reversed><li v-for="(entry, index) in [...history].reverse()" :key="history.length - index"><strong class="font-slab">{{ entry.displayName || entry.name }}</strong><span>{{ entry.source }} · {{ formatTime(entry.drawnAt) }}</span></li></ol>
          <p class="raffle-note">Extras e resultados ficam salvos somente nesta aba do navegador. Ao sair da conta, são apagados. Não são compartilhados com outros dispositivos.</p>
        </section>
      </div>

      <aside class="raffle-sidebar">
        <section class="raffle-card vintage-card">
          <div class="raffle-card-heading"><h3 class="font-slab"><UserPlus :size="20" aria-hidden="true" />Adicionar convidados</h3></div>
          <p>Inclua mais pessoas na lista do sorteio.</p>
          <form @submit.prevent="addExtras">
            <label for="raffle-names" class="form-label font-slab">Nomes, um por linha</label>
            <textarea id="raffle-names" v-model="names" class="form-input font-condensed" rows="3" maxlength="10000" placeholder="Maria Souza&#10;João Oliveira" :disabled="drawing" required></textarea>
            <label class="raffle-extra-kids"><input id="raffle-extra-kids" v-model="extraChild" type="checkbox" :disabled="drawing" /> Estes convidados são Kids</label>
            <button type="submit" class="btn-vintage btn-sm font-slab" :disabled="drawing || !ready || loading || !names.trim()"><UserPlus :size="18" aria-hidden="true" />Adicionar participantes</button>
          </form>
          <p class="raffle-note">Os convidados entram somente no sorteio.</p>
          <p v-if="addMessage" class="raffle-feedback" role="status">{{ addMessage }}</p>
        </section>
        <section class="raffle-card vintage-card">
          <div class="raffle-card-heading"><h3 class="font-slab"><Users :size="20" aria-hidden="true" />Participantes · {{ audienceOptions.find(option => option.value === audience).label }}</h3><span class="raffle-total font-slab">{{ groupParticipants.length }}</span></div>
          <p class="raffle-roster-summary">{{ athleteCount }} atletas · {{ staffCount }} staff · {{ extraCount }} extras</p>
          <p class="raffle-note">Cada cadastro é uma entrada; homônimos são mantidos. A busca abaixo serve apenas para consultar os nomes.</p>
          <label class="raffle-search-label form-label font-slab" for="raffle-search">Buscar participante</label>
          <div class="raffle-search"><Search :size="18" aria-hidden="true" /><input id="raffle-search" v-model="search" class="form-input font-condensed" type="search" placeholder="Digite um nome" /></div>
          <ul class="raffle-participants">
            <li v-for="entry in filteredParticipants" :key="entry.id"><div><strong class="font-slab" :title="entry.name">{{ entry.displayName || entry.name }}</strong><span class="raffle-source" :class="{ 'already-won': !allowRepeat && drawnIds.has(entry.id) }">{{ entry.source }}{{ entry.isChild ? ' · Kids' : '' }}{{ !allowRepeat && drawnIds.has(entry.id) ? ' · Já ganhou' : '' }}</span></div><button v-if="entry.source === 'Extra'" type="button" class="btn-row-action btn-delete raffle-remove" :disabled="drawing" :aria-label="`Remover ${entry.name} do sorteio`" @click="removeExtra(entry.id)"><Trash2 :size="17" aria-hidden="true" /></button></li>
          </ul>
          <p v-if="!filteredParticipants.length" class="raffle-note">{{ loading ? 'Buscando participantes…' : 'Nenhum participante encontrado.' }}</p>
        </section>
      </aside>
    </div>

    <Teleport to="body">
      <dialog ref="presentationDialog" class="raffle-fullscreen" aria-label="Sorteio Beer Run dos Gordos em tela cheia" @cancel.prevent="closePresentation" @close="onPresentationClosed">
        <RaffleDisplay v-if="presentationOpen" fullscreen :drawing="drawing" :winner="winner" :preview="preview" :loading="loading" :audience-label="audienceLabel" :can-draw="ready && !loading && !drawing && pool.length > 0" @close="closePresentation" @draw="draw" />
      </dialog>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Gift, RotateCw, Search, Trash2, Trophy, UserPlus, Users } from 'lucide-vue-next'
import { staffRequest } from '../services/staff-api.js'
import { buildParticipants, filterParticipants, formatRaffleAthleteName, normalizeName, randomIndex, restoreRaffle, saveRaffle } from '../services/raffle.js'
import RaffleDisplay from './RaffleDisplay.vue'

const saved = restoreRaffle()
const extras = ref(saved.extras)
const history = ref(saved.history)
const allowRepeat = ref(saved.allowRepeat)
const audience = ref(saved.audience)
const extraChild = ref(false)
const audienceOptions = [{ value: 'all', label: 'Todos' }, { value: 'adults', label: 'Adultos' }, { value: 'kids', label: 'Kids' }]
const audienceLabel = computed(() => audience.value === 'kids' ? 'Sorteio Kids' : audience.value === 'adults' ? 'Sorteio para adultos' : 'Atletas + staff + convidados')
const imported = ref([])
const ready = ref(false)
const loading = ref(false)
const error = ref('')
const storageError = ref(false)
const drawing = ref(false)
const names = ref('')
const search = ref('')
const addMessage = ref('')
const winner = ref(history.value.at(-1) || null)
const preview = ref(null)
const presentationOpen = ref(false)
const presentationDialog = ref(null)
let previousOverflow = ''
let previousRootOverflow = ''
let previousFocus = null
let timer
let disposed = false
const participants = computed(() => [...imported.value, ...extras.value])
const groupParticipants = computed(() => filterParticipants(participants.value, audience.value))
const athleteCount = computed(() => groupParticipants.value.filter(entry => entry.source === 'Atleta').length)
const staffCount = computed(() => groupParticipants.value.filter(entry => entry.source === 'Staff').length)
const extraCount = computed(() => groupParticipants.value.filter(entry => entry.source === 'Extra').length)
const drawnIds = computed(() => new Set(history.value.map(entry => entry.id)))
const pool = computed(() => groupParticipants.value.filter(entry => allowRepeat.value || !drawnIds.value.has(entry.id)))
const filteredParticipants = computed(() => groupParticipants.value.filter(entry => [entry.name, entry.displayName || ''].some(name => normalizeName(name).includes(normalizeName(search.value)))))

watch([extras, history, allowRepeat, audience], () => {
  storageError.value = !saveRaffle({ extras: extras.value, history: history.value, allowRepeat: allowRepeat.value, audience: audience.value })
}, { deep: true })
watch(audience, () => { winner.value = null; preview.value = null })

async function load() {
  if (loading.value || drawing.value) return
  loading.value = true
  ready.value = false
  error.value = ''
  try {
    const [athletes, team] = await Promise.all([staffRequest('athletes'), staffRequest('team')])
    if (disposed) return
    if (!Array.isArray(athletes.athletes) || !Array.isArray(team.rows) ||
      [...athletes.athletes, ...team.rows].some(row => row.id == null || typeof row.name !== 'string' || !row.name.trim())) throw new Error('A lista de participantes está incompleta.')
    imported.value = buildParticipants(athletes.athletes, team.rows)
    // Reformat results saved before nicknames were included, keeping the same winners.
    const byId = new Map(imported.value.map(entry => [entry.id, entry]))
    history.value = history.value.map(entry => ({ ...entry, displayName: byId.get(entry.id)?.displayName || entry.displayName || (entry.source === 'Atleta' ? formatRaffleAthleteName(entry.name) : entry.name) }))
    const groupIds = new Set(groupParticipants.value.map(entry => entry.id))
    winner.value = history.value.findLast(entry => groupIds.has(entry.id)) || null
    ready.value = true
  } catch (e) { if (!disposed) error.value = e.message || 'Não foi possível carregar os participantes.' }
  finally { if (!disposed) loading.value = false }
}

function addExtras() {
  if (drawing.value || !ready.value || loading.value) return
  const existing = new Set(participants.value.flatMap(entry => [normalizeName(entry.name), normalizeName(entry.displayName || entry.name)]))
  let added = 0, duplicates = 0, tooLong = 0
  const additions = []
  for (const line of names.value.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, ' ')
    if (!name) continue
    if (name.length > 120) { tooLong++; continue }
    const key = normalizeName(name)
    if (existing.has(key)) { duplicates++; continue }
    existing.add(key)
    additions.push({ id: `extra:${crypto.randomUUID()}`, name, source: 'Extra', isChild: extraChild.value })
    added++
  }
  extras.value = [...extras.value, ...additions]
  addMessage.value = `${added} participante(s) adicionado(s).${duplicates ? ` ${duplicates} nome(s) já presente(s). Para homônimos, acrescente uma identificação.` : ''}${tooLong ? ` ${tooLong} nome(s) excedem 120 caracteres.` : ''}`
  names.value = ''
}
function removeExtra(id) {
  if (drawing.value) return
  extras.value = extras.value.filter(entry => entry.id !== id)
}
function draw() {
  if (drawing.value || loading.value || !ready.value || !pool.value.length) return
  // Freeze eligibility and choose once; the name animation never affects the result.
  const candidates = pool.value.slice()
  const selected = { ...candidates[randomIndex(candidates.length)] }
  openPresentation()
  drawing.value = true
  winner.value = null
  preview.value = null
  function reveal() {
    const result = { ...selected, drawnAt: new Date().toISOString() }
    history.value = [...history.value, result]
    winner.value = result
    preview.value = null
    drawing.value = false
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || candidates.length === 1) {
    timer = window.setTimeout(reveal, 180)
    return
  }
  let index = randomIndex(candidates.length)
  const startedAt = performance.now()
  const duration = 3200
  function showNextName() {
    const elapsed = performance.now() - startedAt
    if (elapsed >= duration) { reveal(); return }
    preview.value = candidates[index++ % candidates.length]
    // Gradually slow down the cycling before revealing the selected name.
    timer = window.setTimeout(showNextName, Math.min(70 + 280 * (elapsed / duration) ** 2, duration - elapsed))
  }
  showNextName()
}
function openPresentation() {
  if (presentationOpen.value) return
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  previousRootOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  presentationOpen.value = true
  nextTick(() => {
    if (!disposed && presentationOpen.value) presentationDialog.value?.showModal()
  })
}
function closePresentation() {
  presentationDialog.value?.close()
  onPresentationClosed()
}
function onPresentationClosed() {
  // A queued close event can arrive after the next draw has reopened the dialog.
  if (presentationDialog.value?.open || !presentationOpen.value) return
  presentationOpen.value = false
  document.body.style.overflow = previousOverflow
  document.documentElement.style.overflow = previousRootOverflow
  nextTick(() => { if (!disposed && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }) })
}
function resetHistory() {
  if (drawing.value || !window.confirm('Apagar o histórico e colocar todos de volta no sorteio? Os participantes extras serão mantidos.')) return
  history.value = []
  winner.value = null
}
const formatTime = date => new Date(date).toLocaleString('pt-BR')
defineExpose({ refresh: load })
onMounted(load)
onUnmounted(() => { disposed = true; clearTimeout(timer); closePresentation() })
</script>

<style scoped src="../styles/staff-dashboard.css"></style>

<style scoped>
/* Use the site's vintage-card / btn-vintage and the staff form controls. */
.raffle-panel { font-size: 1rem; color: var(--text-dark); padding: 0 4px 4px 0; }
.raffle-heading, .raffle-card-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.raffle-heading { margin-bottom: 24px; }
.raffle-heading h2 { font-size: clamp(1.65rem, 3.2vw, 2.25rem); font-weight: 900; line-height: 1.15; margin: 6px 0 10px; }
.raffle-eyebrow { font-weight: 800; letter-spacing: .06em; font-size: .875rem; color: var(--text-muted); }
.raffle-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr); gap: 24px; align-items: start; }
.raffle-main { display: grid; gap: 24px; min-width: 0; }
.raffle-stage { border-radius: 4px; text-align: center; background: var(--bg-parchment-light); min-width: 0; }
.raffle-panel .vintage-card:hover { transform: none; box-shadow: 4px 4px 0 rgb(25 23 20 / 80%); }
.raffle-fullscreen { position: fixed; inset: 0; width: 100vw; height: 100%; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: var(--text-light); color: var(--text-dark); overflow: auto; overscroll-behavior: contain; }
.raffle-fullscreen::backdrop { background: var(--text-light); }
.raffle-controls { padding: 24px 24px 0; }
.raffle-audience { margin-bottom: 20px; }
.raffle-audience .filter-pills { justify-content: center; }
.raffle-audience .pill-btn:disabled { opacity: .6; }
.raffle-audience .raffle-note { margin: 10px 0 0; }
.raffle-extra-kids { display: flex; align-items: center; gap: 8px; min-height: 40px; cursor: pointer; }
.raffle-extra-kids input { width: 18px; height: 18px; accent-color: var(--accent-green); flex-shrink: 0; }
.raffle-caption { margin: 16px 0; font-size: .875rem; color: var(--text-muted); }
.raffle-counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 18px 8px; border-top: 1px solid rgb(44 39 31 / 20%); font-size: .875rem; color: var(--text-muted); }
.raffle-counts > span + span { border-left: 1px solid rgb(44 39 31 / 20%); }
.raffle-counts strong { display: block; font-size: 1.6rem; font-weight: 900; color: var(--text-dark); line-height: 1.2; }
.raffle-draw { width: 100%; min-height: 60px; padding: 14px; font-size: 1.15rem; }
.raffle-panel .btn-sm { min-height: 44px; font-size: .875rem; }
.raffle-panel button svg { flex-shrink: 0; }
.raffle-panel button:disabled { cursor: not-allowed; }
.raffle-panel button:focus-visible, .raffle-panel input:focus-visible, .raffle-panel textarea:focus-visible { outline: 3px solid var(--accent-gold); outline-offset: 3px; }
.raffle-secondary { background: var(--bg-parchment-light); }
.raffle-repeat { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px 0; font-size: 1rem; cursor: pointer; }
.raffle-repeat input { flex-shrink: 0; width: 18px; height: 18px; accent-color: var(--accent-green); }
.raffle-sidebar { display: grid; gap: 24px; min-width: 0; }
.raffle-card { border-radius: 4px; padding: 20px; min-width: 0; }
.raffle-card-heading { padding-bottom: 14px; border-bottom: 2px solid var(--accent-border); }
.raffle-card-heading h3 { display: flex; align-items: center; gap: 10px; font-size: 1.05rem; font-weight: 900; margin: 0; }
.raffle-card-heading h3 svg { color: var(--accent-green); flex-shrink: 0; }
.raffle-card p { margin: 12px 0; }
.raffle-card form { display: grid; gap: 10px; margin-top: 16px; }
.raffle-panel .form-label { font-size: .875rem; text-transform: uppercase; }
.raffle-panel .form-input { display: block; width: 100%; color: var(--text-dark); line-height: 1.5; }
.raffle-panel textarea { resize: vertical; }
.raffle-note { font-size: .875rem; color: var(--text-muted); line-height: 1.5; }
.raffle-search-label { display: block; margin: 16px 0 6px; }
.raffle-search { position: relative; }
.raffle-search > svg { position: absolute; top: 50%; left: 12px; transform: translateY(-50%); color: var(--text-muted); }
.raffle-search input { padding-left: 38px; }
.raffle-total { padding: 3px 9px; background: var(--accent-dark); color: var(--text-light); border-radius: 3px; font-size: .875rem; font-weight: 800; }
.raffle-roster-summary { font-weight: 700; }
.raffle-participants { list-style: none; margin: 14px 0 0; padding: 0; max-height: 300px; overflow: auto; }
.raffle-participants li { display: flex; align-items: center; justify-content: space-between; padding: 12px 8px; gap: 12px; border-bottom: 1px solid rgb(44 39 31 / 15%); }
.raffle-participants li:nth-child(odd) { background: rgb(228 213 183 / 25%); }
.raffle-participants li > div { min-width: 0; }
.raffle-participants strong { display: block; font-size: .95rem; overflow-wrap: anywhere; }
.raffle-source { display: inline-block; font-size: .875rem; color: var(--text-muted); margin-top: 5px; }
.raffle-source.already-won { color: var(--accent-green); font-weight: 800; }
.raffle-remove { flex-shrink: 0; width: 44px; height: 44px; }
.raffle-error { padding: 16px; margin-bottom: 16px; background: #ffebee; border: 1px solid #ef9a9a; border-radius: 3px; color: #c62828; }
.raffle-feedback { font-size: .875rem; font-weight: 700; }
.raffle-history ol { padding-left: 26px; margin: 18px 0; max-height: 320px; overflow: auto; }
.raffle-history li { padding: 10px 8px; border-bottom: 1px solid rgb(44 39 31 / 15%); overflow-wrap: anywhere; }
.raffle-history li::marker { font-family: var(--font-slab); font-weight: 900; }
.raffle-history li span { display: block; font-size: .875rem; color: var(--text-muted); margin-top: 4px; }
.raffle-history-empty { padding: 20px 0; text-align: center; color: var(--text-muted); }
.raffle-history > .raffle-note { border-top: 1px dashed var(--accent-border); padding-top: 14px; margin-bottom: 0; }
.raffle-loading-icon { animation: raffle-loading 1s linear infinite; }
@keyframes raffle-loading { to { transform: rotate(360deg); } }
@media (max-width: 850px) {
  .raffle-layout { grid-template-columns: minmax(0, 1fr); }
  .raffle-heading { align-items: start; }
  .raffle-controls { padding: 20px 16px 0; }
  .raffle-card { padding: 16px; }
}
@media (max-width: 380px) {
  .raffle-controls { padding: 16px 12px 0; }
  .raffle-heading h2 { font-size: 1.6rem; }
  .raffle-eyebrow { font-size: .8125rem; gap: 5px; letter-spacing: 0; }
  .raffle-card { padding: 12px; }
  .raffle-card-heading { gap: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .raffle-loading-icon { animation: none; }
  .raffle-panel .btn-vintage { transition: none; }
}
</style>
