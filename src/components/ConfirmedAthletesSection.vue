<template>
  <section id="atletas" class="athletes-section dash-section">
    <div class="container">
      <h2 class="section-title">ATLETAS CONFIRMADOS</h2>
      <div class="vintage-card athletes-container">
        <div class="athletes-header">
          <div class="athletes-stats-block">
            <div class="counter-badge font-slab">
              <span class="counter-number">{{ summary ? String(summary.total).padStart(2, '0') : '—' }}</span>
              <span class="counter-label">{{ isSoldOut ? 'VAGAS PREENCHIDAS' : 'ATLETAS CONFIRMADOS' }}</span>
            </div>
            <div v-if="summary" class="stats-pills font-condensed">
              <span class="pill pill-beer" title="Participantes com chopp liberado">
                <i class="fa-solid fa-beer-mug-empty" aria-hidden="true"></i> {{ summary.drinkers }} VÃO BEBER
              </span>
              <span class="pill pill-soft" title="Participantes sem bebida alcoólica">
                <i class="fa-solid fa-bottle-water" aria-hidden="true"></i> {{ summary.nonDrinkers }} NÃO BEBEM
              </span>
              <span v-if="summary.waitlistCount > 0" class="pill pill-waitlist" title="Atletas na lista de espera">
                <i class="fa-solid fa-clipboard-list" aria-hidden="true"></i> {{ summary.waitlistCount }} NA FILA DE ESPERA
              </span>
            </div>
          </div>
          <div class="athletes-actions">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
              <input v-model="searchQuery" type="text" placeholder="Buscar atleta por nome..."
                aria-label="Buscar atleta por nome ou apelido" class="vintage-search font-condensed" />
              <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="clear-search-btn" aria-label="Limpar busca">&times;</button>
            </div>
            <button type="button" @click="$emit('open-registration', 'atletas_topo_rapido')" class="btn-vintage btn-register-quick font-slab">
              <i class="fa-solid fa-plus" aria-hidden="true"></i> QUERO MEU NOME NA LISTA
            </button>
          </div>
        </div>
        <div class="athletes-scroll-wrapper" aria-live="polite" :aria-busy="loading">
          <div v-if="loading && !athletes.length" class="loading-state font-condensed">
            <i class="fa-solid fa-spinner fa-spin loading-icon" aria-hidden="true"></i>
            <h4 class="font-slab">Carregando pelotão de atletas...</h4>
          </div>
          <div v-else-if="error" class="empty-state font-condensed" role="alert">
            <p>{{ error }}</p>
            <button type="button" @click="refresh" class="btn-vintage btn-empty-cta font-slab">Tentar novamente</button>
          </div>
          <div v-else-if="filteredAthletes.length" class="athletes-list">
            <div v-for="athlete in filteredAthletes" :key="athlete.position" class="athlete-row">
              <div class="athlete-main-info">
                <span class="athlete-number font-slab">#{{ String(athlete.position).padStart(2, '0') }}</span>
                <div class="athlete-details">
                  <h4 class="athlete-name font-slab">{{ athlete.displayName }}</h4>
                </div>
              </div>
              <div class="athlete-status-group">
                <div v-if="athlete.drinksBeer !== null" :class="['beer-status-tag', athlete.drinksBeer ? 'drinks-yes' : 'drinks-no']" class="font-condensed">
                  <span class="status-icon" aria-hidden="true">{{ athlete.drinksBeer ? '🍺' : '🥤' }}</span>
                  <span class="status-text">{{ athlete.drinksBeer ? 'VAI BEBER' : 'NÃO VAI BEBER' }}</span>
                </div>
                <span class="confirmed-badge font-condensed">
                  <i :class="athlete.modality === 'caminhada' ? 'fa-solid fa-person-walking' : 'fa-solid fa-person-running'" aria-hidden="true"></i>
                  {{ athlete.modality === 'caminhada' ? 'Caminhada' : athlete.modality === 'corrida' ? 'Corrida' : 'Não informada' }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state font-condensed">
            <i class="fa-solid fa-magnifying-glass-chart empty-icon" aria-hidden="true"></i>
            <h4 class="font-slab">{{ searchQuery.trim() ? `Nenhum atleta encontrado com "${searchQuery}"` : 'Ainda não há atletas na lista.' }}</h4>
            <p>Seja o primeiro a se inscrever ou confira se o nome foi digitado corretamente!</p>
            <button type="button" @click="$emit('open-registration', 'atletas_busca_vazia')" class="btn-vintage btn-empty-cta font-slab">GARANTIR MINHA VAGA AGORA</button>
          </div>
        </div>
        <div class="athletes-footer-ribbon">
          <div class="footer-cta-text font-condensed"><strong>FALTA O SEU NOME AQUI?</strong> Garanta seu kit com medalha, copo, chopp gelado e churrasco!</div>
          <button type="button" @click="$emit('open-registration', 'atletas_faixa_rodape')" class="btn-vintage btn-footer-cta font-slab">
            INSCREVER-SE AGORA <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePublicAthletes } from '../composables/usePublicAthletes.js'

defineEmits(['open-registration'])
const { athletes, summary, loading, error, refresh } = usePublicAthletes()
const searchQuery = ref('')
const isSoldOut = computed(() => summary.value && summary.value.total >= summary.value.capacity)
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
function displayName(name, nickname) {
  if (!name || name.includes('"') || !nickname?.trim()) return name || ''
  const nick = nickname.trim().replace(/^["']|["']$/g, '')
  const [first, ...rest] = name.trim().split(/\s+/)
  return `${first} "${nick}"${rest.length ? ' ' + rest.join(' ') : ''}`
}
const filteredAthletes = computed(() => {
  const query = normalize(searchQuery.value.trim())
  return athletes.value.map((athlete, index) => ({ ...athlete, position: athletes.value.length - index,
    displayName: displayName(athlete.name, athlete.nickname),
  })).filter(athlete => normalize(athlete.name).includes(query) || normalize(athlete.nickname).includes(query) || normalize(athlete.displayName).includes(query))
})
</script>

<style scoped>
.athletes-section { padding: 40px 0 60px; }
.athletes-container { padding: 28px; border-radius: 8px; }
.athletes-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; padding-bottom: 24px; border-bottom: 2px dashed rgba(44,39,31,.25); margin-bottom: 20px; }
.athletes-stats-block { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
.counter-badge { display: inline-flex; align-items: center; gap: 10px; background-color: var(--accent-dark); color: var(--accent-gold); padding: 8px 18px; border-radius: 6px; border: 2px solid var(--accent-gold); box-shadow: 2px 2px 0 rgba(0,0,0,.25); }
.counter-number { font-size: 1.8rem; font-weight: 900; line-height: 1; }
.counter-label { font-size: 1.05rem; font-weight: 800; letter-spacing: .5px; color: var(--text-light); }
.stats-pills { display: flex; gap: 10px; flex-wrap: wrap; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: .88rem; font-weight: 800; letter-spacing: .3px; border: 1.5px solid var(--accent-border); }
.pill-beer { background: rgba(217,130,43,.2); color: #793f06; border-color: var(--accent-gold); }
.pill-soft { background: rgba(56,75,40,.15); color: var(--accent-green); border-color: var(--accent-green); }
.pill-waitlist { background: rgba(140,35,35,.12); color: #8c2323; border-color: #8c2323; }
.athletes-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search-box { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; color: var(--text-muted); font-size: .95rem; pointer-events: none; }
.vintage-search { padding: 9px 34px 9px 36px; font-size: .95rem; font-weight: 700; background: #fff; border: 2px solid var(--accent-border); border-radius: 6px; color: var(--text-dark); width: 240px; transition: all .2s ease; outline: none; }
.vintage-search:focus { border-color: var(--accent-gold); box-shadow: 0 0 0 3px rgba(217,130,43,.2); width: 270px; }
.clear-search-btn { position: absolute; right: 10px; background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }
.btn-register-quick { padding: 9px 16px; font-size: .95rem; box-shadow: 2px 2px 0 var(--accent-dark); }
.athletes-scroll-wrapper { max-height: 440px; overflow-y: auto; padding-right: 6px; margin-bottom: 20px; }
.athletes-scroll-wrapper::-webkit-scrollbar { width: 8px; }
.athletes-scroll-wrapper::-webkit-scrollbar-track { background: rgba(0,0,0,.05); border-radius: 4px; }
.athletes-scroll-wrapper::-webkit-scrollbar-thumb { background: var(--accent-dark); border-radius: 4px; }
.athletes-list { display: flex; flex-direction: column; gap: 10px; }
.athlete-row { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 2px solid var(--accent-border); border-radius: 6px; padding: 12px 18px; gap: 12px; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.athlete-row:hover { transform: translateX(4px); border-color: var(--accent-gold); box-shadow: 2px 4px 10px rgba(25,23,20,.1); }
.athlete-main-info { display: flex; align-items: center; gap: 5px; min-width: 0; }
.athlete-number { font-size: .95rem; font-weight: 900; color: var(--text-muted); min-width: 32px; }
.athlete-details { display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.athlete-name { font-size: 1.05rem; font-weight: 800; color: var(--text-dark); line-height: 1.2; }
.athlete-status-group { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.beer-status-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px; font-size: .85rem; font-weight: 800; letter-spacing: .3px; border: 1.5px solid transparent; }
.beer-status-tag.drinks-yes { background: #fff6e5; border-color: var(--accent-gold); color: #8f4d0e; }
.beer-status-tag.drinks-no { background: #f1ede3; border-color: rgba(44,39,31,.25); color: var(--text-muted); }
.status-icon { font-size: 1rem; }
.confirmed-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(56,75,40,.12); color: var(--accent-green); border: 1px solid rgba(56,75,40,.3); padding: 4px 10px; border-radius: 4px; font-size: 1rem; font-weight: 800; letter-spacing: .5px; }
.loading-state, .empty-state { text-align: center; padding: 40px 20px; background: rgba(255,255,255,.5); border: 2px dashed rgba(44,39,31,.25); border-radius: 6px; }
.loading-icon { font-size: 2.2rem; color: var(--accent-gold); margin-bottom: 12px; }
.empty-icon { font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px; }
.empty-state h4 { font-size: 1.25rem; font-weight: 900; color: var(--text-dark); margin-bottom: 6px; }
.empty-state p { color: var(--text-muted); font-size: .95rem; font-weight: 600; margin-bottom: 18px; }
.btn-empty-cta { font-size: .95rem; padding: 10px 20px; }
.athletes-footer-ribbon { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: var(--accent-dark); color: var(--text-light); padding: 14px 20px; border-radius: 6px; border: 1px solid rgba(217,130,43,.35); box-shadow: 2px 2px 0 rgba(0,0,0,.2); }
.footer-cta-text { font-size: 1rem; font-weight: 600; letter-spacing: .3px; }
.footer-cta-text strong { color: var(--accent-gold); font-weight: 900; }
.btn-footer-cta { padding: 8px 18px; font-size: .95rem; border-width: 2px; }
@media (max-width: 860px) {
  .athletes-header { flex-direction: column; align-items: stretch; }
  .athletes-actions { width: 100%; flex-direction: column; align-items: stretch; }
  .search-box, .vintage-search, .vintage-search:focus, .btn-register-quick { width: 100%; }
  .athlete-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .athlete-status-group { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .athletes-footer-ribbon { flex-direction: column; text-align: center; }
  .btn-footer-cta { width: 100%; }
}
@media (max-width: 500px) {
  .athletes-container { padding: 18px 14px; }
  .counter-badge { width: 100%; justify-content: center; }
  .stats-pills { width: 100%; justify-content: center; }
}
</style>
