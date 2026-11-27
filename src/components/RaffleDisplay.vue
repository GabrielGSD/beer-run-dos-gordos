<template>
  <div ref="board" class="raffle-board font-condensed" :class="{ 'is-drawing': drawing, 'has-winner': winner && !drawing, 'is-fullscreen': fullscreen }">
    <div v-if="confetti.length" class="raffle-confetti" aria-hidden="true">
      <span v-for="piece in confetti" :key="piece.id" class="raffle-confetti-piece" :style="piece.style"></span>
    </div>
    <div class="raffle-board-heading">
      <button v-if="fullscreen" type="button" class="raffle-exit" autofocus @click="$emit('close')"><X :size="20" aria-hidden="true" />Sair da tela cheia</button>
      <img class="raffle-logo" src="/logo.png" alt="Beer Run dos Gordos" width="1680" height="944" />
    </div>
    <div class="raffle-result">
      <template v-if="drawing">
        <p>Segura a torcida…</p>
        <div class="raffle-name-slot" aria-hidden="true"><strong class="font-slab">{{ preview?.displayName || preview?.name || 'Preparando resultado…' }}</strong><span>{{ preview?.source || 'Já vamos revelar o nome' }}</span></div>
      </template>
      <template v-else-if="winner"><Trophy class="raffle-result-icon" :size="36" aria-hidden="true" /><p>O BRINDE É SEU!</p><strong class="font-slab">{{ winner.displayName || winner.name }}</strong><span>Parabéns, {{ winner.name.trim().split(/\s+/)[0] }}!</span></template>
      <template v-else><Gift class="raffle-result-icon" :size="36" aria-hidden="true" /><p>{{ loading ? 'CARREGANDO PARTICIPANTES' : 'TÁ TODO MUNDO NA TORCIDA?' }}</p><strong class="font-slab">Quem vai ser<br />o próximo?</strong><span>O próximo nome pode ser o seu.</span></template>
    </div>
    <p class="raffle-announcement" role="status" aria-live="polite" aria-atomic="true">{{ drawing ? 'Sorteio em andamento. Aguarde o resultado.' : winner ? `Ganhador: ${winner.displayName || winner.name}. ${winner.source}.` : '' }}</p>
    <div class="raffle-board-footer">
      <span>{{ drawing ? 'Escolhendo o próximo ganhador…' : audienceLabel }}</span>
      <button v-if="fullscreen && !drawing" type="button" class="btn-vintage raffle-next font-slab" :disabled="!canDraw" @click="$emit('draw')"><Gift :size="20" aria-hidden="true" />{{ canDraw ? 'Sortear próximo' : 'Todos já foram sorteados' }}</button>
      <span v-else aria-hidden="true">★ ★ ★</span>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { Gift, Trophy, X } from 'lucide-vue-next'
const props = defineProps({
  drawing: Boolean,
  winner: Object,
  preview: Object,
  loading: Boolean,
  audienceLabel: { type: String, default: 'Atletas + staff + convidados' },
  fullscreen: Boolean,
  canDraw: Boolean,
})
defineEmits(['close', 'draw'])

const board = ref(null)
const confetti = ref([])
let celebrationTimer
function clearConfetti() {
  clearTimeout(celebrationTimer)
  confetti.value = []
}
function celebrate() {
  clearConfetti()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['var(--accent-gold)', 'var(--accent-amber)', 'var(--accent-green)', '#b65032', '#edbe4c']
  const drop = Math.max(board.value?.clientHeight || 0, window.innerHeight) + 80
  const count = props.fullscreen ? 100 : 65
  // Decorative randomness is independent of the actual winner selection.
  confetti.value = Array.from({ length: count }, (_, id) => ({
    id,
    style: {
      left: `${Math.random() * 100}%`,
      backgroundColor: colors[id % colors.length],
      width: `${6 + Math.random() * 6}px`,
      height: `${10 + Math.random() * 10}px`,
      borderRadius: id % 3 === 0 ? '50%' : '1px',
      '--confetti-drop': `${drop}px`,
      '--confetti-drift': `${(Math.random() - 0.5) * 260}px`,
      '--confetti-rotation': `${360 + Math.random() * 900}deg`,
      animationDuration: `${6 + Math.random() * 3}s`,
      animationDelay: `${id / (count - 1) * 3.5}s`,
    },
  }))
  celebrationTimer = window.setTimeout(clearConfetti, 13000)
}
// Only celebrate a newly revealed result, never a restored historical winner.
watch(() => props.drawing, (drawing, wasDrawing) => {
  if (drawing) clearConfetti()
  else if (wasDrawing && props.winner) celebrate()
})
onUnmounted(clearConfetti)
</script>

<style scoped>
.raffle-board { position: relative; isolation: isolate; padding: 28px 28px 18px; background-color: var(--text-light); background-image: radial-gradient(ellipse at 50% 35%, rgb(255 255 255 / 88%), rgb(245 238 220 / 90%) 80%), url('/bg02.jpg'); background-size: cover; color: var(--text-dark); border-radius: 2px 2px 0 0; text-align: center; }
.raffle-board-heading { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.raffle-logo { display: block; width: clamp(200px, 40%, 280px); max-width: 100%; height: auto; filter: drop-shadow(0 6px 3px rgb(44 39 31 / 12%)); }
.raffle-board-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.raffle-result { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 28px 0; overflow-wrap: anywhere; }
.raffle-result-icon { color: var(--accent-gold); flex-shrink: 0; }
.raffle-result p { margin: 0; font-size: .875rem; font-weight: 700; letter-spacing: .12em; line-height: 1.4; color: var(--text-muted); }
.raffle-result strong { display: block; width: 100%; max-width: 25ch; margin-inline: auto; font-size: clamp(1.8rem, 3.2vw, 3rem); font-weight: 700; line-height: 1.18; letter-spacing: -.025em; text-wrap: balance; }
.raffle-result span { font-size: 1.125rem; line-height: 1.5; color: var(--text-muted); }
.raffle-name-slot { display: flex; flex-direction: column; justify-content: center; gap: 16px; width: 100%; min-height: 150px; }
.raffle-board.has-winner .raffle-result strong { color: var(--accent-green); }
.raffle-board-footer { padding-top: 16px; border-top: 1px solid rgb(44 39 31 / 20%); color: var(--text-muted); font-size: .875rem; }
.raffle-board-footer > span:last-child { color: var(--accent-gold); white-space: nowrap; letter-spacing: .2em; }
.raffle-announcement { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.raffle-exit { position: absolute; top: 0; right: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; min-height: 44px; border: 1px solid var(--accent-border); border-radius: 4px; background: var(--text-light); color: var(--text-dark); font: inherit; cursor: pointer; }
.raffle-exit:hover { background: var(--bg-parchment-light); }
button:focus-visible { outline: 3px solid var(--accent-gold); outline-offset: 4px; }
.raffle-board.is-fullscreen { min-height: 100%; display: grid; grid-template-rows: minmax(min-content, 1fr) auto minmax(min-content, 1fr); border-radius: 0; padding: clamp(16px, 3vw, 48px); padding-top: max(16px, 3vw, env(safe-area-inset-top)); padding-bottom: max(16px, 3vw, env(safe-area-inset-bottom)); }
.is-fullscreen .raffle-board-heading { align-self: start; }
.is-fullscreen .raffle-board-footer { align-self: end; }
.is-fullscreen .raffle-logo { width: clamp(220px, 24vw, 340px); flex-shrink: 0; }
.is-fullscreen .raffle-result { min-height: 0; gap: clamp(14px, 2.2vh, 24px); padding: 24px 0; }
.is-fullscreen .raffle-result strong { font-size: clamp(2rem, min(4.8vw, 8vh), 5.5rem); }
.is-fullscreen .raffle-result > strong { margin-inline: auto; }
.is-fullscreen .raffle-name-slot { align-items: center; min-height: 0; }
.is-fullscreen .raffle-result p { font-size: clamp(.875rem, 1.2vw, 1.125rem); }
.is-fullscreen .raffle-result span { font-size: clamp(1.125rem, 1.5vw, 1.5rem); }
.raffle-next { font-size: 1rem; padding: 12px 20px; margin: 0 4px 4px 0; }
.raffle-next svg { flex-shrink: 0; }
.raffle-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
.raffle-confetti-piece { position: absolute; top: -24px; opacity: 0; animation-name: raffle-confetti-fall; animation-timing-function: linear; animation-fill-mode: both; }
.raffle-exit, .raffle-next { z-index: 3; }
.raffle-next { position: relative; }
@keyframes raffle-confetti-fall {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(0); }
  8% { opacity: .9; }
  85% { opacity: .9; }
  100% { opacity: 0; transform: translate3d(var(--confetti-drift), var(--confetti-drop), 0) rotate(var(--confetti-rotation)) rotateX(540deg); }
}
@media (max-width: 850px) { .raffle-board { padding: 20px 16px 16px; } }
@media (max-width: 600px) {
  .is-fullscreen .raffle-board-heading { padding-top: 56px; gap: 12px; }
  .is-fullscreen .raffle-logo { width: clamp(160px, 48vw, 220px); }
  .is-fullscreen .raffle-board-footer { flex-direction: column; gap: 12px; }
  .raffle-next { width: calc(100% - 4px); }
  .raffle-exit { font-size: .875rem; }
}
@media (max-width: 380px) {
  .raffle-board-footer { flex-wrap: wrap; justify-content: center; gap: 8px; }
}
@media (max-height: 560px) and (min-width: 601px) {
  .raffle-board.is-fullscreen { padding: 12px 20px; }
  .is-fullscreen .raffle-logo { width: 150px; }
  .is-fullscreen .raffle-board-heading { gap: 6px; }
  .is-fullscreen .raffle-result { gap: 8px; padding: 12px 0; }
  .is-fullscreen .raffle-result-icon { width: 28px; height: 28px; }
  .is-fullscreen .raffle-board-footer { padding-top: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .btn-vintage { transition: none; }
  .raffle-confetti { display: none; }
}
</style>
