<template>
  <div class="registration-flow">
    <header class="flow-top-bar">
      <div class="container flow-top-content">
        <button class="flow-back-home font-condensed" @click="$emit('go-home')"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>VOLTAR AO SITE</span></button>
        <div class="flow-brand font-condensed"><i class="fa-solid fa-beer-mug-empty" aria-hidden="true"></i><span>BEER RUN DOS GORDOS • 1ª EDIÇÃO 2026</span></div>
      </div>
    </header>
    <main class="flow-content">
      <section v-if="!category" class="flow-card category-selection" aria-labelledby="category-title">
        <div class="flow-step-header">
          <h1 id="category-title" class="section-title font-slab" tabindex="-1">PARA QUEM É A INSCRIÇÃO?</h1>
          <p class="flow-subtitle">Escolha a categoria para preencher sua inscrição.</p>
        </div>
        <div class="category-options">
          <button class="category-option" data-category="adulto" @click="choose('adulto')">
            <span class="category-heading"><i class="fa-solid fa-person-running" aria-hidden="true"></i><span class="font-slab">ADULTO</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
            <span class="category-description">Corrida ou caminhada · 6,37 km</span>
          </button>
          <button class="category-option" data-category="kids" @click="choose('kids')">
            <span class="category-heading"><i class="fa-solid fa-child-reaching" aria-hidden="true"></i><span class="font-slab">KIDS</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
            <span class="category-description">De 1 a 13 anos · 30 vagas</span>
          </button>
        </div>
        <div class="category-consultation"><strong>JÁ SE INSCREVEU?</strong><a href="#inscricao?consulta=1">Consultar inscrição Adulto</a><a href="#inscricao?categoria=kids&consulta=1">Consultar inscrição Kids</a></div>
      </section>
      <div v-else class="flow-category-bar font-condensed">
        <span><i :class="category === 'kids' ? 'fa-solid fa-child-reaching' : 'fa-solid fa-person-running'" aria-hidden="true"></i> INSCRIÇÃO <strong>{{ category === 'kids' ? 'KIDS' : 'ADULTO' }}</strong></span>
        <button class="flow-text-button" :disabled="navigationLocked" @click="choose('')">Alterar categoria</button>
      </div>
      <KeepAlive>
        <component v-if="category" :key="category" :is="category === 'kids' ? KidsRegistrationPage : OfficialRegistrationPage"
          v-bind="category === 'kids' ? { consultationOnly: consultation } : { embedded: true }"
          @navigation-lock="navigationLocked = $event" @go-home="$emit('go-home')" />
      </KeepAlive>
    </main>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
const OfficialRegistrationPage = defineAsyncComponent(() => import('./OfficialRegistrationPage.vue'))
const KidsRegistrationPage = defineAsyncComponent(() => import('./KidsRegistrationPage.vue'))
defineEmits(['go-home'])
const category = ref(''), consultation = ref(false), navigationLocked = ref(false)
function readRoute() {
  const hash = window.location.hash
  const params = new URLSearchParams(hash.split('?')[1] || '')
  consultation.value = params.get('consulta') === '1'
  const choice = params.get('categoria')
  category.value = hash === '#kids' || choice === 'kids' ? 'kids'
    : choice === 'adulto' || consultation.value || params.has('tel') || params.has('phone') ? 'adulto' : ''
  navigationLocked.value = false
}
async function choose(value) {
  if (navigationLocked.value) return
  window.location.hash = value ? `#inscricao?categoria=${value}` : '#inscricao'
  category.value = value
  consultation.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await nextTick()
  if (!value) document.getElementById('category-title')?.focus({ preventScroll: true })
}
readRoute()
onMounted(() => window.addEventListener('hashchange', readRoute))
onUnmounted(() => window.removeEventListener('hashchange', readRoute))
</script>

<style src="../styles/registration-flow.css"></style>
