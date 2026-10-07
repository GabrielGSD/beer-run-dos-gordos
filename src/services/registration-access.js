import { getRegistrationEligibility } from './checkout.js'

export async function resolveRegistrationAthlete(phone, checkEligibility = getRegistrationEligibility) {
  const result = await checkEligibility(phone)
  if (result.action === 'RESUME_ORDER' && typeof result.orderId === 'string') return { orderId: result.orderId }
  if (result.action === 'STATUS_AVAILABLE' && result.summary) return { publicStatus: result.summary, phone }
  if (result.action === 'WAITLIST_NOT_CALLED') {
    if (result.waitlist?.status === 'waiting' && Number.isSafeInteger(result.waitlist.position) && result.waitlist.position > 0) {
      return { waitlist: { status: 'waiting', position: result.waitlist.position }, phone }
    }
    throw new Error('Sua inscrição pela lista de espera ainda não está liberada. Aguarde a convocação da organização.')
  }
  if (result.action === 'AMBIGUOUS') {
    throw new Error('Há mais de um cadastro ou pedido para este celular. Fale com a organização para identificar sua inscrição.')
  }
  if (result.action === 'RECOVERY_REQUIRED') {
    throw new Error('Este cadastro precisa de recuperação. Tente consultar pelo navegador usado na inscrição ou fale com a organização para recuperar o acesso.')
  }
  if (!['CONTINUE', 'NOT_FOUND'].includes(result.action)) throw new Error('Não foi possível verificar sua pré-inscrição. Tente novamente.')
  if (result.action === 'CONTINUE' && result.athlete) {
    const { name, nickname, modality, drinksBeer } = result.athlete
    return {
      phone, name: name || '', nickname: nickname || '', displayName: nickname || name || 'Atleta',
      modality: modality || 'corrida', drinksBeer: drinksBeer === true, requiresDetails: true,
      couponEligible: result.athlete.couponEligible === true,
    }
  }
  if (result.action === 'NOT_FOUND') return null
  // Somente dados fornecidos pelo proprio visitante. Nao recuperar dados privados
  // usando apenas um numero de telefone, nem tratar esta consulta como autenticacao.
  return {
    phone, name: '', displayName: 'Atleta', nickname: '',
    modality: 'corrida', drinksBeer: false, requiresDetails: true,
  }
}
