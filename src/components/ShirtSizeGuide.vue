<template>
  <details class="shirt-guide font-condensed">
    <summary>Em dúvida? Consulte o guia de medidas</summary>
    <div class="shirt-guide-content">
      <div class="measurement-help">
        <svg class="shirt-diagram" viewBox="0 0 220 200" role="img" aria-label="Altura do ombro até a barra e largura de uma lateral à outra na barra da camiseta.">
          <path d="M75 20 40 36 15 78 48 95 60 75 60 170 160 170 160 75 172 95 205 78 180 36 145 20 Q110 48 75 20Z" fill="#f7f1e6" stroke="#4a3e2e" stroke-width="2" />
          <path d="M142 27V164M138 33l4-6 4 6M138 158l4 6 4-6M64 182H156M70 178l-6 4 6 4M150 178l6 4-6 4" fill="none" stroke="#8c5310" stroke-width="2" />
          <text x="136" y="110" text-anchor="end" fill="#6d3a00" font-size="14">Altura</text>
          <text x="110" y="198" text-anchor="middle" fill="#6d3a00" font-size="14">Largura</text>
        </svg>
        <div>
          <h3>Compare com uma camiseta que você já usa</h3>
          <p>Estenda a peça em uma superfície plana, sem esticar o tecido.</p>
          <p><strong>Altura:</strong> meça do ombro até a barra.</p>
          <p><strong>Largura:</strong> meça de uma lateral à outra na barra, como no desenho. Não é a circunferência do corpo.</p>
        </div>
      </div>

      <div class="measurement-tables">
        <table v-for="chart in charts" :key="chart.value">
          <caption>{{ chart.label }}</caption>
          <thead>
            <tr>
              <th scope="col">Tamanho</th>
              <th scope="col">Altura (cm)</th>
              <th scope="col">Largura (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[rowSize, height, width] in chart.sizes" :key="rowSize" :class="{ selected: chart.value === model && rowSize === size }" :aria-current="chart.value === model && rowSize === size ? 'true' : undefined">
              <th scope="row">{{ rowSize }}<span v-if="chart.value === model && rowSize === size" aria-label="Selecionado"> ✓</span></th>
              <td>{{ height }}</td>
              <td>{{ width }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="measurement-note"><strong>Atenção:</strong> segundo o fornecedor, as medidas podem variar de 0,5 a 1 cm após a produção.</p>
      <p class="measurement-source">Fonte: tabelas de medidas ReiMark Camisetas.</p>
    </div>
  </details>
</template>

<script setup>
import { SHIRT_MODELS as charts } from '../services/shirts.js'
defineProps({ model: { type: String, default: '' }, size: { type: String, default: '' } })
</script>

<style scoped>
.shirt-guide {
  min-width: 0;
  border: 1px solid #dfcba5;
  border-radius: 8px;
  background: #fffdf9;
  color: #4a3e2e;
  font-size: 0.9rem;
}

.shirt-guide summary {
  padding: 12px;
  cursor: pointer;
  color: #6d3a00;
  font-weight: 700;
}

.shirt-guide summary:hover {
  background: #f7f1e6;
}

.shirt-guide summary:focus-visible {
  outline: 2px solid #8c5310;
  outline-offset: 2px;
  border-radius: 6px;
}

.shirt-guide-content {
  padding: 0 12px 14px;
}

.measurement-help {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 8px 0 16px;
}

.shirt-diagram {
  width: 140px;
  flex-shrink: 0;
}

.measurement-help h3 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.measurement-help p + p {
  margin-top: 6px;
}

.measurement-tables {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

caption {
  text-align: left;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 8px;
}

th, td {
  padding: 8px 4px;
  border-bottom: 1px solid #e2d6c1;
}

thead {
  background: #f7f1e6;
}

tbody tr:nth-child(even) {
  background: #fdfaf4;
}

tbody tr.selected {
  background: #fff3db;
  color: #6d3a00;
  font-weight: 700;
  outline: 2px solid #8c5310;
  outline-offset: -2px;
}

.measurement-note {
  margin-top: 16px;
  padding: 10px;
  background: #fff3db;
  border-left: 3px solid #8c5310;
}

.measurement-source {
  margin-top: 10px;
  font-size: 0.8rem;
}

@media (max-width: 600px) {
  .measurement-tables {
    grid-template-columns: 1fr;
  }

  .measurement-help {
    flex-direction: column;
    align-items: flex-start;
  }

  .shirt-diagram {
    align-self: center;
  }
}
</style>
