<template>
  <header class="navbar-header">
    <div class="container navbar-container">
      <a href="#" class="brand-logo">
        <img src="/logo.png" alt="BEER RUN DOS GORDOS" class="logo-img" />
      </a>

      <!-- Desktop Navigation -->
      <nav class="nav-menu-desktop">
        <a href="#manifesto" class="nav-link">MANIFESTO</a>
        <a href="#percurso" class="nav-link">PERCURSO</a>
        <a href="#kit" class="nav-link">KIT ATLETA</a>
        <a href="#atletas" class="nav-link">ATLETAS</a>
        <a href="#inscricoes" class="nav-link">INSCRIÇÕES</a>
        <a href="#contato" class="nav-link">CONTATO</a>
      </nav>

      <!-- Mobile Toggle Button -->
      <button class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menu">
        <i :class="mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
      </button>
    </div>

    <!-- Mobile Navigation Drawer -->
    <transition name="fade">
      <nav v-if="mobileMenuOpen" class="nav-menu-mobile">
        <a href="#manifesto" class="mobile-link" @click="mobileMenuOpen = false">MANIFESTO</a>
        <a href="#percurso" class="mobile-link" @click="mobileMenuOpen = false">PERCURSO</a>
        <a href="#kit" class="mobile-link" @click="mobileMenuOpen = false">KIT ATLETA</a>
        <a href="#atletas" class="mobile-link" @click="mobileMenuOpen = false">ATLETAS</a>
        <a href="#inscricoes" class="mobile-link" @click="mobileMenuOpen = false">INSCRIÇÕES</a>
        <a href="#contato" class="mobile-link" @click="mobileMenuOpen = false">CONTATO</a>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>

<style scoped>
.navbar-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgb(253 230 182 / 30%);
  backdrop-filter: blur(6px);
  border-bottom: 3px double #ad9b7e94;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.nav-menu-desktop {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-dark);
  text-decoration: none;
  letter-spacing: 0.5px;
  position: relative;
  padding: 4px 0;
  transition: color 0.2s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 2px;
  background-color: var(--accent-gold);
  transition: width 0.2s ease;
}

.nav-link:hover {
  color: var(--accent-gold-hover);
}

.nav-link:hover::after {
  width: 100%;
}

.mobile-toggle {
  display: none;
  background: none;
  border: 2px solid var(--accent-border);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 1.25rem;
  color: var(--text-dark);
  cursor: pointer;
}

.nav-menu-mobile {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-parchment-dark);
  padding: 16px;
  border-top: 2px solid var(--accent-border);
}

.mobile-link {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text-dark);
  text-decoration: none;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(0,0,0,0.15);
}

.mobile-link:last-child {
  border-bottom: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-menu-desktop {
    display: none;
  }
  .mobile-toggle {
    display: block;
  }
}
</style>
