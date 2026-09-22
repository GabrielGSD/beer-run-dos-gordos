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
  const isOfficial = Boolean(row.accepted_terms_at && (row.shirt_size || row.cpf))
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname || '',
    displayName: formatAthleteDisplayName(row.name, row.nickname),
    phone: row.phone || '',
    cpf: row.cpf || '',
    birthDate: row.birth_date || '',
    gender: row.gender || '',
    email: row.email || '',
    cityState: row.city_state || '',
    emergencyContactName: row.emergency_contact_name || '',
    emergencyContactPhone: row.emergency_contact_phone || '',
    shirtSize: row.shirt_size || '',
    skewerChoice: (row.shirt_size && !row.shirt_size.toLowerCase().includes('tradicional') && !row.shirt_size.toLowerCase().includes('baby look')) ? row.shirt_size : '1 Carne + 1 Frango',
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

  // Inscrição Oficial Completa (para atletas chamados da lista de espera e inscrições definitivas)
  async function registerOfficialAthlete({
    id,
    name,
    nickname,
    cpf,
    birthDate,
    gender,
    phone,
    email,
    cityState,
    emergencyContactName,
    emergencyContactPhone,
    modality,
    drinksBeer,
    skewerChoice,
    shirtSize,
    medicalNotes,
    acceptedTerms
  }) {
    error.value = null

    if (!name || !name.trim()) {
      throw new Error('Por favor, preencha o seu nome completo.')
    }

    const cleanCpfDigits = (cpf || '').replace(/\D/g, '')
    if (cleanCpfDigits.length !== 11) {
      throw new Error('Por favor, informe um CPF válido com 11 dígitos.')
    }

    const cleanPhone = (phone || '').trim()
    const cleanPhoneDigits = cleanPhone.replace(/\D/g, '')
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      throw new Error('Por favor, informe um número de celular/WhatsApp válido com DDD.')
    }

    if (!emergencyContactName || !emergencyContactName.trim()) {
      throw new Error('Por favor, informe o nome do contato de emergência.')
    }

    const cleanEmergPhoneDigits = (emergencyContactPhone || '').replace(/\D/g, '')
    if (!cleanEmergPhoneDigits || cleanEmergPhoneDigits.length < 10) {
      throw new Error('Por favor, informe o telefone/WhatsApp do contato de emergência com DDD.')
    }

    const finalSkewer = (skewerChoice || shirtSize || '1 Carne + 1 Frango').trim()
    if (!finalSkewer) {
      throw new Error('Por favor, selecione sua preferência para os 2 espetinhos da chegada.')
    }

    if (!acceptedTerms) {
      throw new Error('É obrigatório ler e concordar com os termos do regulamento da prova para prosseguir.')
    }

    const acceptedTermsAt = new Date().toISOString()
    const formattedDisplay = formatAthleteDisplayName(name, nickname)

    const fullPayload = {
      name: name.trim(),
      nickname: nickname?.trim() || null,
      cpf: cleanCpfDigits,
      birth_date: birthDate || null,
      gender: gender || null,
      phone: cleanPhone,
      email: email?.trim() || null,
      city_state: cityState?.trim() || null,
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_phone: emergencyContactPhone.trim(),
      modality: modality || 'corrida',
      drinks_beer: Boolean(drinksBeer),
      shirt_size: finalSkewer,
      medical_notes: medicalNotes?.trim() || null,
      accepted_terms_at: acceptedTermsAt,
      registration_type: 'official',
      payment_status: 'pending_payment'
    }

    let savedAthlete = null
    let targetAthleteId = id || null

    if (isSupabaseConfigured && supabase) {
      // 1. Se não recebeu ID direto, busca pelo telefone exato ou dígitos
      if (!targetAthleteId) {
        try {
          const { data: athletesData } = await supabase
            .from('athletes')
            .select('id, phone, name')

          if (athletesData && athletesData.length > 0) {
            const found = athletesData.find(a => {
              const digits = (a.phone || '').replace(/\D/g, '')
              return digits === cleanPhoneDigits || digits.slice(-9) === cleanPhoneDigits.slice(-9)
            })
            if (found) {
              targetAthleteId = found.id
            }
          }
        } catch (e) {
          console.warn('Erro ao buscar atleta existente:', e)
        }
      }

      try {
        if (targetAthleteId) {
          // Atualiza o registro existente com os dados oficiais completos
          const { data, error: updateErr } = await supabase
            .from('athletes')
            .update(fullPayload)
            .eq('id', targetAthleteId)
            .select()
            .single()

          if (!updateErr && data) {
            savedAthlete = mapDatabaseAthlete(data)
          } else {
            console.warn('Falha no update completo, tentando update básico:', updateErr)
            // Tenta fallback com colunas base caso o Supabase não tenha as novas colunas ainda
            const { data: basicData } = await supabase
              .from('athletes')
              .update({
                name: fullPayload.name,
                nickname: fullPayload.nickname,
                phone: fullPayload.phone,
                modality: fullPayload.modality,
                drinks_beer: fullPayload.drinks_beer
              })
              .eq('id', targetAthleteId)
              .select()
              .single()
            if (basicData) {
              savedAthlete = {
                ...mapDatabaseAthlete(basicData),
                id: targetAthleteId,
                cpf: cleanCpfDigits,
                birthDate,
                gender,
                email,
                cityState,
                emergencyContactName,
                emergencyContactPhone,
                shirtSize: finalSkewer,
                skewerChoice: finalSkewer,
                medicalNotes,
                acceptedTermsAt,
                registrationType: 'official',
                paymentStatus: 'pending_payment'
              }
            }
          }
        } else {
          // Insere novo atleta oficial
          const { data, error: insertErr } = await supabase
            .from('athletes')
            .insert([fullPayload])
            .select()
            .single()

          if (!insertErr && data) {
            savedAthlete = mapDatabaseAthlete(data)
          } else {
            console.warn('Aviso no insert completo do Supabase, tentando com colunas básicas:', insertErr)
            // Fallback de colunas básicas
            const { data: basicData, error: basicErr } = await supabase
              .from('athletes')
              .insert([{
                name: fullPayload.name,
                nickname: fullPayload.nickname,
                phone: fullPayload.phone,
                modality: fullPayload.modality,
                drinks_beer: fullPayload.drinks_beer
              }])
              .select()
              .single()

            if (basicErr) throw basicErr
            savedAthlete = {
              ...mapDatabaseAthlete(basicData),
              cpf: cleanCpfDigits,
              birthDate,
              gender,
              email,
              cityState,
              emergencyContactName,
              emergencyContactPhone,
              shirtSize: finalSkewer,
              skewerChoice: finalSkewer,
              medicalNotes,
              acceptedTermsAt,
              registrationType: 'official',
              paymentStatus: 'pending_payment'
            }
          }
        }

        // 2. Se o atleta estava na lista de espera, atualiza o status para 'registered'
        try {
          await supabase
            .from('athlete_waitlist')
            .update({ status: 'registered' })
            .eq('phone', cleanPhone)
        } catch (wErr) {
          console.warn('Aviso ao atualizar lista de espera:', wErr)
        }
      } catch (sbErr) {
        console.error('Erro na gravação oficial do Supabase:', sbErr)
        // Se der erro no Supabase, continua para garantir salvamento local
      }
    }

    // Se o Supabase não estiver configurado ou falhou, constrói o objeto local preservando o ID se existente
    if (!savedAthlete) {
      savedAthlete = {
        id: targetAthleteId || id || Date.now(),
        name: name.trim(),
        nickname: nickname?.trim() || '',
        displayName: formattedDisplay,
        cpf: cleanCpfDigits,
        birthDate: birthDate || '',
        gender: gender || '',
        phone: cleanPhone,
        email: email?.trim() || '',
        cityState: cityState?.trim() || '',
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        modality: modality || 'corrida',
        drinksBeer: Boolean(drinksBeer),
        shirtSize: finalSkewer,
        skewerChoice: finalSkewer,
        medicalNotes: medicalNotes?.trim() || '',
        acceptedTermsAt,
        registrationType: 'official',
        paymentStatus: 'pending_payment',
        createdAt: new Date().toISOString()
      }
    }

    // Atualiza a lista reativa em memória
    const existingIdx = athletes.value.findIndex(a => a.id === savedAthlete.id || (a.phone && a.phone.replace(/\D/g, '') === cleanPhoneDigits))
    if (existingIdx !== -1) {
      athletes.value[existingIdx] = { ...athletes.value[existingIdx], ...savedAthlete }
    } else {
      athletes.value.unshift(savedAthlete)
    }

    // Salva localmente com segurança
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e)
    }

    // Atualiza waitlist local se houver
    try {
      const waitlistLocal = JSON.parse(localStorage.getItem('beer_run_athlete_waitlist') || '[]')
      const waitItem = waitlistLocal.find(w => (w.phone || '').replace(/\D/g, '') === cleanPhoneDigits)
      if (waitItem) {
        waitItem.status = 'registered'
        localStorage.setItem('beer_run_athlete_waitlist', JSON.stringify(waitlistLocal))
      }
    } catch (e) {}

    return savedAthlete
  }

  // Atualiza o status de pagamento do atleta (ex: Staff aprovando para 'completed')
  async function updateAthletePaymentStatus(athleteId, paymentStatus) {
    const athlete = athletes.value.find(a => a.id === athleteId)
    if (athlete) {
      athlete.paymentStatus = paymentStatus
      if (paymentStatus === 'completed') {
        athlete.registrationType = 'official'
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updateData = {
          payment_status: paymentStatus
        }
        if (paymentStatus === 'completed') {
          updateData.registration_type = 'official'
        }
        const { error: sbErr } = await supabase
          .from('athletes')
          .update(updateData)
          .eq('id', athleteId)

        if (sbErr) {
          console.warn('Aviso no Supabase ao atualizar payment_status:', sbErr)
          if (paymentStatus === 'completed') {
            await supabase.from('athletes').update({ registration_type: 'official' }).eq('id', athleteId)
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar payment_status no Supabase:', e)
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {}

    return athlete
  }

  // Busca e valida um atleta na base pelo número de celular (na tabela athletes ou athlete_waitlist)
  async function findAthleteByPhone(inputPhone) {
    if (!inputPhone) return null
    let cleanDigits = inputPhone.replace(/\D/g, '')
    if (cleanDigits.startsWith('55') && cleanDigits.length > 11) {
      cleanDigits = cleanDigits.slice(2)
    }
    if (cleanDigits.length < 10) return null

    // 1. Tenta buscar no Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // Busca na tabela athletes
        const { data: athletesData } = await supabase
          .from('athletes')
          .select('*')

        if (athletesData && athletesData.length > 0) {
          const matched = athletesData.find(a => {
            const digits = (a.phone || '').replace(/\D/g, '')
            return digits === cleanDigits || digits.slice(-9) === cleanDigits.slice(-9)
          })
          if (matched) {
            const mapped = mapDatabaseAthlete(matched)
            // É considerado oficial APENAS se realmente aceitou os termos da prova
            const hasAcceptedTerms = Boolean(matched.accepted_terms_at)
            const isAlreadyOfficial = Boolean(hasAcceptedTerms && (matched.payment_status || matched.shirt_size || matched.cpf))
            return {
              ...mapped,
              isAlreadyOfficial,
              paymentStatus: mapped.paymentStatus || (isAlreadyOfficial ? 'pending_payment' : null)
            }
          }
        }

        // Busca na tabela athlete_waitlist
        const { data: waitlistData } = await supabase
          .from('athlete_waitlist')
          .select('*')

        if (waitlistData && waitlistData.length > 0) {
          const matchedW = waitlistData.find(w => {
            const digits = (w.phone || '').replace(/\D/g, '')
            return digits === cleanDigits || digits.slice(-9) === cleanDigits.slice(-9)
          })
          if (matchedW) {
            return {
              id: matchedW.id,
              name: matchedW.name,
              nickname: matchedW.nickname || '',
              displayName: formatAthleteDisplayName(matchedW.name, matchedW.nickname),
              phone: matchedW.phone,
              modality: matchedW.modality || 'corrida',
              drinksBeer: Boolean(matchedW.drinks_beer),
              isAlreadyOfficial: false,
              fromWaitlist: true
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar atleta no Supabase, verificando local:', err)
      }
    }

    // 2. Fallback no estado local e localStorage
    const localMatch = athletes.value.find(a => {
      const digits = (a.phone || '').replace(/\D/g, '')
      return digits === cleanDigits || digits.slice(-9) === cleanDigits.slice(-9)
    })
    if (localMatch) {
      const hasAcceptedTerms = Boolean(localMatch.acceptedTermsAt)
      const isAlreadyOfficial = Boolean(hasAcceptedTerms && (localMatch.paymentStatus || localMatch.shirtSize || localMatch.cpf))
      return {
        ...localMatch,
        isAlreadyOfficial,
        paymentStatus: localMatch.paymentStatus || (isAlreadyOfficial ? 'pending_payment' : null)
      }
    }

    try {
      const waitlistLocal = JSON.parse(localStorage.getItem('beer_run_athlete_waitlist') || '[]')
      const matchedW = waitlistLocal.find(w => {
        const digits = (w.phone || '').replace(/\D/g, '')
        return digits === cleanDigits || digits.slice(-9) === cleanDigits.slice(-9)
      })
      if (matchedW) {
        return {
          id: matchedW.id,
          name: matchedW.name,
          nickname: matchedW.nickname || '',
          displayName: formatAthleteDisplayName(matchedW.name, matchedW.nickname),
          phone: matchedW.phone,
          modality: matchedW.modality || 'corrida',
          drinksBeer: Boolean(matchedW.drinks_beer || matchedW.drinksBeer),
          isAlreadyOfficial: false,
          fromWaitlist: true
        }
      }
    } catch (e) {}

    return null
  }

  // Salva dados parciais em cache local (localStorage) e no Supabase (para continuar de onde parou)
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

    // 2. Se o atleta já possui registro no Supabase, atualiza os dados parciais na tabela athletes
    if (isSupabaseConfigured && supabase && athleteId) {
      try {
        const formData = draftData.form || {}
        const partialPayload = {}

        if (formData.cpf) {
          const cleanCpf = formData.cpf.replace(/\D/g, '')
          if (cleanCpf.length === 11) partialPayload.cpf = cleanCpf
        }
        if (formData.birthDate) partialPayload.birth_date = formData.birthDate
        if (formData.gender) partialPayload.gender = formData.gender
        if (formData.cityState) partialPayload.city_state = formData.cityState.trim()
        if (formData.email) partialPayload.email = formData.email.trim()
        if (formData.emergencyContactName) partialPayload.emergency_contact_name = formData.emergencyContactName.trim()
        if (formData.emergencyContactPhone) partialPayload.emergency_contact_phone = formData.emergencyContactPhone.trim()
        if (formData.skewerChoice || formData.shirtSize) {
          partialPayload.shirt_size = (formData.skewerChoice || formData.shirtSize).trim()
        }
        if (formData.medicalNotes !== undefined) partialPayload.medical_notes = formData.medicalNotes ? formData.medicalNotes.trim() : null
        if (formData.modality) partialPayload.modality = formData.modality
        if (formData.drinksBeer !== undefined) partialPayload.drinks_beer = Boolean(formData.drinksBeer)

        if (Object.keys(partialPayload).length > 0) {
          await supabase
            .from('athletes')
            .update(partialPayload)
            .eq('id', athleteId)
        }
      } catch (sbErr) {
        console.warn('Aviso ao persistir rascunho no Supabase:', sbErr)
      }
    }
  }

  // Carrega rascunho do atleta do localStorage
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
    registerOfficialAthlete,
    updateAthletePaymentStatus,
    findAthleteByPhone,
    formatAthleteDisplayName,
    saveAthleteDraft,
    loadAthleteDraft,
    clearAthleteDraft
  }
}

