import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRegistrationAthlete } from '../src/services/registration-access.js'

test('lista nao convocada bloqueia com mensagem de espera', async () => {
  await assert.rejects(resolveRegistrationAthlete('35999991234', async () => ({ action: 'WAITLIST_NOT_CALLED' })), /Aguarde a convocação/)
})
test('telefone ausente nao usa cadastro antigo do navegador para liberar', async () => {
  assert.equal(await resolveRegistrationAthlete('35999991234', async () => ({ action: 'NOT_FOUND' })), null)
})
test('convocado recebe dados basicos e pode continuar', async () => {
  const result = await resolveRegistrationAthlete('35999991234', async () => ({ action: 'CONTINUE', athlete: {
    name: 'Atleta Teste', nickname: '', modality: 'corrida', drinksBeer: false, couponEligible: false,
  } }))
  assert.equal(result.name, 'Atleta Teste')
  assert.equal(result.requiresDetails, true)
})
test('falha da API bloqueia e pedido existente continua consultavel', async () => {
  await assert.rejects(resolveRegistrationAthlete('35999991234', async () => { throw new Error('Indisponivel') }), /Indisponivel/)
  const summary = { status: 'PAID' }
  assert.deepEqual(await resolveRegistrationAthlete('35999991234', async () => ({ action: 'STATUS_AVAILABLE', summary })), {
    publicStatus: summary, phone: '35999991234',
  })
})
