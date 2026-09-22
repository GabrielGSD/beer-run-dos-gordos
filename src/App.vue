<template>
  <!-- Tela Dedicada da Staff (Tela Cheia / Mobile Native) -->
  <StaffDashboard
    v-if="isStaffMode"
    @exit-staff="exitStaffMode"
  />

  <!-- Tela Dedicada de Inscrição Oficial (para lista de espera e links diretos) -->
  <OfficialRegistrationPage
    v-else-if="isOfficialRegistrationMode"
    @go-home="exitOfficialRegistrationMode"
  />

  <!-- Site Público Oficial -->
  <div v-else class="app-wrapper">
    <Navbar @open-official-registration="enterOfficialRegistrationMode" />

    <main>
      <HeroSection @open-registration="openRegistration" />
      <HighlightRibbon />
      <StatsSection />
      <RouteSection />
      <SponsorsSection @open-sponsorship="openSponsorship" />
      <KitSection />
      <ManifestoSection @open-registration="openRegistration" />
      <ConfirmedAthletesSection @open-registration="openRegistration" />
    </main>

    <Footer
      @open-registration="openRegistration"
      @open-sponsorship="openSponsorship"
      @open-staff="enterStaffMode"
      @open-official-registration="enterOfficialRegistrationMode"
    />

    <RegistrationModal :is-open="isRegistrationOpen" @close="isRegistrationOpen = false" />
    <SponsorshipModal :is-open="isSponsorshipOpen" @close="isSponsorshipOpen = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from './components/Navbar.vue'
import HeroSection from './components/HeroSection.vue'
import HighlightRibbon from './components/HighlightRibbon.vue'
import ManifestoSection from './components/ManifestoSection.vue'
import StatsSection from './components/StatsSection.vue'
import RouteSection from './components/RouteSection.vue'
import KitSection from './components/KitSection.vue'
import ConfirmedAthletesSection from './components/ConfirmedAthletesSection.vue'
import SponsorsSection from './components/SponsorsSection.vue'
import Footer from './components/Footer.vue'
import RegistrationModal from './components/RegistrationModal.vue'
import SponsorshipModal from './components/SponsorshipModal.vue'
import StaffDashboard from './components/StaffDashboard.vue'
import OfficialRegistrationPage from './components/OfficialRegistrationPage.vue'
import { useAthletes } from './composables/useAthletes.js'
import { trackRegistrationClick, trackSponsorshipClick } from './services/analytics.js'

const { isSoldOut } = useAthletes()

const isRegistrationOpen = ref(false)
const isSponsorshipOpen = ref(false)
const isStaffMode = ref(false)
const isOfficialRegistrationMode = ref(false)

function openRegistration(source = 'geral') {
  isRegistrationOpen.value = true
  trackRegistrationClick(source, isSoldOut.value)
}

function openSponsorship(source = 'geral') {
  isSponsorshipOpen.value = true
  trackSponsorshipClick(source)
}

function enterStaffMode() {
  isStaffMode.value = true
  isOfficialRegistrationMode.value = false
  if (window.location.hash !== '#staff') {
    window.location.hash = '#staff'
  }
}

function exitStaffMode() {
  isStaffMode.value = false
  if (window.location.hash === '#staff') {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

function enterOfficialRegistrationMode() {
  isOfficialRegistrationMode.value = true
  isStaffMode.value = false
  if (!window.location.hash.startsWith('#inscricao')) {
    window.location.hash = '#inscricao'
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function exitOfficialRegistrationMode() {
  isOfficialRegistrationMode.value = false
  if (window.location.hash.startsWith('#inscricao') || window.location.hash.startsWith('#/inscricao')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleHashCheck() {
  const hash = window.location.hash || ''
  if (hash === '#staff') {
    isStaffMode.value = true
    isOfficialRegistrationMode.value = false
  } else if (hash.startsWith('#inscricao') || hash.startsWith('#/inscricao') || hash.startsWith('#cadastro')) {
    isOfficialRegistrationMode.value = true
    isStaffMode.value = false
  } else {
    isStaffMode.value = false
    isOfficialRegistrationMode.value = false
  }
}

onMounted(() => {
  handleHashCheck()
  window.addEventListener('hashchange', handleHashCheck)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashCheck)
})
</script>

<style>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
