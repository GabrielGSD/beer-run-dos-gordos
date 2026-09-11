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
const loading = ref(false)
const error = ref(null)
let realtimeChannel = null

export function useAthletes() {
  const totalAthletes = computed(() => athletes.value.length)
  const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
  const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)

  // Configura a escuta em tempo real (Realtime) do Supabase
  function setupRealtimeListener() {
    if (!supabase || realtimeChannel) return

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

  // Busca a lista de atletas do Supabase
  async function fetchAthletes() {
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

  // Cadastra um novo atleta garantindo número de celular único
  async function addAthlete({ name, nickname, phone, modality, drinksBeer }) {
    error.value = null
    const cleanInputPhone = (phone || '').trim()
    const cleanDigits = cleanInputPhone.replace(/\D/g, '')

    if (!cleanDigits || cleanDigits.length < 10) {
      const err = new Error('Por favor, informe um número de celular/WhatsApp válido com DDD.')
      error.value = err.message
      throw err
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Verificação prévia no Supabase para evitar duplicidade
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

      // 2. Inserção no banco
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

  return {
    athletes,
    loading,
    error,
    isSupabaseConfigured,
    totalAthletes,
    drinkersCount,
    nonDrinkersCount,
    fetchAthletes,
    addAthlete,
    formatAthleteDisplayName
  }
}
