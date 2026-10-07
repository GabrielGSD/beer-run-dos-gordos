<template>
  <main v-if="isPaymentReturn" class="payment-return-page">
    <PaymentStatusPage @go-home="exitPaymentReturn" />
  </main>
  <!-- Tela Dedicada da Staff (Tela Cheia / Mobile Native) -->
  <StaffDashboard
    v-else-if="isStaffMode"
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

    <SponsorshipModal :is-open="isSponsorshipOpen" @close="isSponsorshipOpen = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PaymentStatusPage from './components/PaymentStatusPage.vue'
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
import SponsorshipModal from './components/SponsorshipModal.vue'
import StaffDashboard from './components/StaffDashboard.vue'
import OfficialRegistrationPage from './components/OfficialRegistrationPage.vue'
import { useAthletes } from './composables/useAthletes.js'
import { trackPageView, trackRegistrationClick, trackSponsorshipClick } from './services/analytics.js'

const { isSoldOut } = useAthletes()

const isPaymentReturn = ref(window.location.pathname === '/pagamento-concluido')
function exitPaymentReturn() { window.location.assign('/') }
const isSponsorshipOpen = ref(false)
const isStaffMode = ref(false)
const isOfficialRegistrationMode = ref(false)

function openRegistration(source = 'geral') {
  trackRegistrationClick(source, isSoldOut.value)
  enterOfficialRegistrationMode()
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
  trackPageView()
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
  trackPageView()
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
  trackPageView()
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
.payment-return-page {
  min-height: 100vh;
  min-height: 100svh;
  background-color: var(--bg-parchment);
  background-image: linear-gradient(rgb(247 241 228 / 60%), rgb(247 241 228)), url(/bg02.jpg);
  background-size: cover;
  background-position: top center;
  background-repeat: no-repeat;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
