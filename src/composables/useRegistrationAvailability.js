import { computed, shallowRef } from 'vue'
import { usePublicAthletes } from './usePublicAthletes.js'

export const TOTAL_REGISTRATION_CAPACITY = 100
// Rejeicoes do backend continuam respeitadas, mesmo antes do limite visual.
const rejectedCategories = shallowRef({})

export function useRegistrationAvailability() {
  const { summary, loading, error, refresh } = usePublicAthletes()
  const availability = computed(() => {
    if (!summary.value) return null
    const total = summary.value.total // A lista publica ja inclui Adulto + Kids confirmados.
    const remaining = Math.max(0, TOTAL_REGISTRATION_CAPACITY - total)
    const soldOut = total >= TOTAL_REGISTRATION_CAPACITY
    const category = key => ({ enabled: true, capacity: TOTAL_REGISTRATION_CAPACITY, remaining,
      soldOut: soldOut || rejectedCategories.value[key] === summary.value })
    return { total, capacity: TOTAL_REGISTRATION_CAPACITY, remaining, soldOut, adult: category('adult'), kids: category('kids') }
  })
  const canRegister = category => !error.value && !!availability.value && !availability.value[category].soldOut
  const registrationsClosed = computed(() => !!availability.value && !error.value && !canRegister('adult') && !canRegister('kids'))
  const registrationLabel = (normal = 'INSCREVA-SE AGORA') => {
    if (registrationsClosed.value) return 'VAGAS ESGOTADAS'
    if (availability.value && !error.value && !canRegister('adult') && canRegister('kids')) return 'INSCREVA-SE NO KIDS'
    return normal
  }
  const markSoldOut = category => { rejectedCategories.value = { ...rejectedCategories.value, [category]: summary.value } }
  const availabilityError = computed(() => error.value ? 'Não foi possível consultar os atletas confirmados agora. Tente novamente.' : '')
  return { availability, availabilityError, availabilityLoading: loading, canRegister, registrationsClosed,
    registrationLabel, refreshAvailability: refresh, markSoldOut }
}
