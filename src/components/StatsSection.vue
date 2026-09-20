<template>
  <section class="stats-section">
    <div class="container">
      <h2 class="section-title">NÚMEROS DA PROVA</h2>

      <div class="stats-grid">
        <!-- Stat 1 -->
        <div class="vintage-info-card stat-card">
          <div class="card-pin pin-tl"></div>
          <div class="card-pin pin-tr"></div>
          <div class="card-pin pin-bl"></div>
          <div class="card-pin pin-br"></div>
          <i class="fa-solid fa-route stat-icon"></i>
          <div class="card-main-text font-slab">6,37 KM</div>
          <div class="card-sub-text font-condensed">DISTÂNCIA APROXIMADA</div>
          <div class="card-pill-tag font-condensed">PERCURSO</div>
        </div>

        <!-- Stat 2 -->
        <div class="vintage-info-card stat-card">
          <div class="card-pin pin-tl"></div>
          <div class="card-pin pin-tr"></div>
          <div class="card-pin pin-bl"></div>
          <div class="card-pin pin-br"></div>
          <i class="fa-solid fa-mountain stat-icon"></i>
          <div class="card-main-text font-slab">195 M</div>
          <div class="card-sub-text font-condensed">GANHO DE ELEVAÇÃO</div>
          <div class="card-pill-tag font-condensed">ALTITUDE</div>
        </div>

        <!-- Stat 3: Total de Atletas Dinâmico -->
        <div class="vintage-info-card stat-card">
          <div class="card-pin pin-tl"></div>
          <div class="card-pin pin-tr"></div>
          <div class="card-pin pin-bl"></div>
          <div class="card-pin pin-br"></div>
          <i class="fa-solid fa-person-running stat-icon"></i>
          <div class="card-main-text font-slab">
            {{ totalAthletes < 10 && totalAthletes > 0 ? '0' + totalAthletes : totalAthletes }}
          </div>
          <div class="card-sub-text font-condensed">CONFIRMADOS NO PELOTÃO</div>
          <div class="card-pill-tag font-condensed">ATLETAS</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useAthletes } from '../composables/useAthletes.js'

const { totalAthletes, maxAthletes, isSoldOut } = useAthletes()
</script>

<style scoped>
.stats-section {
  padding: 40px 0 60px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Reuse vintage-info-card pattern */
.vintage-info-card {
  background-color: rgba(245, 235, 215, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2px solid #1c1b18;
  border-radius: 12px;
  padding: 20px 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  box-shadow: 3px 3px 0px rgba(28, 27, 24, 0.85);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.vintage-info-card:hover {
  transform: translateY(-3px);
  box-shadow: 5px 5px 0px rgba(28, 27, 24, 0.9);
}

/* Corner pins */
.card-pin {
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: #1c1b18;
  border-radius: 50%;
  opacity: 0.75;
}
.pin-tl { top: 6px; left: 6px; }
.pin-tr { top: 6px; right: 6px; }
.pin-bl { bottom: 6px; left: 6px; }
.pin-br { bottom: 6px; right: 6px; }

.stat-icon {
  font-size: 2.4rem;
  color: var(--accent-dark);
  margin-bottom: 10px;
}

.card-main-text {
  font-size: 2rem;
  font-weight: 900;
  color: #1c1b18;
  line-height: 1.0;
  margin-bottom: 4px;
}

.stat-max-sub {
  font-size: 1.2rem;
  font-weight: 800;
  opacity: 0.65;
  margin-left: 2px;
}

.card-text-sm {
  font-size: 1.15rem;
  line-height: 1.1;
}

.card-sub-text {
  font-size: 0.88rem;
  font-weight: 900;
  color: #354c23;
  letter-spacing: 0.3px;
  margin-bottom: 14px;
  line-height: 1.1;
}

.card-pill-tag {
  margin-top: auto;
  background-color: #d8812a;
  color: #1c1b18;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 3px 14px;
  border-radius: 12px;
  border: 1.5px solid #1c1b18;
  letter-spacing: 0.5px;
  box-shadow: 1px 1px 0px #1c1b18;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stats-grid .stat-card:first-child {
    grid-column: 1 / -1;
  }

  .stat-card {
    padding: 16px 10px 14px;
  }

  .stat-icon {
    font-size: 2rem;
    margin-bottom: 6px;
  }

  .card-main-text {
    font-size: 1.7rem;
  }

  .card-sub-text {
    font-size: 0.8rem;
    margin-bottom: 10px;
  }

  .card-pill-tag {
    font-size: 0.72rem;
    padding: 2px 10px;
  }
}
</style>
