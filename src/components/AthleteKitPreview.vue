<template>
  <details class="kit-preview font-condensed">
    <summary>Veja o kit do atleta</summary>
    <div class="kit-preview-images">
      <figure v-for="item in items" :key="item.src">
        <img :src="item.src" :alt="item.alt" width="240" height="240" loading="lazy" />
        <figcaption>{{ item.label }}</figcaption>
      </figure>
    </div>
  </details>
</template>

<script setup>
const items = [
  { src: '/images/kit/camiseta.png', alt: 'Camiseta preta da Beer Run dos Gordos com logo branco no peito', label: 'Camiseta do evento' },
  { src: '/images/kit/medalha.png?v=2026-10-15', alt: 'Medalha de conclusão Beer Run dos Gordos', label: 'Medalha de conclusão' },
  { src: '/images/kit/copo.png', alt: 'Copo oficial Beer Run dos Gordos', label: 'Copo oficial' },
]
</script>

<style scoped>
.kit-preview {
  min-width: 0;
  margin-top: 20px;
  border: 1px solid #dfcba5;
  border-radius: 8px;
  background: #fffdf9;
  color: #4a3e2e;
  font-size: 0.9rem;
}
.kit-preview summary {
  padding: 12px;
  cursor: pointer;
  color: #6d3a00;
  font-weight: 700;
}
.kit-preview summary:hover { background: #f7f1e6; }
.kit-preview summary:focus-visible {
  outline: 2px solid #8c5310;
  outline-offset: 2px;
  border-radius: 6px;
}
.kit-preview-images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 12px 12px 18px;
}
figure { min-width: 0; margin: 0; text-align: center; }
img { display: block; width: 100%; height: 160px; object-fit: contain; }
figcaption { margin-top: 12px; font-weight: 700; line-height: 1.35; }
@media (max-width: 600px) {
  .kit-preview-images { gap: 10px; }
  img { height: 100px; }
  figcaption { font-size: .82rem; }
}
</style>
