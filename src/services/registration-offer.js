// Valores em centavos para exibicao. O backend revalida o total e os descontos.
export const REGISTRATION_PRICES = Object.freeze({ withBeer: 10000, withoutBeer: 9000 })
export const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
export const registrationPrice = beer => beer ? REGISTRATION_PRICES.withBeer : REGISTRATION_PRICES.withoutBeer
