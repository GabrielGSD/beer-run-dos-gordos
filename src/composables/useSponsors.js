import { ref, computed } from 'vue'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { publicRequest } from '../services/public-api.js'
import { staffRequest, staffMutation, onStaffReset } from '../services/staff-api.js'

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

const sponsors = ref([...DEFAULT_SPONSORS])
const staffSponsors = ref([])
const loading = ref(false)
const error = ref(null)
onStaffReset(() => { staffSponsors.value = [] })
export function useSponsors() {
  const activeSponsors = computed(() => sponsors.value.filter(s => s.isActive).sort((a,b) => a.displayOrder - b.displayOrder))
  const allSponsors = computed(() => staffSponsors.value.slice().sort((a,b) => a.displayOrder - b.displayOrder))
  async function fetchSponsors() {
    loading.value = true
    try { const { rows } = await publicRequest('sponsors'); sponsors.value = rows.length ? rows.map(mapDatabaseSponsor) : [...DEFAULT_SPONSORS]; error.value = null }
    catch (err) { error.value = err.message }
    finally { loading.value = false }
  }
  async function fetchStaffSponsors() {
    try { const { rows } = await staffRequest('sponsors'); staffSponsors.value = rows.map(mapDatabaseSponsor) }
    catch (err) { staffSponsors.value = []; throw err }
  }
  async function addSponsor({ name, logo, link, displayOrder, isActive = true }) {
    await staffMutation('sponsor.add', null, { name: (name || '').trim(), logo_url: logo || '', website_url: link || null, display_order: displayOrder ?? staffSponsors.value.length + 1, is_active: isActive })
    await fetchStaffSponsors()
  }
  async function publishProposalToSponsors(proposal) {
    await staffMutation('proposal.publish', proposal.id); await fetchStaffSponsors()
  }
  async function toggleSponsorActive(id, isActive) { await staffMutation('sponsor.active', id, { is_active: isActive }); await fetchStaffSponsors() }
  async function deleteSponsor(id, pin) { await staffMutation('sponsor.delete', id, undefined, pin); await fetchStaffSponsors() }
  return { sponsors: activeSponsors, allSponsors, loading, error, isSupabaseConfigured, fetchSponsors, fetchStaffSponsors, addSponsor, publishProposalToSponsors, toggleSponsorActive, deleteSponsor }
}
