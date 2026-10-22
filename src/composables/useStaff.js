import { formatShirtSelection } from '../services/shirts.js'
import { ref, computed } from 'vue'
import { formatAthleteDisplayName, mapDatabaseAthlete, MAX_ATHLETES } from './useAthletes.js'
import { staffAuthenticated as isAuthenticated, staffRequest, staffMutation, loginStaff, logoutStaff, restoreStaffSession, onStaffReset } from '../services/staff-api.js'

const athletes = ref([])
const athleteSummary = ref(null)
const athletesLoading = ref(false)
const athletesError = ref('')
const waitlist = ref([])
const proposals = ref([])
const isLoading = ref(false)
const staffError = ref(null)
onStaffReset(() => { athletes.value = []; athleteSummary.value = null; waitlist.value = []; proposals.value = []; athletesError.value = ''; staffError.value = null })

export function useStaff() {
  async function fetchStaffAthletes() {
    athletesLoading.value = true
    athletesError.value = ''
    try {
      const data = await staffRequest('athletes')
      const summary = data.summary
      if (!Array.isArray(data.athletes) || !summary || summary.total !== data.athletes.length ||
        !['total', 'confirmedCount', 'totalReceivedCents', 'confirmedWithoutPaymentCount', 'capacity'].every(key => Number.isSafeInteger(summary[key]) && summary[key] >= 0) || summary.currency !== 'BRL') throw new Error('Resposta inválida ao carregar os dados do staff.')
      athletes.value = data.athletes.map(mapDatabaseAthlete)
      athleteSummary.value = summary
      return true
    } catch (error) {
      athletes.value = []; athleteSummary.value = null
      athletesError.value = error.message
      return false
    } finally { athletesLoading.value = false }
  }
  async function login(pin) {
    isLoading.value = true
    try { await loginStaff((pin || '').trim()); staffError.value = null; return true }
    catch (error) { staffError.value = error.message; return false }
    finally { isLoading.value = false }
  }
  const restoreSession = restoreStaffSession
  const logout = logoutStaff
  async function refreshAthletes() { if (!await fetchStaffAthletes()) throw new Error(athletesError.value) }
  async function updateAthletePaymentStatus(id, paymentStatus) {
    await staffMutation('athlete.payment', id, { payment_status: paymentStatus }); await refreshAthletes()
  }
  async function deleteAthlete(id, pin) { await staffMutation('athlete.delete', id, undefined, pin); await refreshAthletes(); return true }
  async function addAthleteManual({ name, nickname, phone, modality, drinksBeer }) {
    const { result } = await staffMutation('athlete.add', null, { name, nickname: nickname || null, phone, modality: modality || 'corrida', drinks_beer: Boolean(drinksBeer) })
    await refreshAthletes()
    return athletes.value.find(item => item.id === result.id)
  }
  async function toggleCheckIn(id, value) {
    await staffMutation('athlete.checkin', id, { is_checked_in: value }); await refreshAthletes()
  }
  async function fetchWaitlist() {
    isLoading.value = true
    try {
      const { rows } = await staffRequest('waitlist')
      waitlist.value = rows.map((row, index) => ({ id: row.id, position: index + 1, name: row.name, nickname: row.nickname || '', displayName: formatAthleteDisplayName(row.name, row.nickname), phone: row.phone || '', modality: row.modality || 'corrida', drinksBeer: Boolean(row.drinks_beer), status: row.status, createdAt: row.created_at }))
    } catch (error) { waitlist.value = []; staffError.value = error.message; throw error }
    finally { isLoading.value = false }
  }
  async function updateWaitlistStatus(id, status) { await staffMutation('waitlist.status', id, { status }); await fetchWaitlist() }
  async function promoteAthleteToConfirmed(item) {
    await staffMutation('waitlist.promote', item.id); await Promise.all([refreshAthletes(), fetchWaitlist()])
  }
  async function deleteWaitlist(id, pin) { await staffMutation('waitlist.delete', id, undefined, pin); await fetchWaitlist() }
  async function fetchProposals() {
    isLoading.value = true
    try {
      const { rows } = await staffRequest('proposals')
      proposals.value = rows.map(row => ({ id: row.id, companyName: row.company_name, contactName: row.contact_name, phone: row.phone, websiteInstagram: row.website_instagram, sponsorshipType: row.sponsorship_type, amount: row.amount, itemsDescription: row.items_description, activations: row.activations || [], notes: row.notes, logoUrl: row.logo_url, status: row.status, createdAt: row.created_at }))
    } catch (error) { proposals.value = []; staffError.value = error.message; throw error }
    finally { isLoading.value = false }
  }
  async function updateProposalStatus(id, status) { await staffMutation('proposal.status', id, { status }); await fetchProposals() }
  async function deleteProposal(id, pin) { await staffMutation('proposal.delete', id, undefined, pin); await fetchProposals() }

  // --------------------------------------------------------------------------
  // LINKS INTELIGENTES PARA WHATSAPP
  // --------------------------------------------------------------------------
  function sanitizePhoneForWhatsApp(phone) {
    if (!phone) return ''
    let clean = phone.replace(/\D/g, '')
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean
    }
    return clean
  }

  function getAthleteWhatsAppLink(athlete) {
    const phone = sanitizePhoneForWhatsApp(athlete.phone)
    if (!phone) return null
    if (athlete.modality === 'kids') {
      const message = `Olá, ${athlete.guardianName || 'responsável'}! Aqui é da organização da Beer Run Kids. Estamos entrando em contato sobre a inscrição de ${athlete.name}.`
      return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    }

    const firstName = athlete.name?.trim().split(/\s+/)[0] || 'atleta'

    const text = `🍺🏃‍♂️ *Ei, ${firstName}! Tá faltando você nessa história!* 😂
Passando aqui porque sentimos falta do seu nome na lista de atletas confirmados da *BEER RUN DOS GORDOS!* 👀🍻
Vimos que você fez a sua *pré-inscrição*, mas ainda não concluiu a inscrição oficial.

⚠️ *Só pra lembrar:* a pré-inscrição foi apenas uma manifestação de interesse. Para garantir sua participação, é necessário finalizar a inscrição pelo nosso site!

A gente tá preparando tudo com muito carinho para essa primeira edição e queremos você fazendo parte dessa resenha! 💛

👉 *Garanta sua inscrição aqui:*
https://gordosrun.netlify.app/#inscricao

Bora correr, caminhar, dar risada e ainda fazer o bem! 🍻🏃‍♂️

*BEER RUN DOS GORDOS — 1ª EDIÇÃO • 2026*
*Performance questionável. Histórias garantidas.*`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  function getWaitlistWhatsAppLink(athlete) {
    const phone = sanitizePhoneForWhatsApp(athlete.phone)
    if (!phone) return null

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gordosrun.netlify.app'
    const regUrl = `${baseUrl}/#inscricao`
    const firstName = athlete.name?.trim().split(/\s+/)[0] || 'atleta'

    const text = `🍺🏃‍♂️ *Ei, ${firstName}! A SUA VEZ CHEGOU!* 🎉
Temos uma boa notícia pra você! 😎🍻
Você estava na *lista de espera da BEER RUN DOS GORDOS* e agora *sua inscrição está liberada!*

A gente tá preparando tudo com muito carinho para essa primeira edição e queremos você fazendo parte dessa história! 💛

⚠️ *Só pra lembrar:* estar na lista de espera não garante sua participação. Para confirmar sua vaga, é necessário finalizar a inscrição pelo nosso site!

👉 *Garanta sua inscrição aqui:*
${regUrl}

Bora correr, caminhar, dar risada e ainda fazer o bem! 🍻🏃‍♂️

*BEER RUN DOS GORDOS — 1ª EDIÇÃO • 2026*
*Performance questionável. Histórias garantidas.*`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  function getSponsorWhatsAppLink(proposal) {
    const phone = sanitizePhoneForWhatsApp(proposal.phone)
    if (!phone) return null

    const text = `Olá, ${proposal.contactName}! 🍻🤝\n\nAqui é da organização da *Beer Run dos Gordos*!\nRecebemos sua proposta de patrocínio para a marca *${proposal.companyName}* através do nosso site e estamos muito animados com a possibilidade dessa parceria.\n\nPodemos conversar sobre os detalhes e alinhamentos de ativação?`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  // --------------------------------------------------------------------------
  // EXPORTAÇÃO CSV
  // --------------------------------------------------------------------------
  function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function exportAthletesCSV() {
    const headers = [
      'Posicao',
      'Nome',
      'Apelido',
      'Telefone',
      'Espetinhos Chegada',
      'Tamanho Camiseta',
      'Modalidade',
      'Bebe Cerveja',
      'Status Pagamento',
      'Check-in Realizado', 'Responsavel', 'Nascimento'
    ]
    const rows = athletes.value.map((a, i) => [
      i + 1,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${(a.nickname || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${(a.skewerChoice || '').replace(/"/g, '""')}"`,
      `"${formatShirtSelection(a.shirtModel, a.shirtSize, a.modality).replace(/"/g, '""')}"`,
      a.modality === 'kids' ? 'Corrida Kids' : a.modality === 'caminhada' ? 'Caminhada' : 'Corrida',
      a.drinksBeer ? 'Sim' : 'Nao',
      a.paymentStatus === 'completed' ? 'Concluido (Pago)' : (a.paymentStatus === 'pending_payment' ? 'Aguardando Pagamento' : 'Pre-Inscricao'),
      a.isCheckedIn ? 'Sim' : 'Nao',
      `"${(a.guardianName || '').replace(/"/g, '""')}"`, a.birthDate || ''
    ])

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    downloadCSV(csvContent, `beer_run_atletas_confirmados_${Date.now()}.csv`)
  }

  function exportWaitlistCSV() {
    const headers = ['Posicao Fila', 'Nome', 'Apelido', 'Telefone', 'Modalidade', 'Bebe Cerveja', 'Status', 'Data Entrada']
    const rows = waitlist.value.map((w, i) => [
      i + 1,
      `"${(w.name || '').replace(/"/g, '""')}"`,
      `"${(w.nickname || '').replace(/"/g, '""')}"`,
      `"${(w.phone || '').replace(/"/g, '""')}"`,
      w.modality === 'caminhada' ? 'Caminhada' : 'Corrida',
      w.drinksBeer ? 'Sim' : 'Nao',
      w.status,
      w.createdAt ? new Date(w.createdAt).toLocaleString('pt-BR') : ''
    ])

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    downloadCSV(csvContent, `beer_run_lista_espera_${Date.now()}.csv`)
  }

  function exportProposalsCSV() {
    const headers = ['Empresa', 'Contato', 'WhatsApp', 'Tipo Apoio', 'Valor/Itens', 'Status', 'Instagram/Site', 'Data']
    const rows = proposals.value.map(p => [
      `"${(p.companyName || '').replace(/"/g, '""')}"`,
      `"${(p.contactName || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.sponsorshipType || '').replace(/"/g, '""')}"`,
      `"${(p.amount || p.itemsDescription || '').replace(/"/g, '""')}"`,
      p.status,
      `"${(p.websiteInstagram || '').replace(/"/g, '""')}"`,
      p.createdAt ? new Date(p.createdAt).toLocaleString('pt-BR') : ''
    ])

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    downloadCSV(csvContent, `beer_run_propostas_patrocinio_${Date.now()}.csv`)
  }

  return {
    athletes,
    athleteSummary,
    athletesLoading,
    athletesError,
    fetchStaffAthletes,
    isAuthenticated,
    waitlist,
    proposals,
    isLoading,
    staffError,
    maxAthletes: computed(() => athleteSummary.value?.capacity ?? MAX_ATHLETES),
    login,
    logout,
    restoreSession,
    deleteAthlete,
    addAthleteManual,
    toggleCheckIn,
    updateAthletePaymentStatus,
    fetchWaitlist,
    updateWaitlistStatus,
    promoteAthleteToConfirmed,
    deleteWaitlist,
    fetchProposals,
    updateProposalStatus,
    deleteProposal,
    getAthleteWhatsAppLink,
    getWaitlistWhatsAppLink,
    getSponsorWhatsAppLink,
    exportAthletesCSV,
    exportWaitlistCSV,
    exportProposalsCSV
  }
}
