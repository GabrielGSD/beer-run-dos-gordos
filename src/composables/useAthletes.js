import { ref, computed } from 'vue'
import { publicRequest } from '../services/public-api.js'

export function formatAthleteDisplayName(name, nickname) {
  if (!name) return ''
  if (name.includes('"')) return name
  if (!nickname || !nickname.trim()) return name.trim()

  const cleanNick = nickname.trim().replace(/^["']|["']$/g, '')
  const parts = name.trim().split(/\s+/)
  if (parts.length > 1) {
    const first = parts[0]
    const rest = parts.slice(1).join(' ')
    return `${first} "${cleanNick}" ${rest}`
  }
  return `${name.trim()} "${cleanNick}"`
}

export const MAX_ATHLETES = 71
export function mapDatabaseAthlete(row) {
  const isOfficial = Boolean(row.accepted_terms_at && (row.shirt_size || row.cpf || row.modality === 'kids'))
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname || '',
    displayName: formatAthleteDisplayName(row.name, row.nickname),
    phone: row.guardian_phone || row.phone || '',
    guardianName: row.guardian_name || '',
    guardianRelationship: row.guardian_relationship || '',
    cpf: row.cpf || '',
    birthDate: row.birth_date || '',
    gender: row.gender || '',
    email: row.email || '',
    cityState: row.city_state || '',
    emergencyContactName: row.emergency_contact_name || '',
    emergencyContactPhone: row.emergency_contact_phone || '',
    shirtModel: row.shirt_model || '',
    shirtSize: ['1 Carne + 1 Frango', '2 Carne', '2 Frango', 'Vegetariano'].includes(row.shirt_size) ? '' : (row.shirt_size || ''),
    skewerChoice: row.skewer_choice || (['1 Carne + 1 Frango', '2 Carne', '2 Frango', 'Vegetariano'].includes(row.shirt_size) ? row.shirt_size : ''),
    medicalNotes: row.medical_notes || '',
    acceptedTermsAt: row.accepted_terms_at || null,
    registrationType: isOfficial ? (row.registration_type || 'official') : 'pre_registration',
    paymentStatus: row.payment_status || (row.accepted_terms_at ? 'pending_payment' : null),
    isCheckedIn: Boolean(row.is_checked_in),
    checkedInAt: row.checked_in_at || null,
    modality: row.modality || 'corrida',
    drinksBeer: Boolean(row.drinks_beer),
    createdAt: row.created_at || new Date().toISOString()
  }
}


const athletes = ref([])
const total = ref(0)
const waitlistCount = ref(0)
const loading = ref(false)
const error = ref(null)
export function useAthletes() {
  const totalAthletes = computed(() => total.value)
  const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
  const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)
  const isSoldOut = computed(() => total.value >= MAX_ATHLETES)
  const remainingSpots = computed(() => Math.max(0, MAX_ATHLETES - total.value))
  async function fetchAthletes() {
    loading.value = true
    try {
      const data = await publicRequest('athletes')
      athletes.value = data.athletes.map(a => ({ ...a, displayName: formatAthleteDisplayName(a.name, a.nickname) }))
      total.value = data.summary.total + data.summary.preRegisteredCount
      waitlistCount.value = data.summary.waitlistCount
      error.value = null
    } catch (err) { error.value = err.message }
    finally { loading.value = false }
  }
  async function fetchWaitlistCount() {
    const data = await publicRequest('waitlist/count'); waitlistCount.value = data.count
  }
  async function addToWaitlist({ name, nickname, phone, modality, drinksBeer }) {
    const data = await publicRequest('waitlist', { name: name.trim(), nickname: nickname?.trim() || null, phone: phone.trim(), modality: modality || 'corrida', drinks_beer: Boolean(drinksBeer) })
    waitlistCount.value = data.position
    return { ...data, name: name.trim(), phone: phone.trim() }
  }
  // Rascunho local; dados pessoais seguem para o backend ao confirmar.
  async function saveAthleteDraft(athleteId, phone, draftData) {
    if (!phone) return
    const cleanPhoneDigits = phone.replace(/\D/g, '')
    const draftKey = `beer_run_draft_${cleanPhoneDigits}`

    // 1. Salva no cache local com timestamp
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          currentStep: draftData.currentStep || 1,
          form: draftData.form || {},
          updatedAt: new Date().toISOString()
        })
      )
    } catch (e) {
      console.warn('Erro ao salvar rascunho no localStorage:', e)
    }

  }

  function loadAthleteDraft(phone) {
    if (!phone) return null
    const cleanPhoneDigits = phone.replace(/\D/g, '')
    try {
      const item = localStorage.getItem(`beer_run_draft_${cleanPhoneDigits}`)
      return item ? JSON.parse(item) : null
    } catch (e) {
      return null
    }
  }

  // Limpa o rascunho do atleta após finalização
  function clearAthleteDraft(phone) {
    if (!phone) return
    const cleanPhoneDigits = phone.replace(/\D/g, '')
    try {
      localStorage.removeItem(`beer_run_draft_${cleanPhoneDigits}`)
    } catch (e) {}
  }

  return { athletes, loading, error, totalAthletes, drinkersCount, nonDrinkersCount, isSoldOut, remainingSpots, waitlistCount, maxAthletes: MAX_ATHLETES, fetchAthletes, fetchWaitlistCount, addToWaitlist, formatAthleteDisplayName, saveAthleteDraft, loadAthleteDraft, clearAthleteDraft }
}
