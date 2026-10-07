<template>
  <div class="waitlist-ticket-card">
    <div class="ticket-header font-condensed"><span class="ticket-tag">{{ title }}</span></div>
    <div class="ticket-body">
      <span class="ticket-position-label font-condensed">SUA POSIÇÃO NA FILA PRIORITÁRIA</span>
      <div class="ticket-number font-slab"><span class="ticket-number-prefix font-condensed">Nº</span>{{ position }}</div>
      <div v-if="displayName" class="ticket-athlete-name font-slab">{{ displayName }}</div>
    </div>
    <div class="ticket-footer font-condensed">
      <span class="ticket-status-pill"><i class="fa-solid fa-circle-check"></i> {{ statusLabel }}</span>
    </div>
  </div>
</template>
<script setup>
defineProps({
  position: { type: Number, required: true },
  displayName: { type: String, default: '' },
  title: { type: String, default: '★ PRÉ-INSCRIÇÃO RECEBIDA COM SUCESSO ★' },
  statusLabel: { type: String, default: 'CADASTRO REGISTRADO NA COMISSÃO' },
})
</script>
<style scoped>
.waitlist-ticket-card { width: 100%; background-color: #fffaf0; border: 2px dashed #1c1b18; border-radius: 8px; padding: 16px 14px; margin: 6px 0 16px; text-align: center; position: relative; box-sizing: border-box; box-shadow: 2px 2px 0 rgb(0 0 0 / 8%); }
.ticket-header { margin-bottom: 8px; }
.ticket-tag { display: inline-block; background-color: #1c1b18; color: #d8812a; font-size: .86rem; font-weight: 900; padding: 4px 14px; border-radius: 14px; letter-spacing: .8px; }
.ticket-body { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.ticket-position-label { font-size: .95rem; font-weight: 800; color: #3b362f; letter-spacing: .8px; text-transform: uppercase; margin-top: 4px; }
.ticket-number { font-size: 3.6rem; font-weight: 900; color: #d8812a; line-height: 1; text-shadow: 2px 2px 0 #1c1b18; margin: 4px 0 6px; display: flex; align-items: baseline; justify-content: center; gap: 4px; }
.ticket-number-prefix { font-size: 1.6rem; font-weight: 900; color: #1c1b18; text-shadow: none; }
.ticket-athlete-name { font-size: 1.3rem; font-weight: 900; color: #1c1b18; line-height: 1.25; word-break: break-word; }
.ticket-footer { margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgb(28 27 24 / 20%); display: flex; justify-content: center; }
.ticket-status-pill { display: inline-flex; align-items: center; gap: 6px; background-color: rgb(216 129 42 / 15%); color: #8c4202; border: 1px solid rgb(216 129 42 / 40%); font-size: .88rem; font-weight: 800; padding: 5px 14px; border-radius: 14px; }
@media (max-width: 480px) {
  .ticket-tag { font-size: .8rem; }
  .ticket-position-label { font-size: .88rem; }
  .ticket-number { font-size: 3rem; }
  .ticket-number-prefix { font-size: 1.35rem; }
  .ticket-athlete-name { font-size: 1.18rem; }
  .ticket-status-pill { font-size: .82rem; }
}
</style>
