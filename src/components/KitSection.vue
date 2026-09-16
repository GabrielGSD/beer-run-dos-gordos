<template>
  <section id="kit" class="kit-section ">
    <div class="container">
      <h2 class="section-title">KIT DO ATLETA</h2>

      <div class="vintage-card kit-card-wrapper">
        <div class="kit-grid">
          <!-- Item 1: Medalha de Conclusão -->
          <div class="kit-item">
            <div class="kit-image-box">
              <span class="kit-badge font-condensed">EXCLUSIVA FINISHER</span>
              <img
                src="/images/kit/medalha.png"
                alt="Medalha de Conclusão Beer Run dos Gordos"
                class="kit-img"
                loading="lazy"
              />
            </div>
            <h4 class="kit-item-title font-slab">MEDALHA DE CONCLUSÃO</h4>
            <p class="kit-item-desc font-condensed">
              Pesada, colecionável e em relevo 3D. Apenas para os sobreviventes que cruzarem a linha de chegada.
            </p>
          </div>

          <!-- Item 2: Copo Pint Oficial -->
          <div class="kit-item">
            <div class="kit-image-box">
              <span class="kit-badge font-condensed">ITEM COLECIONÁVEL</span>
              <img
                src="/images/kit/copo.png"
                alt="Copo Oficial Beer Run dos Gordos"
                class="kit-img"
                loading="lazy"
              />
            </div>
            <h4 class="kit-item-title font-slab">COPO OFICIAL</h4>
            <p class="kit-item-desc font-condensed">
              Copo de vidro personalizado para brindar e comemorar o pós prova.
            </p>
          </div>
          
          <!-- Item 3: Taça Oficial da Prova -->
          <div class="kit-item">
            <div class="kit-image-box">
              <span class="kit-badge font-condensed">ITEM COLECIONÁVEL</span>
              <img
                src="/images/kit/taca.png"
                alt="Taça Oficial Beer Run dos Gordos"
                class="kit-img"
                loading="lazy"
              />
            </div>
            <h4 class="kit-item-title font-slab">TAÇA OFICIAL DA PROVA</h4>
            <p class="kit-item-desc font-condensed">
              Taça especial para brindar e comemorar o pós prova.
            </p>
          </div>
        </div>

        <div class="kit-footer-tag font-condensed">
          MEDALHA DE CONCLUSÃO • COPO & TAÇA • BRINDES DE APOIADORES • SORTEIOS
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
  padding: 32px 28px;
  border-radius: 8px;
}

.kit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 28px;
}

.kit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.45);
  border: 1.5px solid rgba(44, 39, 31, 0.25);
  border-radius: 8px;
  padding: 16px 14px 20px 14px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.kit-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.7);
  border-color: var(--accent-border);
  box-shadow: 0 8px 18px rgba(25, 23, 20, 0.12);
}

.kit-image-box {
  position: relative;
  width: 100%;
  height: 240px;
  background: radial-gradient(circle at center, #ffffff 0%, #f4eade 70%, #ebdcb9 100%);
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  padding: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 12px rgba(25, 23, 20, 0.08);
}

.kit-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--accent-dark);
  color: var(--accent-gold);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--accent-gold);
  z-index: 2;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.kit-img {
  width: auto;
  height: 100%;
  max-width: 90%;
  max-height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(25, 23, 20, 0.25));
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.35s ease;
}

.kit-item:hover .kit-img {
  transform: scale(1.06) translateY(-2px);
  filter: drop-shadow(0 12px 20px rgba(25, 23, 20, 0.35));
}

.kit-item-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-dark);
  margin-bottom: 6px;
  letter-spacing: -0.3px;
  line-height: 1.25;
}

.kit-item-desc {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.35;
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
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(217, 130, 43, 0.3);
}

@media (max-width: 900px) {
  .kit-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .kit-card-wrapper {
    padding: 20px 14px;
  }

  .kit-grid {
    grid-template-columns: 1fr;
    gap: 18px;
    margin-bottom: 20px;
  }

  .kit-image-box {
    height: 220px;
  }

  .kit-img {
    max-height: 180px;
  }

  .kit-item-title {
    font-size: 1.1rem;
  }

  .kit-item-desc {
    font-size: 0.9rem;
  }

  .kit-footer-tag {
    font-size: 0.82rem;
    padding: 10px 12px;
    line-height: 1.4;
  }
}
</style>
