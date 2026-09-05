<template>
  <div class="app-wrapper">
    <Navbar />

    <main>
      <HeroSection @open-registration="openRegistration" />
      <HighlightRibbon />
      <StatsSection />
      <RouteSection />
      <KitSection />
      <StructureSection />
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
import StatsSection from './components/StatsSection.vue'
import RouteSection from './components/RouteSection.vue'
import KitSection from './components/KitSection.vue'
import StructureSection from './components/StructureSection.vue'
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
