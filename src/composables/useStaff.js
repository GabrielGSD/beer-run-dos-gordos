import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { formatAthleteDisplayName, MAX_ATHLETES, useAthletes } from './useAthletes.js'

const STAFF_PIN = import.meta.env.VITE_STAFF_PIN || 'beerrun2026'
const AUTH_STORAGE_KEY = 'beer_run_staff_auth'
const ATHLETES_STORAGE_KEY = 'beer_run_confirmed_athletes'
const WAITLIST_STORAGE_KEY = 'beer_run_athlete_waitlist'
const PROPOSALS_STORAGE_KEY = 'beer_run_sponsorship_proposals'

// Estado reativo singleton
const isAuthenticated = ref(sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true')
const waitlist = ref([])
const proposals = ref([])
const isLoading = ref(false)
const staffError = ref(null)

export function useStaff() {
  const { athletes, fetchAthletes: refreshPublicAthletes } = useAthletes()

  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO
  // --------------------------------------------------------------------------
  function login(pin) {
    if ((pin || '').trim() === STAFF_PIN) {
      isAuthenticated.value = true
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
      staffError.value = null
      return true
    }
    staffError.value = 'PIN de acesso incorreto!'
    return false
  }

  function logout() {
    isAuthenticated.value = false
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }

  function verifyAdminPassword(pin) {
    return (pin || '').trim() === STAFF_PIN
  }

  // --------------------------------------------------------------------------
  // ATLETAS CONFIRMADOS
  // --------------------------------------------------------------------------
  async function deleteAthlete(athleteId, confirmationPin) {
    staffError.value = null

    if (!verifyAdminPassword(confirmationPin)) {
      const err = new Error('Senha de administrador incorreta!')
      staffError.value = err.message
      throw err
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('athletes')
        .delete()
        .eq('id', athleteId)

      if (error) {
        console.error('Erro ao deletar atleta no Supabase:', error)
        staffError.value = error.message
        throw error
      }
    }

    // Atualiza estado local
    athletes.value = athletes.value.filter(a => a.id !== athleteId)
    try {
      localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {
      console.warn('Erro ao atualizar localStorage de atletas:', e)
    }

    return true
  }

  async function addAthleteManual({ name, nickname, phone, modality, drinksBeer }) {
    staffError.value = null
    const cleanPhone = (phone || '').trim()

    if (!name || !name.trim()) {
      throw new Error('O nome do atleta é obrigatório.')
    }

    const payload = {
      name: name.trim(),
      nickname: nickname?.trim() || null,
      phone: cleanPhone || 'Não informado',
      modality: modality || 'corrida',
      drinks_beer: Boolean(drinksBeer),
      is_checked_in: false
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('athletes')
        .insert([payload])
        .select()
        .single()

      if (error) {
        staffError.value = error.message
        throw error
      }

      const formatted = {
        id: data.id,
        name: data.name,
        nickname: data.nickname || '',
        displayName: formatAthleteDisplayName(data.name, data.nickname),
        phone: data.phone || '',
        modality: data.modality || 'corrida',
        drinksBeer: Boolean(data.drinks_beer),
        isCheckedIn: Boolean(data.is_checked_in),
        createdAt: data.created_at || new Date().toISOString()
      }

      athletes.value.unshift(formatted)
      return formatted
    }

    // Fallback local
    const localAthlete = {
      id: Date.now(),
      name: name.trim(),
      nickname: nickname?.trim() || '',
      displayName: formatAthleteDisplayName(name, nickname),
      phone: cleanPhone || 'Não informado',
      modality: modality || 'corrida',
      drinksBeer: Boolean(drinksBeer),
      isCheckedIn: false,
      createdAt: new Date().toISOString()
    }

    athletes.value.unshift(localAthlete)
    try {
      localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {}

    return localAthlete
  }

  async function toggleCheckIn(athleteId, isCheckedIn) {
    const athlete = athletes.value.find(a => a.id === athleteId)
    if (athlete) {
      athlete.isCheckedIn = isCheckedIn
      athlete.checkedInAt = isCheckedIn ? new Date().toISOString() : null
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('athletes')
          .update({
            is_checked_in: isCheckedIn,
            checked_in_at: isCheckedIn ? new Date().toISOString() : null
          })
          .eq('id', athleteId)
      } catch (e) {
        console.warn('Supabase toggleCheckIn aviso:', e)
      }
    }

    try {
      localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // LISTA DE ESPERA (WAITLIST)
  // --------------------------------------------------------------------------
  async function fetchWaitlist() {
    isLoading.value = true
    staffError.value = null

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('athlete_waitlist')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error

        waitlist.value = (data || []).map((row, index) => ({
          id: row.id,
          position: index + 1,
          name: row.name,
          nickname: row.nickname || '',
          displayName: formatAthleteDisplayName(row.name, row.nickname),
          phone: row.phone || '',
          modality: row.modality || 'corrida',
          drinksBeer: Boolean(row.drinks_beer),
          status: row.status || 'waiting',
          createdAt: row.created_at
        }))
        return
      } catch (err) {
        console.warn('Erro ao carregar waitlist do Supabase, carregando local:', err)
      } finally {
        isLoading.value = false
      }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(WAITLIST_STORAGE_KEY) || '[]')
      waitlist.value = saved.map((row, idx) => ({
        ...row,
        position: idx + 1,
        displayName: row.displayName || formatAthleteDisplayName(row.name, row.nickname)
      }))
    } catch (e) {
      waitlist.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function updateWaitlistStatus(waitlistId, newStatus) {
    const item = waitlist.value.find(w => w.id === waitlistId)
    if (item) {
      item.status = newStatus
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('athlete_waitlist')
          .update({ status: newStatus })
          .eq('id', waitlistId)
      } catch (e) {
        console.warn('Erro ao atualizar status da waitlist no Supabase:', e)
      }
    }

    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlist.value))
    } catch (e) {}
  }

  async function promoteAthleteToConfirmed(waitlistAthlete) {
    staffError.value = null

    // 1. Cadastra nos atletas confirmados
    const newAthlete = await addAthleteManual({
      name: waitlistAthlete.name,
      nickname: waitlistAthlete.nickname,
      phone: waitlistAthlete.phone,
      modality: waitlistAthlete.modality,
      drinksBeer: waitlistAthlete.drinksBeer
    })

    // 2. Atualiza o status na lista de espera para 'registered'
    await updateWaitlistStatus(waitlistAthlete.id, 'registered')

    return newAthlete
  }

  async function deleteWaitlist(waitlistId, confirmationPin) {
    if (!verifyAdminPassword(confirmationPin)) {
      throw new Error('Senha de administrador incorreta!')
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('athlete_waitlist')
        .delete()
        .eq('id', waitlistId)
    }

    waitlist.value = waitlist.value.filter(w => w.id !== waitlistId)
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlist.value))
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // PROPOSTAS DE PATROCÍNIO
  // --------------------------------------------------------------------------
  // Status definidos pelo usuário:
  // - pending: Aguardando contato / Análise
  // - approved: Aprovado (Aguardando Pagamento / Envio de Material)
  // - finished: Concluído / Patrocínio Fechado
  // - rejected: Recusado
  async function fetchProposals() {
    isLoading.value = true
    staffError.value = null

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sponsorship_proposals')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        proposals.value = (data || []).map(row => ({
          id: row.id,
          companyName: row.company_name,
          contactName: row.contact_name,
          phone: row.phone,
          websiteInstagram: row.website_instagram,
          sponsorshipType: row.sponsorship_type,
          amount: row.amount,
          itemsDescription: row.items_description,
          activations: Array.isArray(row.activations) ? row.activations : [],
          notes: row.notes,
          logoUrl: row.logo_url,
          status: row.status || 'pending',
          createdAt: row.created_at
        }))
        return
      } catch (err) {
        console.warn('Erro ao buscar propostas do Supabase, buscando local:', err)
      } finally {
        isLoading.value = false
      }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(PROPOSALS_STORAGE_KEY) || '[]')
      proposals.value = saved.map(p => ({
        id: p.id,
        companyName: p.company_name || p.companyName,
        contactName: p.contact_name || p.contactName,
        phone: p.phone,
        websiteInstagram: p.website_instagram || p.websiteInstagram,
        sponsorshipType: p.sponsorship_type || p.sponsorshipType,
        amount: p.amount,
        itemsDescription: p.items_description || p.itemsDescription,
        activations: p.activations || [],
        notes: p.notes,
        logoUrl: p.logo_url || p.logoUrl,
        status: p.status || 'pending',
        createdAt: p.created_at || p.createdAt || new Date().toISOString()
      }))
    } catch (e) {
      proposals.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function updateProposalStatus(proposalId, newStatus) {
    const item = proposals.value.find(p => p.id === proposalId)
    if (item) {
      item.status = newStatus
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('sponsorship_proposals')
          .update({ status: newStatus })
          .eq('id', proposalId)
      } catch (e) {
        console.warn('Erro ao atualizar status de patrocínio no Supabase:', e)
      }
    }

    try {
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals.value))
    } catch (e) {}
  }

  async function deleteProposal(proposalId, confirmationPin) {
    if (!verifyAdminPassword(confirmationPin)) {
      throw new Error('Senha de administrador incorreta!')
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('sponsorship_proposals')
        .delete()
        .eq('id', proposalId)
    }

    proposals.value = proposals.value.filter(p => p.id !== proposalId)
    try {
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals.value))
    } catch (e) {}
  }

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

    const text = `Olá, ${athlete.name}! 🍻🏃‍♂️\n\nAqui é da organização da *Beer Run dos Gordos*!\nConfirmamos sua inscrição para a nossa corrida cervejeira oficial.\n\nFique atento aos nossos canais para informações sobre retirada de kit e horários da largada. Nos vemos na pista (e no chopp)!`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  function getWaitlistWhatsAppLink(athlete, position) {
    const phone = sanitizePhoneForWhatsApp(athlete.phone)
    if (!phone) return null

    const text = `Fala, ${athlete.name}! 🍻🏃‍♂️\n\nBoas notícias da equipe da *Beer Run dos Gordos*!\nUma vaga foi liberada e você é o próximo da nossa Lista de Espera (posição #${position || 1}).\n\nVocê tem interesse em confirmar sua participação e garantir seu kit? Por favor, nos responda nesta mensagem para realizarmos sua inscrição!`
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
    const headers = ['Posicao', 'Nome', 'Apelido', 'Telefone', 'Modalidade', 'Bebe Cerveja', 'Check-in Realizado', 'Data Inscricao']
    const rows = athletes.value.map((a, i) => [
      i + 1,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${(a.nickname || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      a.modality === 'caminhada' ? 'Caminhada' : 'Corrida',
      a.drinksBeer ? 'Sim' : 'Nao',
      a.isCheckedIn ? 'Sim' : 'Nao',
      a.createdAt ? new Date(a.createdAt).toLocaleString('pt-BR') : ''
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
    isAuthenticated,
    waitlist,
    proposals,
    isLoading,
    staffError,
    maxAthletes: MAX_ATHLETES,
    login,
    logout,
    verifyAdminPassword,
    deleteAthlete,
    addAthleteManual,
    toggleCheckIn,
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
