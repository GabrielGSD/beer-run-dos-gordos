<template>
  <aside v-if="!canRegister(category)" class="availability-notice" aria-live="polite">
    <template v-if="availabilityError">
      <p>{{ availabilityError }}</p>
      <button type="button" class="flow-text-button" :disabled="availabilityLoading" @click="refreshAvailability()">{{ availabilityLoading ? 'Consultando…' : 'Tentar novamente' }}</button>
    </template>
    <p v-else-if="!availability">Consultando vagas disponíveis…</p>
    <template v-else>
      <strong>Vagas esgotadas{{ availability.soldOut ? ' — Adulto e Kids' : category === 'adult' ? ' — Adulto' : ' — Kids' }}</strong>
      <p>{{ availability.soldOut ? `Atingimos o limite de ${availability.capacity} atletas confirmados, somando Adulto e Kids.` : 'Todas as vagas desta categoria estão ocupadas no momento.' }}</p>
      <a :href="category === 'adult' ? '#inscricao?consulta=1' : '#inscricao?categoria=kids&consulta=1'">Já me inscrevi — consultar ou pagar</a>
      <p v-if="hasPendingRegistration(category === 'adult' ? 'ADULT' : 'KIDS')">Há uma tentativa anterior neste navegador. Você pode reenviar os mesmos dados para recuperar o pedido.
        <a :href="category === 'adult' ? '#inscricao?categoria=adulto' : '#inscricao?categoria=kids'">Retomar tentativa anterior</a>
      </p>
      <a v-if="canRegister(category === 'adult' ? 'kids' : 'adult')" :href="category === 'adult' ? '#inscricao?categoria=kids' : '#inscricao?categoria=adulto'">{{ category === 'adult' ? 'Ainda há vagas Kids — inscrever criança' : 'Ver inscrições Adulto' }}</a>
    </template>
  </aside>
</template>

<script setup>
import { useRegistrationAvailability } from '../composables/useRegistrationAvailability.js'
import { hasPendingRegistration } from '../services/checkout.js'
defineProps({ category: { type: String, required: true } })
const { availability, availabilityError, availabilityLoading, canRegister, refreshAvailability } = useRegistrationAvailability()
</script>

<style scoped>
.availability-notice { padding: 20px; margin: 16px 0; border: 1px solid var(--accent-gold, #b69549); border-radius: 12px; background: #fff8e8; color: #382a17; }
.availability-notice p { margin: 8px 0; }
.availability-notice a { display: block; margin-top: 12px; color: inherit; text-decoration: underline; }
</style>
