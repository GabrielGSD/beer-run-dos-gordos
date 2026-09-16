<template>
  <section id="percurso" class="route-section">
    <div class="container">
      <!-- Section Header -->
      <div class="section-header text-center">
        <h2 class="section-title">O PERCURSO DA PROVA</h2>
      </div>

      <!-- Main Navigation Tabs / Controls Bar -->
      <div class="route-controls-bar vintage-card">
        <div class="view-switch-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: currentView === 'illustrated' }"
            @click="currentView = 'illustrated'"
          >
            <span class="tab-icon">🗺️</span>
            <span>MAPA ILUSTRADO</span>
          </button>

          <button 
            class="tab-btn" 
            :class="{ active: currentView === 'satellite' }"
            @click="currentView = 'satellite'"
          >
            <span class="tab-icon">🛰️</span>
            <span>GPS & SATÉLITE</span>
          </button>

          <button 
            class="tab-btn" 
            :class="{ active: currentView === 'elevation' }"
            @click="currentView = 'elevation'"
          >
            <span class="tab-icon">📈</span>
            <span>ALTIMETRIA</span>
          </button>
          
          <button @click="openFullscreen = true" class="btn-action-outline">
            <span>🔍</span>
            <span>AMPLIAR MAPA</span>
          </button>
        </div>
      </div>

      <!-- Main Grid Layout -->
      <div class="route-main-grid">
        <!-- Left Column: Waypoints list and active landmark card -->
        <div class="route-sidebar">
          <!-- Active Selected Waypoint Spotlight Card (Desktop only) -->
          <div v-if="selectedWaypoint" class="vintage-card waypoint-spotlight-card desktop-only animate-fade-in">
            <div class="spotlight-header">
              <div class="spotlight-badge" :class="selectedWaypoint.type">
                {{ getWaypointTypeLabel(selectedWaypoint.type) }}
              </div>
              <div class="spotlight-km font-slab">
                KM {{ selectedWaypoint.actualKm.toFixed(2).replace('.', ',') }}
              </div>
            </div>

            <div v-if="getWaypointImage(selectedWaypoint.id)" class="spotlight-thumb-wrap">
              <img :src="getWaypointImage(selectedWaypoint.id)" :alt="selectedWaypoint.name" class="spotlight-img" />
              <div class="spotlight-ele-tag font-condensed">
                ⛰️ {{ selectedWaypoint.actualEle }}m altitude
              </div>
            </div>

            <h3 class="spotlight-title font-slab">{{ selectedWaypoint.name }}</h3>
            <div class="spotlight-sub font-condensed">{{ selectedWaypoint.subtitle }}</div>
            <p class="spotlight-desc">{{ selectedWaypoint.desc }}</p>
          </div>

          <!-- Interactive Waypoints List -->
          <div class="vintage-card waypoints-list-card">
            <div class="list-header">
              <span class="font-slab list-title">PONTOS DO CIRCUITO</span>
              <span class="list-badge font-condensed">9 MARCOS</span>
            </div>

            <div class="waypoints-scroll">
              <div 
                v-for="(wp, index) in mapWaypoints" 
                :key="wp.id"
                class="waypoint-list-item"
                :class="{ active: selectedWaypoint && selectedWaypoint.id === wp.id }"
                @click="handleListClick(wp)"
                @mouseenter="hoveredWaypoint = wp"
                @mouseleave="hoveredWaypoint = null"
              >
                <div class="item-num font-slab">{{ index + 1 }}</div>
                <div class="item-icon-box" :class="wp.type">
                  <span v-if="wp.type === 'start_finish'">🏁</span>
                  <span v-else-if="wp.type === 'beer'">🍺</span>
                  <span v-else-if="wp.type === 'nature'">🌊</span>
                  <span v-else-if="wp.type === 'cultural'">🎩</span>
                  <span v-else-if="wp.type === 'landmark'">⚽</span>
                  <span v-else>📍</span>
                </div>
                <div class="item-info">
                  <div class="item-name font-slab">{{ wp.name }}</div>
                  <div class="item-meta font-condensed">
                    <span>KM {{ wp.actualKm.toFixed(2).replace('.', ',') }}</span>
                    <span>•</span>
                    <span>{{ wp.actualEle }}m alt</span>
                  </div>
                </div>
                <div class="item-arrow">›</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Interactive Map View Container -->
        <div class="route-map-wrapper vintage-card">
          <!-- 1. ILLUSTRATED VINTAGE TREASURE MAP VIEW -->
          <div v-show="currentView === 'illustrated'" class="illustrated-map-container">
            <div class="map-canvas-frame">
              <!-- Illustrated Map Base Art -->
              <img 
                src="/images/route/illustrated_map.jpg" 
                alt="Mapa Ilustrado do Percurso Beer Run dos Gordos" 
                class="map-art-image" 
              />

              <!-- Interactive Waypoint Pins Overlay -->
              <div 
                v-for="wp in mapWaypoints" 
                :key="wp.id"
                class="interactive-map-pin"
                :class="[
                  wp.type,
                  'tooltip-' + (wp.tooltipPos || 'top'),
                  { active: selectedWaypoint && selectedWaypoint.id === wp.id },
                  { hovered: hoveredWaypoint && hoveredWaypoint.id === wp.id }
                ]"
                :style="{ top: wp.posY + '%', left: wp.posX + '%' }"
                @click="handlePinClick(wp)"
                @mouseenter="hoveredWaypoint = wp"
                @mouseleave="hoveredWaypoint = null"
              >
                <!-- Pulse Glow Ring -->
                <div class="pin-pulse"></div>

                <!-- Pin Core Dot / Icon -->
                <div class="pin-core">
                  <span v-if="wp.type === 'start_finish'">🏁</span>
                  <span v-else-if="wp.type === 'beer'">🍺</span>
                  <span v-else-if="wp.type === 'nature'">🌊</span>
                  <span v-else-if="wp.type === 'cultural'">🎩</span>
                  <span v-else-if="wp.type === 'landmark'">⚽</span>
                  <span v-else>📍</span>
                </div>

                <!-- Floating Tooltip on Hover -->
                <div class="pin-tooltip font-condensed">
                  <span class="tooltip-name">{{ wp.name }}</span>
                  <span class="tooltip-km">KM {{ wp.actualKm.toFixed(2).replace('.', ',') }}</span>
                </div>
              </div>

              <!-- Map Overlay Legend Floating Card -->
              <div class="map-floating-legend font-condensed">
                <div class="legend-chip"><span class="chip-dot green"></span> Largada/Chegada</div>
                <div class="legend-chip"><span class="chip-dot amber"></span> PCA</div>
                <div class="legend-chip"><span class="chip-dot blue"></span> Atrativos</div>
              </div>
            </div>
          </div>

          <!-- 2. SATELLITE INTERACTIVE LEAFLET VIEW -->
          <div v-show="currentView === 'satellite'" class="satellite-map-container">
            <div id="leafletMap" class="leaflet-map-element"></div>
            <div class="satellite-info-overlay">
              <span class="badge-live">🛰️ SATÉLITE</span>
              <small>Arraste e dê zoom para explorar o relevo real da Serra da Mantiqueira</small>
            </div>
          </div>

          <!-- 3. DETAILED ELEVATION PROFILE VIEW -->
          <div v-show="currentView === 'elevation'" class="elevation-detailed-container">
            <!-- Hero Header & Stats Ribbon -->
            <div class="elevation-hero-header">
              <h3 class="font-slab ele-big-title">PERFIL ALTIMÉTRICO DETALHADO</h3>
              <p class="font-slab ele-big-sub">
                Acompanhe o relevo real da serra, os pontos de chopp e os desafios de cada quilômetro.
              </p>

              <!-- 4 Summary Stat Cards Ribbon -->
              <div class="ele-stats-ribbon">
                <div class="ele-stat-card">
                  <span class="ele-stat-icon">📏</span>
                  <div class="ele-stat-body">
                    <span class="ele-stat-label font-condensed">DISTÂNCIA TOTAL</span>
                    <span class="ele-stat-val font-slab">6,37 <small>KM</small></span>
                  </div>
                </div>

                <div class="ele-stat-card">
                  <span class="ele-stat-icon">⛰️</span>
                  <div class="ele-stat-body">
                    <span class="ele-stat-label font-condensed">GANHO ELEVAÇÃO</span>
                    <span class="ele-stat-val font-slab">+195 <small>M</small></span>
                  </div>
                </div>

                <div class="ele-stat-card">
                  <span class="ele-stat-icon">🏔️</span>
                  <div class="ele-stat-body">
                    <span class="ele-stat-label font-condensed">PONTO MAIS ALTO</span>
                    <span class="ele-stat-val font-slab">975 <small>M (PICO)</small></span>
                  </div>
                </div>

                <div class="ele-stat-card">
                  <span class="ele-stat-icon">🏞️</span>
                  <div class="ele-stat-body">
                    <span class="ele-stat-label font-condensed">PONTO MAIS BAIXO</span>
                    <span class="ele-stat-val font-slab">850 <small>M (VALE)</small></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Live HUD / Cursor Tracking Banner -->
            <div class="ele-live-hud font-condensed" :class="{ active: scrubbedPoint }">
              <div v-if="scrubbedPoint" class="hud-live-content">
                <div class="hud-item"><span class="hud-label">DISTÂNCIA:</span> <strong class="font-slab">KM {{ scrubbedPoint.dist.toFixed(2).replace('.', ',') }}</strong></div>
                <div class="hud-divider"></div>
                <div class="hud-item"><span class="hud-label">ALTITUDE:</span> <strong class="font-slab">{{ Math.round(scrubbedPoint.ele) }} m</strong></div>
                <div class="hud-divider"></div>
                <div class="hud-item"><span class="hud-label">INCLINAÇÃO:</span> <strong class="font-slab">{{ scrubbedGradeText }}</strong></div>
                <div v-if="scrubbedLandmark" class="hud-divider"></div>
                <div v-if="scrubbedLandmark" class="hud-landmark-badge">
                  📍 {{ scrubbedLandmark.name }}
                </div>
              </div>
              <div v-else class="hud-idle-content">
                <span>💡 Toque ou deslize no gráfico para explorar a altimetria em tempo real</span>
              </div>
            </div>

            <!-- Elevation Interactive SVG Area Chart -->
            <div 
              class="elevation-chart-canvas-wrap" 
              @mousemove="handleChartHover" 
              @mouseleave="scrubbedPoint = null"
              @touchstart.passive="handleChartHover"
              @touchmove.passive="handleChartHover"
            >
              <svg class="detailed-ele-svg" viewBox="0 0 940 340">
                <defs>
                  <linearGradient id="eleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#e68a00" stop-opacity="0.9" />
                    <stop offset="35%" stop-color="#b85d19" stop-opacity="0.65" />
                    <stop offset="75%" stop-color="#3d5526" stop-opacity="0.4" />
                    <stop offset="100%" stop-color="#2c271f" stop-opacity="0.08" />
                  </linearGradient>

                  <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.4" />
                  </filter>
                </defs>

                <!-- Horizontal Altitude Grid lines & Labels -->
                <g class="alt-grid-lines">
                  <g v-for="g in altGridLines" :key="g.ele">
                    <line :x1="chartLeft" :y1="g.y" :x2="chartRight" :y2="g.y" stroke="#cfbe9b" stroke-width="1" stroke-dasharray="3 3" />
                    <!-- Altitude Label Capsule on Left -->
                    <rect :x="10" :y="g.y - 10" width="48" height="20" rx="4" fill="#2c271f" fill-opacity="0.88" />
                    <text :x="34" :y="g.y + 4" font-family="'Roboto Condensed', sans-serif" font-size="11" font-weight="900" fill="#f8e5b9" text-anchor="middle">
                      {{ g.label }}
                    </text>
                  </g>
                </g>

                <!-- Vertical Distance Grid lines -->
                <g class="dist-grid-lines">
                  <g v-for="d in distGridLines" :key="d.dist">
                    <line :x1="d.x" :y1="chartTop" :x2="d.x" :y2="chartBottom" stroke="#d5c3a1" stroke-width="1" stroke-dasharray="2 4" stroke-opacity="0.7" />
                  </g>
                </g>

                <!-- Elevation Polygon & Polyline -->
                <polygon :points="elevationPolygonPoints" fill="url(#eleGradient)" />
                <polyline :points="elevationPolylinePoints" stroke="#f5a623" stroke-width="5" fill="none" opacity="0.35" />
                <polyline :points="elevationPolylinePoints" stroke="#1c1b18" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />

                <!-- Waypoint markers & Callout Badges -->
                <g v-for="wp in chartWaypointMarkers" :key="wp.id" class="chart-wp-marker-group" @click="selectWaypointById(wp.id)">
                  <!-- Vertical Leader Line -->
                  <line :x1="wp.chartX" :y1="wp.chartY" :x2="wp.chartX" :y2="wp.badgeY + 13" stroke="#7a4611" stroke-width="1.5" stroke-dasharray="2 2" />
                  
                  <!-- Point on Trail -->
                  <circle :cx="wp.chartX" :cy="wp.chartY" r="5" fill="#f5a623" stroke="#1c1b18" stroke-width="2" />

                  <!-- Floating Badge Capsule -->
                  <g :transform="`translate(${wp.chartX - (wp.align === 'start' ? 0 : (wp.align === 'end' ? wp.badgeW : wp.badgeW / 2))}, ${wp.badgeY})`" filter="url(#badgeShadow)">
                    <rect 
                      :width="wp.badgeW" 
                      height="26" 
                      rx="6" 
                      :fill="wp.type === 'beer' ? '#fff2cc' : (wp.type === 'start_finish' ? '#d9ead3' : (wp.type === 'peak' ? '#fbe5d6' : '#1c1b18'))" 
                      :stroke="wp.type === 'beer' ? '#7f6000' : (wp.type === 'start_finish' ? '#274e13' : (wp.type === 'peak' ? '#b45f06' : '#d9822b'))" 
                      stroke-width="1.8"
                    />
                    <!-- Icon & Name Text -->
                    <text 
                      :x="wp.badgeW / 2" 
                      y="14" 
                      font-family="'Roboto Condensed', sans-serif" 
                      font-size="11" 
                      font-weight="900" 
                      :fill="wp.type === 'beer' ? '#594300' : (wp.type === 'start_finish' ? '#1b3a0c' : (wp.type === 'peak' ? '#783f04' : '#ffffff'))" 
                      text-anchor="middle"
                      dominant-baseline="central"
                    >
                      {{ wp.icon }} {{ wp.name }}
                    </text>
                  </g>
                </g>

                <!-- Distance Scale Labels (X-Axis) at Bottom -->
                <g class="x-axis-labels">
                  <g v-for="d in distGridLines" :key="'label-' + d.dist">
                    <text :x="d.x" y="306" font-family="'Roboto Condensed', sans-serif" font-size="12" font-weight="900" fill="#1c1b18" text-anchor="middle">
                      {{ d.label }}
                    </text>
                    <text v-if="d.sub" :x="d.x" y="322" font-family="'Roboto Condensed', sans-serif" font-size="10" font-weight="800" fill="#7a684c" text-anchor="middle">
                      {{ d.sub }}
                    </text>
                  </g>
                </g>

                <!-- Active Scrub Indicator Crosshair & Hover Ball -->
                <g v-if="scrubbedPoint" class="scrub-crosshair">
                  <line :x1="scrubChartX" :y1="chartTop" :x2="scrubChartX" :y2="chartBottom" stroke="#c00000" stroke-width="2" stroke-dasharray="3 3" />
                  <circle :cx="scrubChartX" :cy="scrubChartY" r="8" fill="none" stroke="#c00000" stroke-width="2" opacity="0.6" />
                  <circle :cx="scrubChartX" :cy="scrubChartY" r="5" fill="#c00000" stroke="#ffffff" stroke-width="2" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Lightbox Modal -->
    <div v-if="openFullscreen" class="lightbox-overlay" @click.self="openFullscreen = false">
      <div class="lightbox-container vintage-card">
        <button class="lightbox-close" @click="openFullscreen = false">✕</button>
        <div class="lightbox-header font-slab">
          ★ MAPA OFICIAL DO CIRCUITO BEER RUN DOS GORDOS (6,37 KM) ★
        </div>
        <div class="lightbox-image-wrap">
          <img src="/images/route/illustrated_map.jpg" alt="Mapa Ilustrado em Alta Resolução" class="lightbox-img" />
        </div>
      </div>
    </div>

    <!-- Mobile Waypoint Detail Popup Modal -->
    <div 
      v-if="showWaypointModal && selectedWaypoint" 
      class="waypoint-modal-backdrop animate-fade-in"
      @click.self="showWaypointModal = false"
    >
      <div class="waypoint-modal-card vintage-card animate-slide-up">
        <div class="modal-card-header">
          <div class="spotlight-badge" :class="selectedWaypoint.type">
            {{ getWaypointTypeLabel(selectedWaypoint.type) }}
          </div>
          <div class="modal-header-right">
            <div class="spotlight-km font-slab">
              KM {{ selectedWaypoint.actualKm.toFixed(2).replace('.', ',') }}
            </div>
            <button class="modal-close-btn" @click="showWaypointModal = false" aria-label="Fechar">✕</button>
          </div>
        </div>

        <div v-if="getWaypointImage(selectedWaypoint.id)" class="spotlight-thumb-wrap">
          <img :src="getWaypointImage(selectedWaypoint.id)" :alt="selectedWaypoint.name" class="spotlight-img" />
          <div class="spotlight-ele-tag font-condensed">
            ⛰️ {{ selectedWaypoint.actualEle }}m altitude
          </div>
        </div>

        <h3 class="spotlight-title font-slab">{{ selectedWaypoint.name }}</h3>
        <div class="spotlight-sub font-condensed">{{ selectedWaypoint.subtitle }}</div>
        <p class="spotlight-desc">{{ selectedWaypoint.desc }}</p>

        <button class="modal-action-btn font-slab" @click="showWaypointModal = false">
          FECHAR INFORMAÇÕES
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import trackData from '../trackGeoData.json'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const currentView = ref('illustrated')
const openFullscreen = ref(false)
const hoveredWaypoint = ref(null)
const scrubbedPoint = ref(null)
const showWaypointModal = ref(false)

function handlePinClick(wp) {
  selectWaypoint(wp)
  if (window.innerWidth <= 960) {
    showWaypointModal.value = true
  }
}

function handleListClick(wp) {
  selectWaypoint(wp)
  if (window.innerWidth <= 960) {
    showWaypointModal.value = true
    const mapWrap = document.querySelector('.route-map-wrapper')
    if (mapWrap) {
      mapWrap.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

// Waypoints configured with precise relative positions (%) matching the illustrated map artwork
const mapWaypoints = [
  {
    id: 'start-finish',
    name: 'Sítio dos Gordos',
    subtitle: 'Largada & Chegada Oficial',
    type: 'start_finish',
    actualKm: 0.0,
    actualEle: 952,
    posX: 24.2,
    posY: 88.7,
    tooltipPos: 'bottom-left',
    desc: 'Local de concentração, largada oficial, hidratação de boas-vindas e chegada triunfal com churrasco e cerveja no final.',
    targetLat: -22.14189,
    targetLon: -45.60297
  },
  {
    id: 'cachoeira',
    name: 'Cachoeira do Raimundo',
    subtitle: 'Queda d\'Água & Natureza',
    type: 'nature',
    actualKm: 0.65,
    actualEle: 954,
    posX: 55.0,
    posY: 91.5,
    tooltipPos: 'bottom-right',
    desc: 'Passagem bucólica ao lado da cachoeira com o som relaxante das águas de fezes descendo da serra.',
    targetLat: -22.142575,
    targetLon: -45.59794
  },
  {
    id: 'encruzilhada',
    name: 'Encruzilhada da Macumba',
    subtitle: 'Ponto Místico & Cultural',
    type: 'cultural',
    actualKm: 1.15,
    actualEle: 905,
    posX: 85.6,
    posY: 86.4,
    tooltipPos: 'left',
    desc: 'Curva histórica na encruzilhada de terra no setor sudeste, ponto lendário guardado pelo malandro Zé Pilintra.',
    targetLat: -22.141158,
    targetLon: -45.593281
  },
  {
    id: 'bairro-buraco',
    name: 'Bairro do Buraco',
    subtitle: 'Trecho de Subida Rústica',
    type: 'area',
    actualKm: 1.71,
    actualEle: 869,
    posX: 67.8,
    posY: 73.5,
    tooltipPos: 'left',
    desc: 'Estradinha rústica de chão batido margeada por colinas verdejantes e ar puro da serra.',
    targetLat: -22.138687,
    targetLon: -45.595369
  },
  {
    id: 'apoio-tio',
    name: 'Ponto de Apoio - Casa do Tio',
    subtitle: '1º Ponto de Chopp Gelado',
    type: 'beer',
    actualKm: 2.19,
    actualEle: 871,
    posX: 71.0,
    posY: 62.4,
    tooltipPos: 'left',
    desc: 'Primeira parada para hidratação gelada! Dica: passem longe do pé de pimenta!',
    targetLat: -22.134711,
    targetLon: -45.594115
  },
  {
    id: 'bairro-atirado',
    name: 'Bairro do Atirado',
    subtitle: 'Região Alta da Comunidade',
    type: 'area',
    actualKm: 3.03,
    actualEle: 881,
    posX: 58.5,
    posY: 33.5,
    tooltipPos: 'right',
    desc: 'Bairro acolhedor no alto da serra com uma linda vista panorâmica de todo o vale.',
    targetLat: -22.128148,
    targetLon: -45.595953
  },
  {
    id: 'igreja',
    name: 'Igrejinha do Atirado',
    subtitle: 'Capela Histórica',
    type: 'cultural',
    actualKm: 3.22,
    actualEle: 876,
    posX: 59.0,
    posY: 26.5,
    tooltipPos: 'right',
    desc: 'Capela colonial centenária que é o marco visual e cultural mais marcante do bairro.',
    targetLat: -22.1265,
    targetLon: -45.5962
  },
  {
    id: 'quadra-futsal',
    name: 'Quadra de Futsal do Atirado',
    subtitle: 'Ponto Extremo Norte (Retorno)',
    type: 'landmark',
    actualKm: 3.57,
    actualEle: 851,
    posX: 47.5,
    posY: 19.0,
    tooltipPos: 'top',
    desc: 'Ponto mais ao norte e virada da prova, iniciando o trajeto de retorno pela encosta oeste.',
    targetLat: -22.124869,
    targetLon: -45.599015
  },
  {
    id: 'apoio-morro-carater',
    name: 'Ponto de Apoio - Morro do Caráter',
    subtitle: '2º Ponto de Chopp Gelado',
    type: 'beer',
    actualKm: 4.00,
    actualEle: 861,
    posX: 32.5,
    posY: 49.3,
    tooltipPos: 'left',
    desc: 'Último ponto de apoio antes do Morro do Caráter. Dizem que é subindo que se cria caráter.',
    targetLat: -22.127745,
    targetLon: -45.599515
  }
]

const selectedWaypoint = ref(mapWaypoints[0])

let leafletMapInstance = null
let leafletPolyline = null

function getClosestPathPoint(targetDist) {
  let closest = trackData.pathPoints[0]
  let minDiff = 9999
  for (const pt of trackData.pathPoints) {
    const diff = Math.abs(pt.dist - targetDist)
    if (diff < minDiff) {
      minDiff = diff
      closest = pt
    }
  }
  return closest
}

function selectWaypoint(wp) {
  selectedWaypoint.value = wp
  const closestPt = getClosestPathPoint(wp.actualKm)
  scrubbedPoint.value = {
    ...closestPt,
    dist: wp.actualKm,
    ele: wp.actualEle,
    matchedLandmark: wp
  }
}

function selectWaypointById(id) {
  const wp = mapWaypoints.find(w => w.id === id)
  if (wp) {
    selectWaypoint(wp)
  }
}

function getWaypointTypeLabel(type) {
  switch (type) {
    case 'start_finish': return '🏁 LARGADA & CHEGADA'
    case 'beer': return '🍺 PONTO DE CHOPP & HIDRATAÇÃO'
    case 'nature': return '🌊 ATRATIVO NATURAL'
    case 'cultural': return '🎩 PONTO CULTURAL'
    case 'landmark': return '⚽ MARCO ESPORTIVO'
    default: return '📍 PONTO DE INTERESSE'
  }
}

function getWaypointImage(id) {
  switch (id) {
    case 'encruzilhada': return '/images/route/ze_pilintra.jpg'
    case 'cachoeira': return '/images/route/waterfall.jpg'
    case 'igreja': return '/images/route/church.jpg'
    case 'quadra-futsal': return '/images/route/futsal.jpg'
    case 'apoio-tio':
    case 'apoio-morro-carater': return '/images/route/beer_mug.jpg'
    default: return null
  }
}

// Elevation Chart Dimensions & Constants
const chartLeft = 65
const chartRight = 885
const chartWidth = chartRight - chartLeft
const chartTop = 45
const chartBottom = 280
const chartHeight = chartBottom - chartTop
const minE = 840
const maxE = 985

// Horizontal Altitude Grid Lines
const altGridLines = [
  { ele: 975, label: '975m', tag: 'PICO', y: Number((chartBottom - ((975 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
  { ele: 950, label: '950m', tag: null, y: Number((chartBottom - ((950 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
  { ele: 925, label: '925m', tag: null, y: Number((chartBottom - ((925 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
  { ele: 900, label: '900m', tag: null, y: Number((chartBottom - ((900 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
  { ele: 875, label: '875m', tag: null, y: Number((chartBottom - ((875 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
  { ele: 850, label: '850m', tag: 'BASE', y: Number((chartBottom - ((850 - minE) / (maxE - minE)) * chartHeight).toFixed(1)) },
]

// Vertical Distance Grid Lines
const distGridLines = [
  { dist: 0, label: '0 km', sub: 'Sítio', x: chartLeft },
  { dist: 1.0, label: '1 km', sub: '', x: Number((chartLeft + (1.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 2.0, label: '2 km', sub: '', x: Number((chartLeft + (2.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 3.0, label: '3 km', sub: 'Atirado', x: Number((chartLeft + (3.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 4.0, label: '4 km', sub: 'Chopp 2', x: Number((chartLeft + (4.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 5.0, label: '5 km', sub: '', x: Number((chartLeft + (5.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 6.0, label: '6 km', sub: '', x: Number((chartLeft + (6.0 / trackData.totalDist) * chartWidth).toFixed(1)) },
  { dist: 6.37, label: '6,37 km', sub: 'Chegada', x: chartRight },
]

// Waypoint markers for elevation chart with staggered positions
const chartWaypointMarkers = computed(() => {
  return [
    {
      id: 'start-finish',
      name: 'Largada',
      icon: '🏁',
      type: 'start_finish',
      km: 0.0,
      ele: 952,
      chartX: chartLeft,
      chartY: Number((chartBottom - ((952 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 20,
      align: 'start',
      badgeW: 84
    },
    {
      id: 'cachoeira',
      name: 'Cachoeira',
      icon: '🌊',
      type: 'nature',
      km: 0.65,
      ele: 954,
      chartX: Number((chartLeft + (0.65 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((954 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 55,
      align: 'middle',
      badgeW: 92
    },
    {
      id: 'encruzilhada',
      name: 'Macumba',
      icon: '🎩',
      type: 'cultural',
      km: 1.15,
      ele: 905,
      chartX: Number((chartLeft + (1.15 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((905 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 105,
      align: 'middle',
      badgeW: 90
    },
    {
      id: 'bairro-buraco',
      name: 'Buraco',
      icon: '📍',
      type: 'area',
      km: 1.71,
      ele: 869,
      chartX: Number((chartLeft + (1.71 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((869 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 195,
      align: 'middle',
      badgeW: 78
    },
    {
      id: 'apoio-tio',
      name: 'Chopp 1 (Tio)',
      icon: '🍺',
      type: 'beer',
      km: 2.19,
      ele: 871,
      chartX: Number((chartLeft + (2.19 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((871 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 145,
      align: 'middle',
      badgeW: 110
    },
    {
      id: 'bairro-atirado',
      name: 'Atirado',
      icon: '📍',
      type: 'area',
      km: 3.03,
      ele: 881,
      chartX: Number((chartLeft + (3.03 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((881 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 170,
      align: 'middle',
      badgeW: 78
    },
    {
      id: 'igreja',
      name: 'Igrejinha',
      icon: '⛪',
      type: 'cultural',
      km: 3.22,
      ele: 876,
      chartX: Number((chartLeft + (3.22 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((876 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 85,
      align: 'middle',
      badgeW: 90
    },
    {
      id: 'quadra-futsal',
      name: 'Futsal (Base)',
      icon: '⚽',
      type: 'landmark',
      km: 3.57,
      ele: 851,
      chartX: Number((chartLeft + (3.57 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((851 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 215,
      align: 'middle',
      badgeW: 98
    },
    {
      id: 'apoio-morro-carater',
      name: 'Chopp 2 (Caráter)',
      icon: '🍺',
      type: 'beer',
      km: 4.00,
      ele: 861,
      chartX: Number((chartLeft + (4.00 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((861 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 145,
      align: 'middle',
      badgeW: 125
    },
    {
      id: 'pico',
      name: 'Pico da Serra (975m)',
      icon: '⛰️',
      type: 'peak',
      km: 5.50,
      ele: 975,
      chartX: Number((chartLeft + (5.50 / trackData.totalDist) * chartWidth).toFixed(1)),
      chartY: Number((chartBottom - ((975 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 18,
      align: 'middle',
      badgeW: 135
    },
    {
      id: 'chegada',
      name: 'Chegada',
      icon: '🏁',
      type: 'start_finish',
      km: 6.37,
      ele: 952,
      chartX: chartRight,
      chartY: Number((chartBottom - ((952 - minE) / (maxE - minE)) * chartHeight).toFixed(1)),
      badgeY: 20,
      align: 'end',
      badgeW: 84
    }
  ]
})

const elevationPolylinePoints = computed(() => {
  return trackData.pathPoints.map(p => {
    const x = chartLeft + (p.dist / trackData.totalDist) * chartWidth
    const y = chartBottom - ((p.ele - minE) / (maxE - minE)) * chartHeight
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
})

const elevationPolygonPoints = computed(() => {
  const polyline = elevationPolylinePoints.value
  return `${chartLeft},${chartBottom} ${polyline} ${chartRight},${chartBottom}`
})

const scrubChartX = computed(() => {
  if (!scrubbedPoint.value) return chartLeft
  return chartLeft + (scrubbedPoint.value.dist / trackData.totalDist) * chartWidth
})

const scrubChartY = computed(() => {
  if (!scrubbedPoint.value) return chartBottom
  return chartBottom - ((scrubbedPoint.value.ele - minE) / (maxE - minE)) * chartHeight
})

const scrubbedGrade = computed(() => {
  if (!scrubbedPoint.value) return 0
  const idx = trackData.pathPoints.findIndex(p => Math.abs(p.dist - scrubbedPoint.value.dist) < 0.02)
  if (idx < 0) return 0
  const pPrev = trackData.pathPoints[Math.max(0, idx - 4)]
  const pNext = trackData.pathPoints[Math.min(trackData.pathPoints.length - 1, idx + 4)]
  const dDist = (pNext.dist - pPrev.dist) * 1000
  if (dDist === 0) return 0
  const dEle = pNext.ele - pPrev.ele
  return Math.round((dEle / dDist) * 100)
})

const scrubbedGradeText = computed(() => {
  const g = scrubbedGrade.value
  if (g > 7) return `📈 Subida Forte (+${g}%)`
  if (g > 2) return `↗️ Subida Leve (+${g}%)`
  if (g < -7) return `📉 Descida Forte (${g}%)`
  if (g < -2) return `↘️ Descida Leve (${g}%)`
  return `🟢 Trecho Plano (${g >= 0 ? '+' : ''}${g}%)`
})

const scrubbedLandmark = computed(() => {
  if (!scrubbedPoint.value) return null
  if (scrubbedPoint.value.matchedLandmark) return scrubbedPoint.value.matchedLandmark
  return mapWaypoints.find(wp => Math.abs(wp.actualKm - scrubbedPoint.value.dist) < 0.08) || null
})

function handleChartHover(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX
  const posX = clientX - rect.left
  const pct = Math.max(0, Math.min(1, (posX * (940 / rect.width) - chartLeft) / chartWidth))
  const targetDist = pct * trackData.totalDist

  const nearWp = mapWaypoints.find(w => Math.abs(w.actualKm - targetDist) < 0.08)
  if (nearWp) {
    const pt = getClosestPathPoint(nearWp.actualKm)
    scrubbedPoint.value = {
      ...pt,
      dist: nearWp.actualKm,
      ele: nearWp.actualEle,
      matchedLandmark: nearWp
    }
    return
  }

  scrubbedPoint.value = getClosestPathPoint(targetDist)
}

// Leaflet Map Initialization
function initLeafletMap() {
  if (leafletMapInstance) return

  const mapContainer = document.getElementById('leafletMap')
  if (!mapContainer) return

  const latMid = (trackData.pathPoints[0].lat + trackData.pathPoints[Math.floor(trackData.pathPoints.length/2)].lat) / 2
  const lonMid = (trackData.pathPoints[0].lon + trackData.pathPoints[Math.floor(trackData.pathPoints.length/2)].lon) / 2

  leafletMapInstance = L.map('leafletMap', {
    center: [latMid, lonMid],
    zoom: 14,
    zoomControl: true
  })

  // Esri Satellite Layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  }).addTo(leafletMapInstance)

  const latLngs = trackData.pathPoints.map(p => [p.lat, p.lon])

  // Trail Shadow & Glow Polyline
  L.polyline(latLngs, {
    color: '#000000',
    weight: 7,
    opacity: 0.85
  }).addTo(leafletMapInstance)

  leafletPolyline = L.polyline(latLngs, {
    color: '#ff9900',
    weight: 4.5,
    opacity: 1
  }).addTo(leafletMapInstance)

  leafletMapInstance.fitBounds(leafletPolyline.getBounds(), { padding: [25, 25] })

  // Custom Markers
  mapWaypoints.forEach(wp => {
    const marker = L.circleMarker([wp.targetLat, wp.targetLon], {
      radius: wp.type === 'beer' ? 10 : 8,
      fillColor: wp.type === 'beer' ? '#ff9900' : (wp.type === 'start_finish' ? '#27ae60' : '#e74c3c'),
      color: '#ffffff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(leafletMapInstance)

    marker.bindPopup(`
      <div style="font-family: 'Roboto Condensed', sans-serif; text-align: center; padding: 4px;">
        <strong style="font-size: 14px; color: #1c1b18; display: block;">${wp.name}</strong>
        <span style="font-size: 12px; color: #7f6000; font-weight: bold;">KM ${wp.actualKm.toFixed(2)} • ${wp.actualEle}m alt</span>
        <p style="font-size: 11px; margin: 4px 0 0; color: #555;">${wp.desc}</p>
      </div>
    `)
  })
}

watch(currentView, (newVal) => {
  if (newVal === 'satellite') {
    nextTick(() => {
      initLeafletMap()
      setTimeout(() => {
        if (leafletMapInstance) {
          leafletMapInstance.invalidateSize()
        }
      }, 200)
    })
  }
})

onMounted(() => {
  if (currentView.value === 'satellite') {
    initLeafletMap()
  }
})
</script>

<style scoped>
.route-section {
  padding: 60px 0 80px 0;
  background-color: var(--bg-parchment-light);
  border-top: 3px dashed rgba(44, 39, 31, 0.2);
  border-bottom: 3px dashed rgba(44, 39, 31, 0.2);
}

.section-header {
  margin-bottom: 28px;
}

.section-badge {
  display: inline-block;
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  font-weight: 900;
  font-size: 0.85rem;
  letter-spacing: 1px;
  padding: 4px 16px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 1.15rem;
  color: var(--text-muted);
  max-width: 650px;
  margin: 0 auto;
}

/* Controls Bar */
.route-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.view-switch-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: rgba(228, 213, 183, 0.6);
  color: var(--text-dark);
  font-family: var(--font-slab);
  font-weight: 800;
  font-size: 0.88rem;
  padding: 8px 14px;
  border: 1.5px solid var(--accent-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background-color: #ebdcb9;
  transform: translateY(-1px);
}

.tab-btn.active {
  background-color: var(--accent-dark);
  color: #ffffff;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
}

.route-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #ffffff;
  color: var(--accent-dark);
  font-family: var(--font-slab);
  font-weight: 800;
  font-size: 0.85rem;
  padding: 8px 14px;
  border: 1.5px solid var(--accent-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-action-outline:hover {
  background-color: #f5eedc;
  transform: translateY(-1px);
}

.btn-gpx {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #384b28;
  color: #ffffff;
  font-family: var(--font-slab);
  font-weight: 800;
  font-size: 0.95rem;
  padding: 10px 20px;
  border: 2px solid var(--accent-border);
  border-radius: 6px;
  text-decoration: none;
  box-shadow: 2px 2px 0px var(--accent-dark);
  transition: all 0.15s ease;
}

.btn-gpx:hover {
  background-color: #4a6335;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0px var(--accent-dark);
}

/* Main Grid Layout */
.route-main-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

/* Sidebar Styles */
.route-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-widget {
  padding: 16px;
  border-radius: 8px;
}

.metrics-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--accent-dark);
  line-height: 1.1;
}

.metric-value small {
  font-size: 0.75rem;
  color: var(--accent-gold);
}

.metric-divider {
  width: 1px;
  height: 36px;
  background-color: rgba(44, 39, 31, 0.2);
}

/* Spotlight Card */
.waypoint-spotlight-card {
  padding: 18px;
  border-radius: 8px;
  background-color: #fdfaf3;
  border-left: 6px solid var(--accent-gold);
}

.spotlight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.spotlight-badge {
  font-family: var(--font-condensed);
  font-size: 0.75rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--accent-border);
}

.spotlight-badge.beer { background-color: #fff2cc; color: #7f6000; }
.spotlight-badge.start_finish { background-color: #d9ead3; color: #274e13; }
.spotlight-badge.cultural { background-color: #fbe5d6; color: #833c0c; }
.spotlight-badge.nature { background-color: #cfe2f3; color: #0b5394; }
.spotlight-badge.landmark { background-color: #e2f0d9; color: #38761d; }

.spotlight-km {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--accent-dark);
}

.spotlight-thumb-wrap {
  position: relative;
  width: 100%;
  height: 190px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 2px solid var(--accent-border);
  background-color: #f7eedb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spotlight-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.spotlight-ele-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background-color: rgba(28, 27, 24, 0.85);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.spotlight-title {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.spotlight-sub {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--accent-gold);
  margin-bottom: 8px;
}

.spotlight-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.35;
}

/* Waypoints Scroll List */
.waypoints-list-card {
  padding: 16px;
  border-radius: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(44, 39, 31, 0.15);
}

.list-title {
  font-size: 1rem;
  font-weight: 900;
}

.list-badge {
  font-size: 0.75rem;
  font-weight: 900;
  background-color: var(--accent-gold);
  color: var(--accent-dark);
  padding: 2px 8px;
  border-radius: 10px;
}

.waypoints-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.waypoint-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f7eedb;
  border: 1.5px solid var(--accent-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.waypoint-list-item:hover {
  background-color: #f1e0bf;
  transform: translateX(3px);
}

.waypoint-list-item.active {
  background-color: var(--accent-dark);
  color: #ffffff;
  border-color: var(--accent-dark);
}

.waypoint-list-item.active .item-name {
  color: #ffffff;
}

.waypoint-list-item.active .item-meta {
  color: var(--accent-gold);
}

.item-num {
  font-size: 0.9rem;
  font-weight: 900;
  width: 18px;
  text-align: center;
  opacity: 0.6;
}

.item-icon-box {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-dark);
}

.item-meta {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.item-arrow {
  font-size: 1.2rem;
  font-weight: 900;
  opacity: 0.4;
}

/* Map Views Container */
.route-map-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ebdfc4;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.illustrated-map-container {
  position: relative;
  width: 100%;
}

.map-canvas-frame {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eeddbb;
}

.map-art-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

/* Interactive Pins */
.interactive-map-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.interactive-map-pin:hover,
.interactive-map-pin.hovered {
  transform: translate(-50%, -50%) scale(1.22);
  z-index: 25;
}

.interactive-map-pin.active {
  transform: translate(-50%, -50%) scale(1.15);
  z-index: 20;
}

.pin-core {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 2px solid var(--accent-border);
  box-shadow: 1.5px 1.5px 4px rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.interactive-map-pin.active .pin-core {
  box-shadow: 0 0 0 3px var(--accent-gold), 2px 2px 6px rgba(0,0,0,0.45);
}

.interactive-map-pin.beer .pin-core {
  background-color: #fff2cc;
  border-color: #7f6000;
}

.interactive-map-pin.start_finish .pin-core {
  background-color: #d9ead3;
  border-color: #274e13;
}

.interactive-map-pin.cultural .pin-core {
  background-color: #fbe5d6;
  border-color: #833c0c;
}

.interactive-map-pin.nature .pin-core {
  background-color: #cfe2f3;
  border-color: #0b5394;
}

.interactive-map-pin.landmark .pin-core {
  background-color: #e8eaed;
  border-color: #3c4043;
}

.pin-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--accent-gold);
  opacity: 0;
  pointer-events: none;
}

.interactive-map-pin.active .pin-pulse,
.interactive-map-pin:hover .pin-pulse,
.interactive-map-pin.hovered .pin-pulse {
  animation: pingRing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes pingRing {
  0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}

/* Directional Tooltips */
.pin-tooltip {
  position: absolute;
  background-color: rgba(28, 27, 24, 0.95);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 2px 2px 6px rgba(0,0,0,0.5);
  display: none;
  flex-direction: column;
  border: 1px solid var(--accent-gold);
  pointer-events: none;
  z-index: 30;
}

.interactive-map-pin:hover .pin-tooltip,
.interactive-map-pin.hovered .pin-tooltip {
  display: flex;
}

.tooltip-top .pin-tooltip {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.tooltip-bottom .pin-tooltip {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.tooltip-left .pin-tooltip {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  align-items: flex-end;
}

.tooltip-right .pin-tooltip {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  align-items: flex-start;
}

.tooltip-bottom-left .pin-tooltip {
  top: calc(100% + 6px);
  right: 0;
  align-items: flex-end;
}

.tooltip-bottom-right .pin-tooltip {
  top: calc(100% + 6px);
  left: 0;
  align-items: flex-start;
}

.tooltip-top-left .pin-tooltip {
  bottom: calc(100% + 6px);
  right: 0;
  align-items: flex-end;
}

.tooltip-top-right .pin-tooltip {
  bottom: calc(100% + 6px);
  left: 0;
  align-items: flex-start;
}

.tooltip-name {
  font-weight: 800;
  font-size: 0.8rem;
}

.tooltip-km {
  font-size: 0.7rem;
  color: var(--accent-gold);
  font-weight: 700;
}

/* Floating Legend */
.map-floating-legend {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--accent-border);
  display: flex;
  gap: 12px;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: 1px 1px 0px rgba(0,0,0,0.2);
  min-width: 300px;
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.chip-dot.green { background-color: #27ae60; }
.chip-dot.amber { background-color: #d9822b; }
.chip-dot.blue { background-color: #2980b9; }

/* Satellite View */
.satellite-map-container {
  position: relative;
  width: 100%;
  height: 680px;
}

.leaflet-map-element {
  width: 100%;
  height: 100%;
}

.satellite-info-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
  background-color: rgba(28, 27, 24, 0.9);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1.5px solid var(--accent-gold);
}

.badge-live {
  font-family: var(--font-condensed);
  font-weight: 900;
  font-size: 0.85rem;
  color: var(--accent-gold);
}

/* ==========================================================================
   ELEVATION PROFILE VIEW (UPGRADED)
   ========================================================================== */
.elevation-detailed-container {
  padding: 24px 20px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fdfaf3;
}

.elevation-hero-header {
  margin-bottom: 20px;
  text-align: center;
  min-width: 0;
  width: 100%;
}

.ele-header-badge {
  display: inline-block;
  background-color: var(--accent-dark);
  color: var(--accent-gold);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 3px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.ele-big-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.ele-big-sub {
  font-size: 0.95rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 16px auto;
}

/* 4 Summary Stat Cards Ribbon */
.ele-stats-ribbon {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 14px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.ele-stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f7eedb;
  border: 1.5px solid var(--accent-border);
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 1.5px 1.5px 0px rgba(0,0,0,0.15);
  text-align: left;
  min-width: 0;
  box-sizing: border-box;
}

.ele-stat-icon {
  font-size: 1.4rem;
}

.ele-stat-body {
  display: flex;
  flex-direction: column;
}

.ele-stat-label {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.ele-stat-val {
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--text-dark);
  line-height: 1.1;
}

.ele-stat-val small {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--accent-gold);
}

/* Live HUD / Cursor Tracking Banner */
.ele-live-hud {
  background-color: #231f1a;
  color: #ffffff;
  border: 1.5px solid var(--accent-gold);
  border-radius: 6px;
  padding: 8px 16px;
  margin-bottom: 14px;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.hud-live-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
}

.hud-label {
  color: var(--accent-gold);
  font-weight: 800;
  margin-right: 4px;
}

.hud-item strong {
  color: #ffffff;
  font-weight: 800;
}

.hud-divider {
  width: 1px;
  height: 14px;
  background-color: rgba(255, 255, 255, 0.25);
}

.hud-landmark-badge {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
  font-weight: 900;
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 12px;
}

.hud-idle-content {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 700;
}

/* Elevation Canvas & SVG Frame */
.elevation-chart-canvas-wrap {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: linear-gradient(180deg, #fffbf2 0%, #f4ebda 100%);
  border: 2px solid var(--accent-border);
  border-radius: 8px;
  padding: 12px 6px 6px 6px;
  cursor: crosshair;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 2px 2px 0px rgba(0,0,0,0.15);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #d9822b #e8dcc4;
}

.elevation-chart-canvas-wrap::-webkit-scrollbar {
  height: 6px;
}

.elevation-chart-canvas-wrap::-webkit-scrollbar-track {
  background: #e8dcc4;
  border-radius: 3px;
}

.elevation-chart-canvas-wrap::-webkit-scrollbar-thumb {
  background: #d9822b;
  border-radius: 3px;
}

.detailed-ele-svg {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .detailed-ele-svg {
    min-width: 580px;
    width: 580px;
    flex-shrink: 0;
  }

  .waypoints-list-card {
    width: 92vw;
  }
}

.chart-wp-marker-group {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.chart-wp-marker-group:hover {
  transform: translateY(-2px);
}

@media (max-width: 900px) {
  .ele-stats-ribbon {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .elevation-detailed-container {
    padding: 16px 10px;
  }
}

/* Lightbox Modal */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-container {
  position: relative;
  background-color: #eeddbb;
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--accent-dark);
  color: #ffffff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  z-index: 10;
}

.lightbox-header {
  font-size: 1.1rem;
  font-weight: 900;
  text-align: center;
  margin-bottom: 12px;
  color: var(--accent-dark);
}

.lightbox-image-wrap {
  overflow-y: auto;
  text-align: center;
}

.lightbox-img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Mobile Waypoint Modal Popup */
.waypoint-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.waypoint-modal-card {
  position: relative;
  background-color: #fdfaf3;
  border-radius: 12px;
  max-width: 440px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 22px 18px 18px 18px;
  border-left: 6px solid var(--accent-gold);
  border-top: 2px solid var(--accent-border);
  border-right: 2px solid var(--accent-border);
  border-bottom: 3px solid var(--accent-border);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
}

.modal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.modal-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-close-btn {
  background: var(--accent-dark);
  color: #ffffff;
  border: 1.5px solid var(--accent-gold);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.modal-close-btn:hover {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
  transform: scale(1.1);
}

.modal-action-btn {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  background-color: var(--accent-dark);
  color: #ffffff;
  border: 2px solid var(--accent-gold);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 900;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.modal-action-btn:hover {
  background-color: var(--accent-gold);
  color: var(--accent-dark);
}

/* Responsive */
@media (max-width: 960px) {
  .route-main-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }

  .route-map-wrapper {
    order: 1;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }

  .route-sidebar {
    order: 2;
  }

  .waypoint-spotlight-card.desktop-only {
    display: none !important;
  }

  .pin-tooltip {
    display: none !important;
  }

  .route-controls-bar {
    padding: 6px 8px;
    margin-bottom: 12px;
  }

  .view-switch-tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    width: 100%;
  }

  .tab-btn,
  .btn-action-outline {
    width: 100%;
    margin-left: 0;
    padding: 7px 6px;
    font-size: 0.78rem;
    gap: 4px;
    justify-content: center;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .tab-btn,
  .btn-action-outline {
    font-size: 0.74rem;
    padding: 6px 4px;
    gap: 3px;
  }

  .section-header {
    margin-bottom: 14px;
  }

  .section-badge {
    font-size: 0.72rem;
    padding: 3px 10px;
    margin-bottom: 6px;
  }

  .section-title {
    font-size: 1.45rem;
    margin-bottom: 0.6rem;
  }

  .section-subtitle {
    font-size: 0.9rem;
  }
}
</style>
