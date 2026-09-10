import { ref, computed } from 'vue'

function formatAthleteDisplayName(name, nickname) {
  if (!name) return ''
  // Se o nome já tiver aspas de apelido embutidas (dados mockados)
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

// Mock inicial de atletas confirmados
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

function loadSavedAthletes() {
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

// Estado compartilhado singleton
const athletes = ref(loadSavedAthletes())

export function useAthletes() {
  const totalAthletes = computed(() => athletes.value.length)
  const drinkersCount = computed(() => athletes.value.filter(a => a.drinksBeer).length)
  const nonDrinkersCount = computed(() => athletes.value.filter(a => !a.drinksBeer).length)

  /**
   * Adiciona um novo atleta à lista local e persiste no localStorage.
   * Quando configurar o Supabase, você poderá substituir ou plugar a chamada aqui:
   * 
   * const { data, error } = await supabase.from('athletes').insert([{
   *   name: name.trim(),
   *   nickname: nickname?.trim(),
   *   phone: phone?.trim(),
   *   modality,
   *   drinks_beer: drinksBeer
   * }])
   */
  async function addAthlete({ name, nickname, phone, modality, drinksBeer }) {
    const formattedDisplay = formatAthleteDisplayName(name, nickname)
    const newAthlete = {
      id: Date.now(),
      name: name.trim(),
      nickname: nickname?.trim() || '',
      displayName: formattedDisplay,
      phone: phone?.trim() || '',
      modality: modality || 'corrida',
      drinksBeer: Boolean(drinksBeer),
      createdAt: new Date().toISOString()
    }

    // Insere no topo da lista
    athletes.value.unshift(newAthlete)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes.value))
    } catch (e) {
      console.error('Erro ao salvar atletas no localStorage:', e)
    }

    return newAthlete
  }

  return {
    athletes,
    totalAthletes,
    drinkersCount,
    nonDrinkersCount,
    addAthlete,
    formatAthleteDisplayName
  }
}
