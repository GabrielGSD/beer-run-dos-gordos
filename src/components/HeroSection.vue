<template>
  <section id="evento" class="hero-section">
    <div class="container hero-grid">
      <!-- Main Badge Illustration (Left) -->
      <div class="hero-image-wrapper">
        <img src="/logo_compl.png" alt="BEER RUN DOS GORDOS Emblem" class="hero-logo-badge animate-float" />
      </div>

      <!-- Content (Right) -->
      <div class="hero-content">
        <div class="hero-star-header font-slab">
          <span>★</span> A PROVA QUE <span>★</span>
        </div>

        <h1 class="hero-main-title font-slab">
          NINGUÉM PEDIU!
        </h1>

        <p class="hero-subtitle font-condensed">
          6,37 KM DE PURO SOFRIMENTO VOLUNTÁRIO.<br />
          COM CHURRASCO NO FINAL, PORQUE SIM.
        </p>

        <!-- Quick Event Details - Vintage Parchment Cards -->
        <div class="hero-info-cards">
          <!-- Card 1: DATA -->
          <div class="vintage-info-card">
            <div class="card-pin pin-tl"></div>
            <div class="card-pin pin-tr"></div>
            <div class="card-pin pin-bl"></div>
            <div class="card-pin pin-br"></div>
            
            <img src="/icon-data.png" alt="Data" class="card-icon-img" />
            <div class="card-main-text font-slab">28</div>
            <div class="card-sub-text font-condensed">NOVEMBRO</div>
            <div class="card-pill-tag font-condensed">DATA</div>
          </div>

          <!-- Card 2: LOCAL -->
          <div class="vintage-info-card">
            <div class="card-pin pin-tl"></div>
            <div class="card-pin pin-tr"></div>
            <div class="card-pin pin-bl"></div>
            <div class="card-pin pin-br"></div>
            
            <img src="/icon-local.png" alt="Local" class="card-icon-img" />
            <div class="card-main-text card-text-sm font-slab">SÍTIO DOS<br />GORDOS</div>
            <div class="card-sub-text font-condensed">NATÉRCIA / MG</div>
            <div class="card-pill-tag font-condensed">LOCAL</div>
          </div>

          <!-- Card 3: DISTÂNCIA -->
          <div class="vintage-info-card">
            <div class="card-pin pin-tl"></div>
            <div class="card-pin pin-tr"></div>
            <div class="card-pin pin-bl"></div>
            <div class="card-pin pin-br"></div>
            
            <img src="/icon-run.png" alt="Distância" class="card-icon-img" />
            <div class="card-main-text card-text-md font-slab">6,37 KM</div>
            <div class="card-sub-text font-condensed">CORRIDA / CAMINHADA</div>
            <div class="card-pill-tag font-condensed">DISTÂNCIA</div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="hero-cta-box">
          <button class="btn-vintage hero-btn" @click="$emit('open-registration')">
            INSCREVA-SE AGORA
          </button>
          <span class="cta-subtag font-condensed">VAGAS LIMITADAS!</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-registration'])
</script>

<style scoped>
.hero-section {
  padding: 40px 0 60px 0;
  position: relative;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  align-items: center;
  gap: 36px;
}

.hero-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-logo-badge {
  max-width: 100%;
  height: auto;
  max-height: 480px;
  filter: drop-shadow(4px 8px 12px rgba(0, 0, 0, 0.3));
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-star-header {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-dark);
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-star-header span {
  color: var(--accent-gold);
}

.hero-main-title {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1.05;
  color: var(--text-dark);
  margin-bottom: 12px;
  text-shadow: 2px 2px 0px rgba(255,255,255,0.5);
}

.hero-subtitle {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent-green);
  line-height: 1.25;
  margin-bottom: 24px;
}

/* Vintage Parchment Cards Grid */
.hero-info-cards {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 28px;
  width: 100%;
}

.vintage-info-card {
  flex: 1;
  min-width: 130px;
  background-color: rgba(245, 235, 215, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2px solid #1c1b18;
  border-radius: 12px;
  padding: 16px 10px 12px 10px;
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

.card-icon-img {
  height: 60px;
  width: auto;
  object-fit: contain;
  mix-blend-mode: multiply;
  margin-bottom: 6px;
}

.card-main-text {
  font-size: 2.2rem;
  font-weight: 900;
  color: #1c1b18;
  line-height: 1.0;
  margin-bottom: 4px;
}

.card-text-sm {
  font-size: 1.15rem;
  line-height: 1.05;
}

.card-text-md {
  font-size: 1.65rem;
  line-height: 1.1;
}

.card-sub-text {
  font-size: 0.92rem;
  font-weight: 900;
  color: #354c23;
  letter-spacing: 0.3px;
  margin-bottom: 12px;
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

.hero-cta-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.hero-btn {
  font-size: 1.4rem;
  padding: 16px 36px;
}

.cta-subtag {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-dark);
  align-self: center;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-content {
    align-items: center;
  }

  .hero-main-title {
    font-size: 2.6rem;
  }

  .hero-info-cards {
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-cta-box {
    align-self: stretch;
    align-items: center;
  }
}
</style>
