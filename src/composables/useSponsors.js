import { ref, computed, onMounted } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

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
const sponsors = ref([...DEFAULT_SPONSORS])
const loading = ref(false)
const error = ref(null)
let realtimeChannel = null

export function useSponsors() {
  const activeSponsors = computed(() => {
    return sponsors.value
      .filter(s => s.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  })

  // Escuta alterações em tempo real no Supabase (inserir, atualizar, remover patrocinador)
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
            }
          } else if (payload.eventType === 'DELETE') {
            sponsors.value = sponsors.value.filter(s => s.id !== payload.old.id)
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDatabaseSponsor(payload.new)
            const index = sponsors.value.findIndex(s => s.id === updated.id)
            if (index !== -1) {
              sponsors.value[index] = updated
            } else {
              sponsors.value.push(updated)
            }
          }
        }
      )
      .subscribe()
  }

  // Busca patrocinadores da tabela 'sponsors' do Supabase
  async function fetchSponsors() {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: sbError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (sbError) throw sbError

      if (data && data.length > 0) {
        sponsors.value = data.map(mapDatabaseSponsor)
      } else {
        // Se a tabela estiver vazia, mantém o fallback inicial
        sponsors.value = [...DEFAULT_SPONSORS]
      }

      setupRealtimeListener()
    } catch (err) {
      console.warn('Aviso: Não foi possível carregar patrocinadores do Supabase, usando lista padrão:', err.message)
      error.value = err.message
      // Mantém fallback
      if (sponsors.value.length === 0) {
        sponsors.value = [...DEFAULT_SPONSORS]
      }
    } finally {
      loading.value = false
    }
  }

  return {
    sponsors: activeSponsors,
    allSponsors: sponsors,
    loading,
    error,
    isSupabaseConfigured,
    fetchSponsors
  }
}
