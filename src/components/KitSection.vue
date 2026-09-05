<template>
  <section id="kit" class="kit-section">
    <div class="container">
      <h2 class="section-title">KIT DO ATLETA</h2>

      <div class="vintage-card kit-card-wrapper">
        <div class="kit-grid">
          <!-- Item 1: Camiseta -->
          <div class="kit-item">
            <div class="kit-image-box">
              <!-- SVG Mockup of Shirt with Logo -->
              <svg class="kit-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 40 40 L 70 20 C 85 30 115 30 130 20 L 160 40 L 140 70 L 130 60 L 130 170 L 70 170 L 70 60 L 60 70 Z" 
                      fill="#191714" stroke="#000" stroke-width="3" />
                <image href="/logo_01.png" x="72" y="70" width="56" height="56" />
              </svg>
            </div>
            <h4 class="kit-item-title font-slab">CAMISETA EXCLUSIVA</h4>
            <p class="kit-item-desc font-condensed">Tecido dry-fit premium estilo retro runner</p>
          </div>

          <!-- Item 2: Medalha -->
          <div class="kit-item">
            <div class="kit-image-box">
              <!-- SVG Mockup of Medal -->
              <svg class="kit-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Ribbon -->
                <path d="M 80 20 L 100 100 L 120 20" fill="none" stroke="#d9822b" stroke-width="24" />
                <path d="M 80 20 L 100 100 L 120 20" fill="none" stroke="#191714" stroke-width="4" stroke-dasharray="8 8" />
                <!-- Medal Circle -->
                <circle cx="100" cy="125" r="45" fill="#d9822b" stroke="#191714" stroke-width="4" />
                <circle cx="100" cy="125" r="38" fill="#ebdcb9" stroke="#191714" stroke-width="2" />
                <image href="/logo.png" x="70" y="105" width="60" height="40" />
              </svg>
            </div>
            <h4 class="kit-item-title font-slab">MEDALHA DE CONCLUSÃO</h4>
            <p class="kit-item-desc font-condensed">Pesada e colecionável para todos os concluintes</p>
          </div>

          <!-- Item 3: Copo Eco -->
          <div class="kit-item">
            <div class="kit-image-box">
              <!-- SVG Mockup of Cup -->
              <svg class="kit-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 70 30 L 130 30 L 120 170 L 80 170 Z" fill="#191714" stroke="#000" stroke-width="4" />
                <path d="M 66 25 L 134 25 L 134 35 L 66 35 Z" fill="#d9822b" stroke="#000" stroke-width="2" />
                <image href="/logo.png" x="75" y="80" width="50" height="40" />
              </svg>
            </div>
            <h4 class="kit-item-title font-slab">COPO ECO OFICIAL</h4>
            <p class="kit-item-desc font-condensed">Reutilizável para o chopp sem desperdício</p>
          </div>
        </div>

        <div class="kit-footer-tag font-condensed">
          CAMISETA EXCLUSIVA • MEDALHA DE CONCLUSÃO • COPO • NÚMERO DE PEITO • BRINDES DE APOIADORES
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kit-section {
  padding: 40px 0 60px 0;
}

.kit-card-wrapper {
  padding: 32px;
  border-radius: 8px;
}

.kit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px;
  margin-bottom: 28px;
}

.kit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.kit-image-box {
  width: 100%;
  height: 220px;
  background-color: var(--bg-parchment);
  border: 2px solid var(--accent-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
}

.kit-svg {
  width: 180px;
  height: 180px;
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
}

.kit-svg image {
  mix-blend-mode: multiply;
}

.kit-item-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.kit-item-desc {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kit-footer-tag {
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  background-color: var(--accent-dark);
  color: var(--text-light);
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.2);
}
</style>
