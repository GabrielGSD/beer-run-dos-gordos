import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const LOCAL_STORAGE_SPONSORS_KEY = 'beer_run_sponsors_list'

// Lista inicial de fallback (usada se o Supabase não estiver configurado ou caso a tabela esteja vazia)
const DEFAULT_SPONSORS = [
  {
    id: 'default-1',
    name: 'Delícias da Vó Cila',
    logo: '/images/logo_quitanda.png',
    link: null,
    displayOrder: 1,
    isActive: true
  },
  {
    id: 'default-2',
    name: 'Padaria Santa Rita',
    logo: '/images/logo_padaria.png',
    link: null,
    displayOrder: 2,
    isActive: true
  },
  {
    id: 'default-3',
    name: 'MM Decorações',
    logo: '/images/logo_mmdecoracoes.png',
    link: null,
    displayOrder: 3,
    isActive: true
  },
  {
    id: 'default-4',
    name: 'Felipe Montagens',
    logo: '/images/logo_gordinho.png',
    link: null,
    displayOrder: 4,
    isActive: true
  },
  {
    id: 'default-5',
    name: 'Omna Tech',
    logo: '/images/logo_omna.png',
    link: null,
    displayOrder: 5,
    isActive: true
  },
  {
    id: 'default-6',
    name: 'Gran Minas',
    logo: '/images/logo_granminas.png',
    link: null,
    displayOrder: 6,
    isActive: true
  }
]

function loadCachedSponsors() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SPONSORS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {}
  return [...DEFAULT_SPONSORS]
}

function saveCachedSponsors(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SPONSORS_KEY, JSON.stringify(list))
  } catch (e) {}
}

function mapDatabaseSponsor(row) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo_url || row.logo || '',
    link: row.website_url || row.link || null,
    displayOrder: row.display_order ?? row.order_index ?? row.order ?? 0,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    createdAt: row.created_at || new Date().toISOString()
  }
}

// Estado singleton compartilhado
const sponsors = ref(loadCachedSponsors())
const loading = ref(false)
const error = ref(null)
let realtimeChannel = null

export function useSponsors() {
  // Patrocinadores ativos ordenados para a Landing Page
  const activeSponsors = computed(() => {
    return sponsors.value
      .filter(s => s.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  })

  // Todos os patrocinadores para o Painel da Staff
  const allSponsors = computed(() => {
    return sponsors.value.slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  })

  // Escuta alterações em tempo real no Supabase
  function setupRealtimeListener() {
    if (!supabase || realtimeChannel) return

    realtimeChannel = supabase
      .channel('public:sponsors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sponsors' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSponsor = mapDatabaseSponsor(payload.new)
            const exists = sponsors.value.some(s => s.id === newSponsor.id)
            if (!exists) {
              sponsors.value.push(newSponsor)
              saveCachedSponsors(sponsors.value)
            }
          } else if (payload.eventType === 'DELETE') {
            sponsors.value = sponsors.value.filter(s => s.id !== payload.old.id)
            saveCachedSponsors(sponsors.value)
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDatabaseSponsor(payload.new)
            const index = sponsors.value.findIndex(s => s.id === updated.id)
            if (index !== -1) {
              sponsors.value[index] = updated
            } else {
              sponsors.value.push(updated)
            }
            saveCachedSponsors(sponsors.value)
          }
        }
      )
      .subscribe()
  }

  // Busca patrocinadores da tabela 'sponsors' do Supabase
  async function fetchSponsors() {
    if (!isSupabaseConfigured || !supabase) {
      if (sponsors.value.length === 0) {
        sponsors.value = loadCachedSponsors()
      }
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: sbError } = await supabase
        .from('sponsors')
        .select('*')
        .order('display_order', { ascending: true })

      if (sbError) throw sbError

      if (data && data.length > 0) {
        sponsors.value = data.map(mapDatabaseSponsor)
        saveCachedSponsors(sponsors.value)
      } else {
        if (sponsors.value.length === 0) {
          sponsors.value = [...DEFAULT_SPONSORS]
        }
      }

      setupRealtimeListener()
    } catch (err) {
      console.warn('Aviso ao carregar patrocinadores do Supabase:', err.message)
      error.value = err.message
      if (sponsors.value.length === 0) {
        sponsors.value = loadCachedSponsors()
      }
    } finally {
      loading.value = false
    }
  }

  // Adiciona patrocinador oficial
  async function addSponsor({ name, logo, link, displayOrder, isActive = true }) {
    const payload = {
      name: (name || '').trim(),
      logo_url: logo || '',
      website_url: link ? link.trim() : null,
      display_order: displayOrder !== undefined ? displayOrder : sponsors.value.length + 1,
      is_active: Boolean(isActive)
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error: sbError } = await supabase
        .from('sponsors')
        .insert([payload])
        .select()
        .single()

      if (sbError) {
        console.error('Erro ao adicionar sponsor no Supabase:', sbError)
        throw sbError
      }

      const created = mapDatabaseSponsor(data)
      sponsors.value.push(created)
      saveCachedSponsors(sponsors.value)
      return created
    }

    const localItem = {
      id: 'local-' + Date.now(),
      name: payload.name,
      logo: payload.logo_url,
      link: payload.website_url,
      displayOrder: payload.display_order,
      isActive: payload.is_active,
      createdAt: new Date().toISOString()
    }
    sponsors.value.push(localItem)
    saveCachedSponsors(sponsors.value)
    return localItem
  }

  // Promove / Publica proposta concluída diretamente para a tabela de sponsors
  async function publishProposalToSponsors(proposal) {
    if (!proposal || !proposal.companyName) return null

    const existingIndex = sponsors.value.findIndex(
      s => s.name.trim().toLowerCase() === proposal.companyName.trim().toLowerCase()
    )

    let finalLogo = proposal.logoUrl || ''
    let finalLink = proposal.websiteInstagram || null

    if (existingIndex !== -1) {
      const existing = sponsors.value[existingIndex]
      const updatedItem = {
        ...existing,
        isActive: true,
        logo: finalLogo || existing.logo,
        link: finalLink || existing.link
      }

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('sponsors')
            .update({
              is_active: true,
              logo_url: updatedItem.logo,
              website_url: updatedItem.link
            })
            .eq('id', existing.id)
        } catch (e) {
          console.warn('Aviso ao atualizar sponsor existente no Supabase:', e)
        }
      }

      sponsors.value[existingIndex] = updatedItem
      saveCachedSponsors(sponsors.value)
      return updatedItem
    }

    return await addSponsor({
      name: proposal.companyName,
      logo: finalLogo,
      link: finalLink,
      displayOrder: sponsors.value.length + 1,
      isActive: true
    })
  }

  // Alterna ativação de um patrocinador no site
  async function toggleSponsorActive(sponsorId, isActive) {
    const item = sponsors.value.find(s => s.id === sponsorId)
    if (item) {
      item.isActive = isActive
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('sponsors')
          .update({ is_active: isActive })
          .eq('id', sponsorId)
      } catch (e) {
        console.warn('Aviso ao alterar status do patrocinador no Supabase:', e)
      }
    }

    saveCachedSponsors(sponsors.value)
  }

  // Remove um patrocinador
  async function deleteSponsor(sponsorId) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('sponsors')
          .delete()
          .eq('id', sponsorId)
      } catch (e) {
        console.error('Erro ao deletar patrocinador no Supabase:', e)
      }
    }

    sponsors.value = sponsors.value.filter(s => s.id !== sponsorId)
    saveCachedSponsors(sponsors.value)
  }

  return {
    sponsors: activeSponsors,
    allSponsors,
    loading,
    error,
    isSupabaseConfigured,
    fetchSponsors,
    addSponsor,
    publishProposalToSponsors,
    toggleSponsorActive,
    deleteSponsor
  }
}
