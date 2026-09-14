<template>
  <section id="patrocinadores" class="sponsors-strip-section dark-ribbon">
    <div class="sponsors-container">
      <div class="sponsors-header">
        <span class="header-line"></span>
        <h3 class="sponsors-heading font-slab">
          <span>★</span> PATROCINADORES OFICIAIS <span>★</span>
        </h3>
        <span class="header-line"></span>
      </div>

      <!-- Carousel / Marquee Track Wrapper -->
      <div class="marquee-wrapper" @mouseenter="isPaused = true" @mouseleave="isPaused = false">
        <div :class="['marquee-track', { 'is-paused': isPaused }]">
          <!-- First set of logos -->
          <div
            v-for="(sponsor, index) in displaySponsors"
            :key="'s1-' + index"
            class="sponsor-logo-item"
            :title="sponsor.name"
          >
            <img
              :src="sponsor.logo"
              :alt="sponsor.name"
              class="sponsor-img"
              loading="lazy"
            />
          </div>

          <!-- Duplicate set for seamless infinite loop -->
          <div
            v-for="(sponsor, index) in displaySponsors"
            :key="'s2-' + index"
            class="sponsor-logo-item"
            :title="sponsor.name"
            aria-hidden="true"
          >
            <img
              :src="sponsor.logo"
              :alt="sponsor.name"
              class="sponsor-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <!-- Discreet CTA for new sponsors -->
      <div class="sponsors-footer-cta font-condensed">
        <span>QUER SUA MARCA NA BEER RUN DOS GORDOS?</span>
        <a
          href="https://wa.me/5535997500430?text=Ol%C3%A1!%20Tenho%20interesse%20em%20ser%20um%20patrocinador%20da%20Beer%20Run%20dos%20Gordos!"
          target="_blank"
          rel="noopener noreferrer"
          class="sponsor-link"
        >
          SEJA UM PATROCINADOR <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const isPaused = ref(false)

// Sponsor list - Easily add new sponsor logos here
const sponsorsList = ref([
  {
    name: 'Delícias da Vó Cila',
    logo: '/images/logo_quitanda.png',
  },
  {
    name: 'Padaria Santa Rita',
    logo: '/images/logo_padaria.png',
  },
  {
    name: 'MM Decorações',
    logo: '/images/logo_mmdecoracoes.png',
  },
  {
    name: 'Felipe Montagens',
    logo: '/images/logo_gordinho.png',
  },
  {
    name: 'Omna Tech',
    logo: '/images/logo_omna.png',
  },
])

// Multiply the list to ensure a smooth continuous loop marquee
const displaySponsors = computed(() => {
  // If there are few logos (like 2), repeat them to fill the marquee track nicely
  const list = sponsorsList.value
  if (list.length <= 2) {
    return [...list, ...list, ...list, ...list]
  }
  if (list.length <= 4) {
    return [...list, ...list]
  }
  return list
})
</script>

<style scoped>
.sponsors-strip-section {
  background-color: #12100e;
  padding: 28px 0 22px 0;
  border-top: 2px solid rgba(217, 130, 43, 0.4);
  border-bottom: 2px solid rgba(217, 130, 43, 0.4);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
}

.sponsors-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header */
.sponsors-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 600px;
  margin-bottom: 18px;
}

.header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(217, 130, 43, 0.5), transparent);
}

.sponsors-heading {
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--accent-gold);
  text-transform: uppercase;
  white-space: nowrap;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sponsors-heading span {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Marquee / Carousel Track */
.marquee-wrapper {
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 10px 0;
  /* Smooth fade mask at edges */
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
}

.marquee-track {
  display: flex;
  align-items: center;
  gap: 30px;
  width: max-content;
  animation: marquee-scroll 30s linear infinite;
  will-change: transform;
}

.marquee-track.is-paused {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* Individual Logo Item */
.sponsor-logo-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  min-width: 120px;
  padding: 4px 16px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, filter 0.25s ease;
  cursor: pointer;
}

.sponsor-logo-item:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(217, 130, 43, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.sponsor-img {
  height: 80%;
  width: auto;
  max-width: 220px;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  transition: filter 0.25s ease, transform 0.25s ease;
}

.sponsor-logo-item:hover .sponsor-img {
  filter: drop-shadow(0 4px 12px rgba(217, 130, 43, 0.4));
}

/* Footer CTA Link */
.sponsors-footer-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #9e9382;
  flex-wrap: wrap;
}

.sponsor-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px dashed var(--accent-gold);
  padding-bottom: 1px;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.sponsor-link:hover {
  color: var(--accent-amber);
  border-bottom-style: solid;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sponsors-strip-section {
    padding: 22px 0 18px 0;
  }

  .marquee-track {
    gap: 10px;
    animation-duration: 25s;
  }

  .sponsor-logo-item {
    height: 120px;
    min-width: 100px;
    padding: 4px 12px;
  }

  .sponsor-img {
    height: 80%;
    max-width: none;
    border-radius: 8px;
  }

  .sponsors-heading {
    font-size: 0.92rem;
    letter-spacing: 1.5px;
  }

  .sponsors-footer-cta {
    font-size: 0.82rem;
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }
}
</style>
