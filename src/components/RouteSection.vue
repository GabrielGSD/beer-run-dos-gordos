<template>
  <section id="percurso" class="route-section">
    <div class="container">
      <h2 class="section-title">O PERCURSO</h2>

      <div class="vintage-card route-container">
        <!-- Left Side: Route Notes & Legend -->
        <div class="route-info-card vintage-border">
          <h3 class="info-title font-slab">UM TRAJETO NO MELHOR ESTILO RAIZ.</h3>
          <p class="info-desc font-condensed">
            ESTRADAS DE TERRA, PAISAGENS LINDAS E PONTOS DE APOIO PARA RECARREGAR AS ENERGIAS.
          </p>

          <div class="route-legend">
            <div class="legend-item">
              <span class="legend-icon green">🚩</span>
              <strong>LARGADA</strong>
            </div>
            <div class="legend-item">
              <span class="legend-icon red">🏁</span>
              <strong>CHEGADA</strong>
            </div>
            <div class="legend-item">
              <span class="legend-icon amber">🍺</span>
              <strong>PONTO DE APOIO (CERVEJA)</strong>
            </div>
          </div>
        </div>

        <!-- Right Side: Illustrated Interactive Trail Map -->
        <div class="route-map-area">
          <div class="compass-rose">
            <span>N</span>
            <div class="compass-star">✦</div>
            <div class="compass-labels"><span>W</span><span>E</span></div>
            <span>S</span>
          </div>

          <!-- Trail Graphic Path SVG -->
          <svg class="trail-svg" viewBox="0 0 700 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background Topography Curves -->
            <path d="M 50 100 Q 200 40 400 80 T 650 60" stroke="#cbb894" stroke-width="2" stroke-dasharray="4 4" fill="none" />
            <path d="M 20 220 Q 250 180 500 240 T 680 200" stroke="#cbb894" stroke-width="2" stroke-dasharray="4 4" fill="none" />

            <!-- River -->
            <path d="M 10 350 Q 220 280 320 200 T 550 120 T 690 90" stroke="#7b9eaf" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6" />

            <!-- Main Dirt Trail Path -->
            <path d="M 220 70 C 150 120 180 260 250 280 C 320 300 360 220 440 240 C 520 260 580 180 500 80 C 420 50 280 40 220 70 Z" 
                  stroke="#c47d23" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <path d="M 220 70 C 150 120 180 260 250 280 C 320 300 360 220 440 240 C 520 260 580 180 500 80 C 420 50 280 40 220 70 Z" 
                  stroke="#1c1b18" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>

          <!-- Interactive Waypoints on Map -->
          <div class="map-point point-start" style="top: 15%; left: 30%;">
            <div class="point-badge green">🚩 LARGADA (0 KM)</div>
          </div>

          <div class="map-point point-beer-1" style="top: 60%; left: 33%;">
            <div class="point-badge amber">🍺 CHOPP STOPOVER 1 (2,1 KM)</div>
          </div>

          <div class="map-point point-beer-2" style="top: 50%; left: 60%;">
            <div class="point-badge amber">🍺 CHOPP STOPOVER 2 (4,5 KM)</div>
          </div>

          <div class="map-point point-finish" style="top: 18%; left: 70%;">
            <div class="point-badge red">🏁 CHEGADA & CHURRASCO (6,37 KM)</div>
          </div>

          <!-- Elevation Graph Box -->
          <div class="elevation-box vintage-border">
            <div class="elevation-header">
              <div><small>DISTÂNCIA</small> <strong>6,37 KM</strong></div>
              <div><small>ELEVAÇÃO</small> <strong>195 M</strong></div>
            </div>
            
            <div class="chart-wrapper">
              <svg viewBox="0 0 300 60" preserveAspectRatio="none">
                <polygon points="0,55 0,45 60,35 120,15 180,40 240,10 300,30 300,55" fill="rgba(57, 75, 40, 0.3)" />
                <polyline points="0,45 60,35 120,15 180,40 240,10 300,30" stroke="#384b28" stroke-width="3" fill="none" />
              </svg>
            </div>
            <div class="chart-ticks font-oswald">
              <span>0 KM</span>
              <span>2 KM</span>
              <span>4 KM</span>
              <span>6,37 KM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.route-section {
  padding: 40px 0 60px 0;
}

.route-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 24px;
  border-radius: 8px;
  background-color: var(--bg-parchment-light);
}

.route-info-card {
  background-color: #ebdcb9;
  padding: 24px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
}

.info-title {
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.2;
  color: var(--text-dark);
}

.info-desc {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1.3;
}

.route-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  padding-top: 16px;
  border-top: 2px dashed rgba(0,0,0,0.15);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 800;
}

.route-map-area {
  position: relative;
  background-color: #ebdcb9;
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  min-height: 380px;
  overflow: hidden;
}

.trail-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.compass-rose {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-slab);
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--text-dark);
  z-index: 2;
  opacity: 0.7;
}

.compass-labels {
  display: flex;
  gap: 16px;
}

.compass-star {
  font-size: 1.2rem;
  line-height: 1;
  color: var(--accent-gold);
}

/* Map Waypoints */
.map-point {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -50%);
}

.point-badge {
  font-family: var(--font-condensed);
  font-weight: 800;
  font-size: 0.8rem;
  padding: 4px 8px;
  border: 2px solid var(--accent-border);
  border-radius: 4px;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.2);
  white-space: nowrap;
  background-color: #ffffff;
}

.point-badge.green { background-color: #e2f0d9; color: #2e591b; }
.point-badge.amber { background-color: #fff2cc; color: #7f6000; }
.point-badge.red { background-color: #fbe5d6; color: #833c0c; }

/* Elevation Chart Widget */
.elevation-box {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 240px;
  background-color: rgba(245, 238, 220, 0.95);
  padding: 12px;
  border-radius: 6px;
  z-index: 10;
}

.elevation-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  padding-bottom: 4px;
}

.elevation-header small {
  color: var(--text-muted);
  display: block;
  font-size: 0.65rem;
}

.chart-wrapper {
  height: 50px;
  width: 100%;
}

.chart-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-top: 4px;
}

@media (max-width: 900px) {
  .route-container {
    grid-template-columns: 1fr;
  }
}
</style>
