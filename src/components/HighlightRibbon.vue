<template>
  <section class="dark-ribbon ribbon-section">
    <div class="container ribbon-grid">

      <div class="ribbon-item">
        <i class="fa-solid fa-beer-mug-empty ribbon-icon"></i>
        <div class="ribbon-text">
          <strong>PARA TODO TIPO DE GENTE</strong>
          <span>Atleta ou não, todo mundo chega no final.</span>
        </div>
      </div>

      <div class="ribbon-divider"></div>

      <div class="ribbon-item">
        <i class="fa-solid fa-shoe-prints ribbon-icon"></i>
        <div class="ribbon-text">
          <strong>6,37 KM DE SOFRIMENTO</strong>
          <span>Com paradas estratégicas para cerveja.</span>
        </div>
      </div>

      <div class="ribbon-divider"></div>

      <div class="ribbon-item">
        <i class="fa-solid fa-champagne-glasses ribbon-icon"></i>
        <div class="ribbon-text">
          <strong>RESENHA GARANTIDA.</strong>
          <span>Churrasco no final e papo até de madrugada.</span>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.ribbon-section {
  padding: 24px 0;
  margin: 20px 0 40px 0;
}

.ribbon-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.ribbon-item {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1 1 250px;
  justify-content: center;
}

.ribbon-icon {
  font-size: 2.2rem;
  color: var(--accent-gold);
  min-width: 44px;
  text-align: center;
}

.ribbon-text {
  display: flex;
  flex-direction: column;
  font-family: var(--font-condensed);
  line-height: 1.2;
}

.ribbon-text strong {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #ffffff;
}

.ribbon-text span {
  font-size: 0.95rem;
  color: #d1c5b0;
  font-weight: 600;
}

.ribbon-divider {
  width: 2px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.15);
}

@media (max-width: 850px) {
  .ribbon-divider {
    display: none;
  }

  .ribbon-grid {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 16px;
    gap: 16px;
  }

  .ribbon-item {
    flex: unset;
    width: 100%;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .ribbon-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }
}
</style>
