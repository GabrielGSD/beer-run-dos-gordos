// Tabelas ReiMark: altura e largura da peça estendida, em centímetros.
export const SHIRT_MODELS = [
  {
    value: 'UNISEX', label: 'Masculina / unissex',
    sizes: [
      ['P', 70, 52], ['M', 71, 54], ['G', 72, 57], ['GG', 74, 60],
      ['EXG', 76, 62], ['EXGG', 80, 68], ['G1', 86, 72], ['G2', 90, 73], ['G3', 91, 78],
    ],
  },
  {
    value: 'BABYLOOK', label: 'Babylook',
    sizes: [
      ['P', 56, 43], ['M', 58, 45], ['G', 58, 47], ['GG', 60, 50],
      ['EXG', 63, 50], ['EXGG', 65, 52],
    ],
  },
]

export function shirtMeasurements(model, size) {
  return SHIRT_MODELS.find(item => item.value === model)?.sizes.find(item => item[0] === size)
}

export function formatShirtSelection(model, size) {
  if (!size) return 'Não informado'
  const label = SHIRT_MODELS.find(item => item.value === model)?.label || 'Modelo não informado'
  return `${label} • ${size}`
}
