<template>
  <section id="atletas" class="athletes-section dash-section">
    <div class="container">
      <h2 class="section-title">ATLETAS CONFIRMADOS</h2>

      <div class="vintage-card athletes-container">
        <!-- Header Banner & Live Stats -->
        <div class="athletes-header">
          <div class="athletes-stats-block">
            <div class="counter-badge font-slab">
              <span class="counter-number">{{ totalAthletes < 10 ? '0' + totalAthletes : totalAthletes }}</span>
              <span class="counter-label">ATLETAS CONFIRMADOS</span>
            </div>

            <div class="stats-pills font-condensed">
              <span class="pill pill-beer" title="Participantes com chopp liberado">
                <i class="fa-solid fa-beer-mug-empty"></i> {{ drinkersCount }} VÃO BEBER
              </span>
              <span class="pill pill-soft" title="Participantes sem bebida alcoólica">
                <i class="fa-solid fa-bottle-water"></i> {{ nonDrinkersCount }} NÃO BEBEM
              </span>
            </div>
          </div>

          <div class="athletes-actions">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Buscar atleta por nome..."
                class="vintage-search font-condensed"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search-btn"
                aria-label="Limpar busca"
              >
                &times;
              </button>
            </div>

            <button
              @click="$emit('open-registration')"
              class="btn-vintage btn-register-quick font-slab"
            >
              <i class="fa-solid fa-plus"></i> QUERO MEU NOME NA LISTA
            </button>
          </div>
        </div>

        <!-- Scrollable Athletes List -->
        <div class="athletes-scroll-wrapper">
          <div v-if="filteredAthletes.length > 0" class="athletes-list">
            <div
              v-for="(athlete, index) in filteredAthletes"
              :key="athlete.id"
              class="athlete-row"
            >
              <div class="athlete-main-info">
                <span class="athlete-number font-slab">
                  #{{ String(totalAthletes - index).padStart(2, '0') }}
                </span>
                
                <div class="athlete-details">
                  <h4 class="athlete-name font-slab">{{ athlete.displayName || athlete.name }}</h4>
                </div>
              </div>

              <div class="athlete-status-group">
                <!-- Status Beber Chopp -->
                <div
                  :class="['beer-status-tag', athlete.drinksBeer ? 'drinks-yes' : 'drinks-no']"
                  class="font-condensed"
                >
                  <template v-if="athlete.drinksBeer">
                    <span class="status-icon">🍺</span>
                    <span class="status-text">VAI BEBER</span>
                  </template>
                  <template v-else>
                    <span class="status-icon">🥤</span>
                    <span class="status-text">NÃO VAI BEBER</span>
                  </template>
                </div>

                <span class="confirmed-badge font-condensed">
                  <i :class="athlete.modality === 'caminhada' ? 'fa-solid fa-person-walking' : 'fa-solid fa-person-running'"></i>
                    {{ athlete.modality === 'caminhada' ? 'Caminhada' : 'Corrida' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty Search State -->
          <div v-else class="empty-state font-condensed">
            <i class="fa-solid fa-magnifying-glass-chart empty-icon"></i>
            <h4 class="font-slab">Nenhum atleta encontrado com "{{ searchQuery }}"</h4>
            <p>Seja o primeiro a se inscrever ou confira se o nome foi digitado corretamente!</p>
            <button
              @click="$emit('open-registration')"
              class="btn-vintage btn-empty-cta font-slab"
            >
              GARANTIR MINHA VAGA AGORA
            </button>
          </div>
        </div>

        <!-- Section Footer CTA Banner -->
        <div class="athletes-footer-ribbon">
          <div class="footer-cta-text font-condensed">
            <strong>FALTA O SEU NOME AQUI?</strong> Garanta seu kit com medalha 3D, copo, chopp gelado e churrasco!
          </div>
          <button
            @click="$emit('open-registration')"
            class="btn-vintage btn-footer-cta font-slab"
          >
            INSCREVER-SE AGORA <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAthletes } from '../composables/useAthletes.js'

defineEmits(['open-registration'])

const { athletes, totalAthletes, drinkersCount, nonDrinkersCount } = useAthletes()
const searchQuery = ref('')

const filteredAthletes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return athletes.value
  return athletes.value.filter(a => {
    const nameMatch = a.name && a.name.toLowerCase().includes(query)
    const nickMatch = a.nickname && a.nickname.toLowerCase().includes(query)
    const displayMatch = a.displayName && a.displayName.toLowerCase().includes(query)
    return nameMatch || nickMatch || displayMatch
  })
})
</script>

<style scoped>
.athletes-section {
  padding: 40px 0 60px 0;
}

.athletes-container {
  padding: 28px;
  border-radius: 8px;
}

/* Header & Counter */
.athletes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 2px dashed rgba(44, 39, 31, 0.25);
  margin-bottom: 20px;
}

.athletes-stats-block {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.counter-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  padding: 8px 18px;
  border-radius: 6px;
  border: 2px solid var(--accent-gold);
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.25);
}

.counter-number {
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1;
}

.counter-label {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-light);
}

.stats-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  border: 1.5px solid var(--accent-border);
}

.pill-beer {
  background-color: rgba(217, 130, 43, 0.2);
  color: #793f06;
  border-color: var(--accent-gold);
}

.pill-soft {
  background-color: rgba(56, 75, 40, 0.15);
  color: var(--accent-green);
  border-color: var(--accent-green);
}

.athletes-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 0.95rem;
  pointer-events: none;
}

.vintage-search {
  padding: 9px 34px 9px 36px;
  font-size: 0.95rem;
  font-weight: 700;
  background-color: #ffffff;
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  color: var(--text-dark);
  width: 240px;
  transition: all 0.2s ease;
  outline: none;
}

.vintage-search:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(217, 130, 43, 0.2);
  width: 270px;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
}

.btn-register-quick {
  padding: 9px 16px;
  font-size: 0.95rem;
  box-shadow: 2px 2px 0px var(--accent-dark);
}

/* Scroll Wrapper */
.athletes-scroll-wrapper {
  max-height: 440px;
  overflow-y: auto;
  padding-right: 6px;
  margin-bottom: 20px;
}

.athletes-scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.athletes-scroll-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.athletes-scroll-wrapper::-webkit-scrollbar-thumb {
  background: var(--accent-dark);
  border-radius: 4px;
}

.athletes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Athlete Row */
.athlete-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  padding: 12px 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.athlete-row:hover {
  transform: translateX(4px);
  border-color: var(--accent-gold);
  box-shadow: 2px 4px 10px rgba(25, 23, 20, 0.1);
}

.athlete-main-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.athlete-number {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--text-muted);
  min-width: 32px;
}

.athlete-avatar {
  width: 50px;
  height: 40px;
  border-radius: 100%;
  background: var(--bg-parchment-light);
  border: 1.5px solid var(--accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.avatar-beer-icon {
  color: #c4711e;
}

.avatar-runner-icon {
  color: var(--accent-green);
}

.athlete-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.athlete-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-dark);
  line-height: 1.2;
}

.athlete-modality {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.athlete-status-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.beer-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  border: 1.5px solid transparent;
}

.beer-status-tag.drinks-yes {
  background-color: #fff6e5;
  border-color: var(--accent-gold);
  color: #8f4d0e;
}

.beer-status-tag.drinks-no {
  background-color: #f1ede3;
  border-color: rgba(44, 39, 31, 0.25);
  color: var(--text-muted);
}

.status-icon {
  font-size: 1rem;
}

.confirmed-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(56, 75, 40, 0.12);
  color: var(--accent-green);
  border: 1px solid rgba(56, 75, 40, 0.3);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px dashed rgba(44, 39, 31, 0.25);
  border-radius: 6px;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.empty-state h4 {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 6px;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 18px;
}

.btn-empty-cta {
  font-size: 0.95rem;
  padding: 10px 20px;
}

/* Footer Ribbon */
.athletes-footer-ribbon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  background-color: var(--accent-dark);
  color: var(--text-light);
  padding: 14px 20px;
  border-radius: 6px;
  border: 1px solid rgba(217, 130, 43, 0.35);
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
}

.footer-cta-text {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.footer-cta-text strong {
  color: var(--accent-gold);
  font-weight: 900;
}

.btn-footer-cta {
  padding: 8px 18px;
  font-size: 0.95rem;
  border-width: 2px;
}

/* Responsive adjustments */
@media (max-width: 860px) {
  .athletes-header {
    flex-direction: column;
    align-items: stretch;
  }

  .athletes-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .vintage-search {
    width: 100%;
  }

  .vintage-search:focus {
    width: 100%;
  }

  .btn-register-quick {
    width: 100%;
  }

  .athlete-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .athlete-status-group {
    width: 100%;
    justify-content: left;
  }

  .athletes-footer-ribbon {
    flex-direction: column;
    text-align: center;
  }

  .btn-footer-cta {
    width: 100%;
  }
}

@media (max-width: 500px) {
  .athletes-container {
    padding: 18px 14px;
  }

  .counter-badge {
    width: 100%;
    justify-content: center;
  }

  .stats-pills {
    width: 100%;
    justify-content: center;
  }
}
</style>
