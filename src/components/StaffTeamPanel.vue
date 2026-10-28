<template>
  <section class="team-panel tab-pane font-condensed" aria-label="Cadastros da equipe" :aria-busy="loading">
    <div class="pane-toolbar">
      <div class="search-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
        <input v-model="search" class="form-input search-input font-condensed" type="text" aria-label="Buscar na equipe" placeholder="Buscar staff por nome, e-mail ou tel..." />
        <button v-if="search" class="btn-clear-search" type="button" aria-label="Limpar busca" @click="search = ''">✕</button>
      </div>
      <div class="filter-pills font-condensed desktop-filters" aria-label="Filtrar pagamento">
        <button type="button" class="pill-btn" :class="{ active: filter === 'ALL' }" :aria-pressed="filter === 'ALL'" @click="filter = 'ALL'">Todos Status</button>
        <button v-for="key in visibleStatuses" :key="key" type="button" class="pill-btn" :class="{ active: filter === key, 'pill-pending': key === 'PENDING_PAYMENT', 'pill-completed': key === 'PAID' }" :aria-pressed="filter === key" :data-status="key" @click="filter = key">
          {{ statuses[key].symbol }} {{ statuses[key].filterLabel || statuses[key].label }} ({{ countStatus(key) }})
        </button>
      </div>
      <div class="mobile-athlete-filters-grid team-mobile-filter font-condensed">
        <div class="mobile-select-group">
          <label for="team-payment-filter" class="mobile-select-label">Status Pgto:</label>
          <select id="team-payment-filter" v-model="filter" class="mobile-filter-dropdown" aria-label="Filtrar pagamento da equipe">
            <option value="ALL">Todos os Status ({{ rows.length }})</option>
            <option v-for="(status, key) in statuses" :key="key" :value="key">{{ status.label }} ({{ countStatus(key) }})</option>
          </select>
        </div>
      </div>
      <div class="toolbar-actions team-actions">
        <a class="btn-vintage btn-sm font-slab" href="/cadastro-staff" target="_blank" rel="noopener"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> Abrir formulário</a>
        <button type="button" class="btn-vintage btn-sm btn-export font-slab" @click="copyLink"><i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar link</button>
        <button type="button" class="btn-vintage btn-sm font-slab team-refresh" :disabled="loading" @click="load"><i :class="['fa-solid fa-arrows-rotate', { 'fa-spin': loading }]" aria-hidden="true"></i> {{ loading ? 'Atualizando...' : 'Atualizar' }}</button>
      </div>
    </div>
    <p v-if="copyMessage" class="team-copy-feedback" role="status">{{ copyMessage }}</p>
    <label v-if="showLink" class="team-share-link">Link do formulário<input class="form-input font-condensed" :value="formUrl" readonly @focus="$event.target.select()" /></label>
    <div v-if="error" class="error-banner" role="alert">{{ error }} <span v-if="loaded">Exibindo os dados da última atualização.</span></div>

    <div class="table-container vintage-card">
      <div class="table-summary-bar font-condensed" role="status">
        <span v-if="loading">Carregando equipe...</span>
        <span v-else>Exibindo <strong>{{ filteredRows.length }}</strong> de <strong>{{ rows.length }}</strong> cadastros</span>
        <span>Staff não ocupa vagas de atletas</span>
      </div>
      <div class="table-responsive-wrapper">
        <table class="data-table">
          <thead><tr class="font-slab"><th scope="col">#</th><th scope="col">Staff</th><th scope="col">Contato</th><th scope="col">Kit selecionado</th><th scope="col">Status Pagamento</th><th scope="col" class="team-total">Total</th></tr></thead>
          <tbody>
            <tr v-if="!filteredRows.length"><td colspan="6" class="table-empty">{{ emptyMessage }} <button v-if="search || filter !== 'ALL'" type="button" class="pill-btn clear-filters" @click="clearFilters">Limpar filtros</button></td></tr>
            <tr v-for="(row, index) in filteredRows" :key="row.id" class="team-row">
              <td class="cell-num font-slab">{{ index + 1 }}</td>
              <td><div class="athlete-name-cell"><span class="athlete-name font-slab">{{ row.name }}</span><span v-if="row.created_at" class="athlete-kit-info text-muted">Cadastro em {{ formatDate(row.created_at) }}</span></div></td>
              <td>
                <a v-if="row.phone" :href="whatsappLink(row.phone)" target="_blank" rel="noopener noreferrer" class="whatsapp-link" title="Chamar no WhatsApp"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> {{ formatPhone(row.phone) }}</a>
                <span v-else class="text-muted">Telefone não informado</span>
                <div class="athlete-kit-info text-muted team-email">{{ row.email || 'E-mail não informado' }}</div>
              </td>
              <td class="team-kit-cell">
                <div v-for="item in row.items" :key="item.id" class="athlete-kit-info team-kit-line">
                  <span>{{ itemIcon(item.id) }} <strong>{{ item.quantity }} × {{ item.label }}</strong> · {{ money(item.unitAmount * item.quantity) }}</span>
                  <span v-if="item.id === 'shirt'" class="team-kit-detail text-muted">{{ formatShirtSelection(row.selection?.shirtModel, row.selection?.shirtSize, 'staff') }}</span>
                  <span v-if="item.id === 'skewer' && row.selection?.skewerChoice" class="team-kit-detail text-muted">{{ row.selection.skewerChoice }}</span>
                </div>
                <span v-if="!row.items?.length" class="athlete-kit-info text-muted">Nenhum item selecionado</span>
              </td>
              <td><div class="status-cell-wrap"><span :class="['tag-badge', statusInfo(row).className]"><i :class="statusInfo(row).icon" aria-hidden="true"></i> {{ statusInfo(row).label }}</span></div></td>
              <td class="team-total"><strong>{{ money(row.amount) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mobile-cards-list mobile-team-list">
        <div v-if="!filteredRows.length" class="table-empty">{{ emptyMessage }} <button v-if="search || filter !== 'ALL'" type="button" class="pill-btn clear-filters" @click="clearFilters">Limpar filtros</button></div>
        <article v-for="(row, index) in filteredRows" :key="row.id" class="mobile-data-card">
          <div class="mobile-card-top-row">
            <div class="mobile-card-identity"><span class="mobile-pos-badge font-slab">{{ index + 1 }}</span><div><div class="mobile-athlete-name font-slab">{{ row.name }}</div><div v-if="row.created_at" class="athlete-kit-info text-muted">Cadastro em {{ formatDate(row.created_at) }}</div></div></div>
            <a v-if="row.phone" :href="whatsappLink(row.phone)" target="_blank" rel="noopener noreferrer" class="btn-row-action btn-wa" :aria-label="`Chamar ${row.name} no WhatsApp`"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></a>
          </div>
          <div><span class="mobile-phone-text">{{ formatPhone(row.phone) }}</span><div class="athlete-kit-info text-muted team-email">{{ row.email || 'E-mail não informado' }}</div></div>
          <div>
            <div v-for="item in row.items" :key="item.id" class="athlete-kit-info team-kit-line">
              <span>{{ itemIcon(item.id) }} <strong>{{ item.quantity }} × {{ item.label }}</strong> · {{ money(item.unitAmount * item.quantity) }}</span>
              <span v-if="item.id === 'shirt'" class="team-kit-detail text-muted">{{ formatShirtSelection(row.selection?.shirtModel, row.selection?.shirtSize, 'staff') }}</span>
              <span v-if="item.id === 'skewer' && row.selection?.skewerChoice" class="team-kit-detail text-muted">{{ row.selection.skewerChoice }}</span>
            </div>
            <span v-if="!row.items?.length" class="athlete-kit-info text-muted">Nenhum item selecionado</span>
          </div>
          <div class="mobile-card-status-row"><div class="mobile-status-left"><span class="mobile-status-label">Status:</span><span :class="['tag-badge', statusInfo(row).className]"><i :class="statusInfo(row).icon" aria-hidden="true"></i> {{ statusInfo(row).label }}</span></div></div>
          <div class="mobile-card-footer-split"><span>Total do kit</span><strong>{{ money(row.amount) }}</strong></div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { staffRequest } from '../services/staff-api.js'
import { formatShirtSelection } from '../services/shirts.js'

const rows = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('ALL')
const copyMessage = ref('')
const showLink = ref(false)
const formUrl = window.location.origin + '/cadastro-staff'
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const money = value => currency.format(value / 100)
const statuses = {
  PENDING_PAYMENT: { label: 'Aguardando Pgto', symbol: '⏳', className: 'tag-wait-pay', icon: 'fa-solid fa-hourglass-half' },
  PAID: { label: 'Concluído (Pago)', filterLabel: 'Concluídos', symbol: '🟢', className: 'tag-paid', icon: 'fa-solid fa-circle-check' },
  NO_PAYMENT: { label: 'Sem cobrança', symbol: '⚪', className: 'tag-pre-only', icon: 'fa-regular fa-circle' },
  CANCELLED: { label: 'Cancelado', symbol: '✕', className: 'tag-pre-only', icon: 'fa-solid fa-ban' },
  EXPIRED: { label: 'Expirado', symbol: '◷', className: 'tag-pre-only', icon: 'fa-regular fa-clock' },
  REFUNDED: { label: 'Reembolsado', symbol: '↶', className: 'tag-pre-only', icon: 'fa-solid fa-rotate-left' },
  UNKNOWN: { label: 'Consultar pedido', symbol: '?', className: 'tag-pre-only', icon: 'fa-solid fa-circle-question' },
}
function statusKey(row) {
  if (row.amount === 0) return 'NO_PAYMENT'
  const status = (Array.isArray(row.orders) ? row.orders[0] : row.orders)?.status
  return statuses[status] ? status : 'UNKNOWN'
}
const statusInfo = row => statuses[statusKey(row)]
const countStatus = status => rows.value.filter(row => statusKey(row) === status).length
const visibleStatuses = computed(() => Object.keys(statuses).filter(key => ['PAID', 'PENDING_PAYMENT', 'NO_PAYMENT'].includes(key) || countStatus(key) || filter.value === key))
const emptyMessage = computed(() => loading.value ? 'Buscando os cadastros da equipe...' : error.value && !loaded.value ? 'Não foi possível carregar a equipe. Tente atualizar novamente.' : rows.value.length ? 'Nenhum cadastro encontrado com os filtros selecionados.' : 'Nenhum cadastro da equipe ainda.')
function clearFilters() { search.value = ''; filter.value = 'ALL' }
const itemIcon = id => ({ shirt: '👕', medal: '🏅', cup: '🥤', skewer: '🍢', beer: '🍺', softDrink: '🥤' }[id] || '•')
function whatsappLink(phone) {
  const digits = String(phone).replace(/\D/g, '')
  return 'https://wa.me/' + (digits.length <= 11 ? '55' : '') + digits
}
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filteredRows = computed(() => {
  const query = normalize(search.value.trim())
  const digits = query.replace(/\D/g, '')
  return rows.value.filter(row => (filter.value === 'ALL' || statusKey(row) === filter.value) && (
    [row.name, row.email, row.phone].some(value => normalize(value).includes(query)) ||
    (digits.length >= 3 && /^[\d\s()+.-]+$/.test(query) && String(row.phone).replace(/\D/g, '').includes(digits))
  ))
})
function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  return digits.length === 11 ? digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : digits.length === 10 ? digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3') : value || 'Telefone não informado'
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR')
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(formUrl)
    copyMessage.value = 'Link do formulário copiado!'
    showLink.value = false
  } catch {
    copyMessage.value = 'Selecione e copie o link abaixo.'
    showLink.value = true
  }
}
async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    rows.value = (await staffRequest('team')).rows
    loaded.value = true
  } catch (e) {
    error.value = e.message || 'Não foi possível carregar a equipe.'
  } finally {
    loading.value = false
  }
}
defineExpose({ refresh: load })
onMounted(load)
</script>

<style scoped src="../styles/staff-dashboard.css"></style>

<style scoped>
/* Only staff-specific content; toolbar, table, badges and mobile cards share the athletes stylesheet. */
.team-panel { min-width: 0; }
.team-panel .search-wrap { flex-basis: 100%; }
.team-actions { flex-wrap: wrap; }
.team-total { text-align: right; white-space: nowrap; }
.team-email, .team-kit-cell { overflow-wrap: anywhere; }
.team-kit-cell { min-width: 180px; }
.team-kit-line { margin: 4px 0; }
.team-kit-detail { display: block; padding-left: 20px; }
.team-copy-feedback { color: var(--accent-green); }
.team-share-link { display: grid; gap: 6px; }
.team-refresh:disabled { opacity: .65; cursor: wait; }
.clear-filters { margin: 8px; }
@media (max-width: 768px) {
  .team-mobile-filter { grid-template-columns: 1fr; }
  .team-actions > * { flex: 1 1 auto; }
  .team-panel .table-summary-bar { flex-wrap: wrap; gap: 4px; }
  .team-panel .tag-badge { white-space: normal; }
}
</style>
