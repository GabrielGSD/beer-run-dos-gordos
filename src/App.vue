<template>
  <div class="app-wrapper">
    <Navbar />

    <main>
      <HeroSection @open-registration="openRegistration" />
      <HighlightRibbon />
      <StatsSection />
      <RouteSection />
      <SponsorsSection />
      <KitSection />
      <ManifestoSection @open-registration="openRegistration" />
      <ConfirmedAthletesSection @open-registration="openRegistration" />
    </main>

    <Footer @open-registration="openRegistration" />

    <RegistrationModal :is-open="isRegistrationOpen" @close="isRegistrationOpen = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

const isRegistrationOpen = ref(false)

function openRegistration() {
  isRegistrationOpen.value = true
}
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
