<template>
  <section id="estrutura" class="structure-section">
    <div class="container">
      <h2 class="section-title">ESTRUTURA</h2>

      <div class="vintage-card structure-container">
        <!-- Highlights List -->
        <div class="structure-list">
          <div class="structure-item">
            <div class="structure-icon-box">
              <i class="fa-solid fa-beer-mug-empty"></i>
            </div>
            <div>
              <h3 class="item-title font-slab">PONTOS DE APOIO</h3>
              <p class="item-desc font-condensed">COM ÁGUA, ISOTÔNICO, CERVEJA GELADA E COMIDAS AO LONGO DO PERCURSO.</p>
            </div>
          </div>

          <div class="structure-item">
            <div class="structure-icon-box">
              <i class="fa-solid fa-drumstick-bite"></i>
            </div>
            <div>
              <h3 class="item-title font-slab">CHURRASCO NO FINAL</h3>
              <p class="item-desc font-condensed">PORQUE VOCÊ MERECE REPOR CADA CALORIA GASTA COM ESTILO.</p>
            </div>
          </div>

          <div class="structure-item">
            <div class="structure-icon-box">
              <i class="fa-solid fa-music"></i>
            </div>
            <div>
              <h3 class="item-title font-slab">MÚSICA E RESENHA</h3>
              <p class="item-desc font-condensed">DJ SPOTIFY E MUITA RESENHA DO COMEÇO AO FIM DO EVENTO.</p>
            </div>
          </div>
        </div>

        <!-- Illustration Showcase Frame -->
        <div class="structure-art-box vintage-border">
          <div class="art-badge font-condensed">CLIMA ESTRUTURADO DE FESTA</div>
          <!-- Retro SVG / Canvas illustration preview -->
          <svg class="art-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#e8cca4" />
            <!-- Sun & Hills -->
            <circle cx="320" cy="100" r="60" fill="#e69128" opacity="0.8" />
            <path d="M 0 220 Q 150 160 400 200 L 400 300 L 0 300 Z" fill="#394a28" opacity="0.9" />
            <path d="M 0 250 Q 200 220 400 260 L 400 300 L 0 300 Z" fill="#29351d" />
            <!-- Man with hat holding beer mug silhouette -->
            <path d="M 280 180 C 270 170 250 160 250 140 C 250 120 270 110 290 120 C 310 110 330 120 330 140 C 330 160 310 170 300 180 L 320 260 L 260 260 Z" fill="#1c1b18" />
            <!-- Cowboy / Outdoor Hat -->
            <ellipse cx="290" cy="120" rx="35" ry="8" fill="#59442b" />
            <path d="M 275 120 C 275 105 305 105 305 120 Z" fill="#59442b" />
            <!-- Raised Mug -->
            <rect x="330" y="110" width="22" height="28" rx="3" fill="#d9822b" stroke="#1c1b18" stroke-width="2" />
            <path d="M 330 112 Q 340 105 350 112" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.structure-section {
  padding: 40px 0 60px 0;
}

.structure-container {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  padding: 32px;
  border-radius: 8px;
  align-items: center;
}

.structure-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.structure-item {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.structure-icon-box {
  width: 54px;
  height: 54px;
  background-color: var(--bg-parchment);
  border: 2px solid var(--accent-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: var(--accent-gold);
  flex-shrink: 0;
  box-shadow: 2px 2px 0px var(--accent-dark);
}

.item-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.item-desc {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1.3;
}

.structure-art-box {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 4px 4px 0px var(--accent-dark);
}

.art-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: var(--accent-dark);
  color: var(--text-light);
  font-size: 0.85rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 4px;
  z-index: 2;
}

.art-svg {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 850px) {
  .structure-container {
    grid-template-columns: 1fr;
  }
}
</style>
