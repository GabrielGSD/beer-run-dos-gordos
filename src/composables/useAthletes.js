import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

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

// Limite máximo de participantes da prova
export const MAX_ATHLETES = 70

// Mock inicial de fallback caso o Supabase não esteja configurado ainda
const INITIAL_ATHLETES = [
  { id: 1, name: 'Gabriel Silva', nickname: 'Fundador', displayName: 'Gabriel "Fundador" Silva', modality: 'corrida', drinksBeer: true, createdAt: '2026-09-01' },
  { id: 2, name: 'Lucas Rocha', nickname: 'Mestre Cervejeiro', displayName: 'Lucas "Mestre Cervejeiro" Rocha', modality: 'corrida', drinksBeer: true, createdAt: '2026-09-02' },
  { id: 3, name: 'Renata Martins', nickname: 'Pace de Boteco', displayName: 'Renata "Pace de Boteco" Martins', modality: 'caminhada', drinksBeer: true, createdAt: '2026-09-03' },
  { id: 4, name: 'Bruno Costa', nickname: 'Pangaré Veloz', displayName: 'Bruno "Pangaré Veloz" Costa', modality: 'corrida', drinksBeer: false, createdAt: '2026-09-03' },
  { id: 5, name: 'Carla Mendonça', nickname: 'Hidratação Constante', displayName: 'Carla "Hidratação Constante" Mendonça', modality: 'caminhada', drinksBeer: true, createdAt: '2026-09-04' },
  { id: 6, name: 'Thiago Santos', nickname: 'Chopp Gelado', displayName: 'Thiago "Chopp Gelado" Santos', modality: 'corrida', drinksBeer: true, createdAt: '2026-09-05' },
  { id: 7, name: 'Rodrigo Oliveira', nickname: 'Gordo Raiz', displayName: 'Rodrigo "Gordo Raiz" Oliveira', modality: 'caminhada', drinksBeer: true, createdAt: '2026-09-05' },
  { id: 8, name: 'Aline Souza', nickname: 'Sprint Final', displayName: 'Aline "Sprint Final" Souza', modality: 'corrida', drinksBeer: false, createdAt: '2026-09-06' },
  { id: 9, name: 'Felipe Barbosa', nickname: 'Copo Sempre Cheio', displayName: 'Felipe "Copo Sempre Cheio" Barbosa', modality: 'corrida', drinksBeer: true, createdAt: '2026-09-07' },
  { id: 10, name: 'Juliana Dias', nickname: 'Resenha Garantida', displayName: 'Juliana "Resenha Garantida" Dias', modality: 'caminhada', drinksBeer: true, createdAt: '2026-09-07' },
  { id: 11, name: 'Mateus Lima', nickname: 'Caneca Pesada', displayName: 'Mateus "Caneca Pesada" Lima', modality: 'corrida', drinksBeer: true, createdAt: '2026-09-08' },
  { id: 12, name: 'Beatriz Ferreira', nickname: 'Pelo Churrasco', displayName: 'Beatriz "Pelo Churrasco" Ferreira', modality: 'caminhada', drinksBeer: true, createdAt: '2026-09-08' }
]

const STORAGE_KEY = 'beer_run_confirmed_athletes'

function loadSavedLocalAthletes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(a => ({
          ...a,
          displayName: a.displayName || formatAthleteDisplayName(a.name, a.nickname)
        }))
      }
    }
  } catch (e) {
    console.error('Erro ao ler atletas do localStorage:', e)
  }
  return INITIAL_ATHLETES
}

function mapDatabaseAthlete(row) {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname || '',
    displayName: formatAthleteDisplayName(row.name, row.nickname),
    phone: row.phone || '',
    modality: row.modality || 'corrida',
    drinksBeer: Boolean(row.drinks_beer),
    createdAt: row.created_at || new Date().toISOString()
  }
}

// Estado singleton compartilhado
const athletes = ref(isSupabaseConfigured ? [] : loadSavedLocalAthletes())
const waitlistCount = ref(0)
const loading = ref(false)
const error = ref(null)
let realtimeChannel = null
let waitlistRealtimeChannel = null

function loadLocalWaitlistCount() {
  try {
    const saved = JSON.parse(localStorage.getItem('beer_run_athlete_waitlist') || '[]')
    return Array.isArray(saved) ? saved.length : 0
  } catch (e) {
    return 0
  }
}

export function useAthletes() {
  const totalAthletes = computed(() => athletes.value.length)
  const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
  const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)
  const isSoldOut = computed(() => athletes.value.length >= MAX_ATHLETES)
  const remainingSpots = computed(() => Math.max(0, MAX_ATHLETES - athletes.value.length))

  // Configura a escuta em tempo real (Realtime) do Supabase para atletas e lista de espera
  function setupRealtimeListener() {
    if (!supabase) return

    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('public:athletes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'athletes' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newAthlete = mapDatabaseAthlete(payload.new)
              const exists = athletes.value.some(a => a.id === newAthlete.id)
              if (!exists) {
                athletes.value.unshift(newAthlete)
              }
            } else if (payload.eventType === 'DELETE') {
              athletes.value = athletes.value.filter(a => a.id !== payload.old.id)
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapDatabaseAthlete(payload.new)
              const index = athletes.value.findIndex(a => a.id === updated.id)
              if (index !== -1) {
                athletes.value[index] = updated
              }
            }
          }
        )
        .subscribe()
    }

    if (!waitlistRealtimeChannel) {
      waitlistRealtimeChannel = supabase
        .channel('public:athlete_waitlist')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'athlete_waitlist' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              waitlistCount.value++
            } else if (payload.eventType === 'DELETE') {
              waitlistCount.value = Math.max(0, waitlistCount.value - 1)
            }
          }
        )
        .subscribe()
    }
  }

  // Busca contagem da lista de espera
  async function fetchWaitlistCount() {
    if (!isSupabaseConfigured || !supabase) {
      waitlistCount.value = loadLocalWaitlistCount()
      return
    }

    try {
      const { count, error: countErr } = await supabase
        .from('athlete_waitlist')
        .select('*', { count: 'exact', head: true })

      if (!countErr && count !== null) {
        waitlistCount.value = count
      } else {
        waitlistCount.value = loadLocalWaitlistCount()
      }
    } catch (e) {
      waitlistCount.value = loadLocalWaitlistCount()
    }
  }

  // Busca a lista de atletas do Supabase
  async function fetchAthletes() {
    fetchWaitlistCount()

    if (!isSupabaseConfigured) {
      if (athletes.value.length === 0) {
        athletes.value = loadSavedLocalAthletes()
      }
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: sbError } = await supabase
        .from('athletes')
        .select('*')
        .order('created_at', { ascending: false })

      if (sbError) throw sbError

      athletes.value = (data || []).map(mapDatabaseAthlete)
      setupRealtimeListener()
    } catch (err) {
      console.error('Erro ao buscar atletas do Supabase:', err)
      error.value = err.message || 'Erro ao carregar lista de atletas'
      if (athletes.value.length === 0) {
        athletes.value = loadSavedLocalAthletes()
      }
    } finally {
      loading.value = false
    }
  }

  // Cadastra um novo atleta garantindo limite de 80 e número de celular único
  async function addAthlete({ name, nickname, phone, modality, drinksBeer }) {
    error.value = null
    const cleanInputPhone = (phone || '').trim()
    const cleanDigits = cleanInputPhone.replace(/\D/g, '')

    if (!cleanDigits || cleanDigits.length < 10) {
      const err = new Error('Por favor, informe um número de celular/WhatsApp válido com DDD.')
      error.value = err.message
      throw err
    }

    // 1. Verificação de limite máximo de 80 pessoas
    if (athletes.value.length >= MAX_ATHLETES) {
      const limitErr = new Error(`Inscrições encerradas! Atingimos o limite máximo de ${MAX_ATHLETES} participantes.`)
      error.value = limitErr.message
      throw limitErr
    }

    if (isSupabaseConfigured && supabase) {
      // 2. Verificação de contagem no Supabase para evitar ultrapassar 80 participantes
      const { count, error: countError } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })

      if (!countError && count !== null && count >= MAX_ATHLETES) {
        const limitErr = new Error(`Inscrições encerradas! O limite de ${MAX_ATHLETES} atletas foi atingido agora.`)
        error.value = limitErr.message
        throw limitErr
      }

      // 3. Verificação prévia no Supabase para evitar duplicidade
      const { data: existingAthlete, error: checkError } = await supabase
        .from('athletes')
        .select('id')
        .eq('phone', cleanInputPhone)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Aviso na verificação de telefone:', checkError)
      }

      if (existingAthlete) {
        const duplicateErr = new Error('Este número de celular (WhatsApp) já está cadastrado em outra inscrição!')
        duplicateErr.code = '23505'
        error.value = duplicateErr.message
        throw duplicateErr
      }

      // 4. Inserção no banco
      const { data, error: sbError } = await supabase
        .from('athletes')
        .insert([{
          name: name.trim(),
          nickname: nickname?.trim() || null,
          phone: cleanInputPhone,
          modality: modality || 'corrida',
          drinks_beer: Boolean(drinksBeer)
        }])
        .select()
        .single()

      if (sbError) {
        console.error('Erro ao cadastrar atleta no Supabase:', sbError)
        if (sbError.code === '23505' || sbError.message?.toLowerCase().includes('unique')) {
          const duplicateErr = new Error('Este número de celular (WhatsApp) já está cadastrado em outra inscrição!')
          duplicateErr.code = '23505'
          error.value = duplicateErr.message
          throw duplicateErr
        }
        throw sbError
      }

      const newAthlete = mapDatabaseAthlete(data)
      const exists = athletes.value.some(a => a.id === newAthlete.id)
      if (!exists) {
        athletes.value.unshift(newAthlete)
      }
      return newAthlete
    }

    // Fallback para localStorage (modo offline / sem Supabase configurado)
    const isDuplicate = athletes.value.some(a => {
      const existingDigits = (a.phone || '').replace(/\D/g, '')
      return existingDigits === cleanDigits
    })

    if (isDuplicate) {
      const duplicateErr = new Error('Este número de celular (WhatsApp) já está cadastrado em outra inscrição!')
      duplicateErr.code = '23505'
      error.value = duplicateErr.message
      throw duplicateErr
    }

    const formattedDisplay = formatAthleteDisplayName(name, nickname)
    const newAthlete = {
      id: Date.now(),
      name: name.trim(),
      nickname: nickname?.trim() || '',
      displayName: formattedDisplay,
      phone: cleanInputPhone,
      modality: modality || 'corrida',
      drinksBeer: Boolean(drinksBeer),
      createdAt: new Date().toISOString()
    }

    athletes.value.unshift(newAthlete)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e)
    }

    return newAthlete
  }

  // Cadastra um atleta na lista de espera (quando as 70 vagas estiverem esgotadas)
  async function addToWaitlist({ name, nickname, phone, modality, drinksBeer }) {
    error.value = null
    const cleanInputPhone = (phone || '').trim()
    const cleanDigits = cleanInputPhone.replace(/\D/g, '')

    if (!cleanDigits || cleanDigits.length < 10) {
      const err = new Error('Por favor, informe um número de celular/WhatsApp válido com DDD.')
      error.value = err.message
      throw err
    }

    const waitlistRecord = {
      name: name.trim(),
      nickname: nickname?.trim() || null,
      phone: cleanInputPhone,
      modality: modality || 'corrida',
      drinks_beer: Boolean(drinksBeer),
      status: 'waiting',
      created_at: new Date().toISOString()
    }

    let position = waitlistCount.value + 1

    if (isSupabaseConfigured && supabase) {
      const { data, error: sbError } = await supabase
        .from('athlete_waitlist')
        .insert([waitlistRecord])
        .select()
        .single()

      if (sbError) {
        console.warn('Aviso no Supabase athlete_waitlist, salvando localmente:', sbError.message)
      } else {
        const { count } = await supabase
          .from('athlete_waitlist')
          .select('*', { count: 'exact', head: true })
        if (count !== null) {
          waitlistCount.value = count
          position = count
        } else {
          waitlistCount.value++
          position = waitlistCount.value
        }
      }
    }

    // Fallback de segurança no localStorage
    const WAITLIST_STORAGE_KEY = 'beer_run_athlete_waitlist'
    try {
      const saved = JSON.parse(localStorage.getItem(WAITLIST_STORAGE_KEY) || '[]')
      saved.push({
        id: Date.now(),
        ...waitlistRecord,
        displayName: formatAthleteDisplayName(name, nickname)
      })
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(saved))
      if (!isSupabaseConfigured || !supabase) {
        waitlistCount.value = saved.length
        position = saved.length
      }
    } catch (e) {
      console.warn('Aviso ao salvar waitlist localmente:', e)
    }

    return {
      success: true,
      name: name.trim(),
      phone: cleanInputPhone,
      position: position
    }
  }

  return {
    athletes,
    loading,
    error,
    isSupabaseConfigured,
    totalAthletes,
    drinkersCount,
    nonDrinkersCount,
    isSoldOut,
    remainingSpots,
    waitlistCount,
    maxAthletes: MAX_ATHLETES,
    fetchAthletes,
    fetchWaitlistCount,
    addAthlete,
    addToWaitlist,
    formatAthleteDisplayName
  }
}
