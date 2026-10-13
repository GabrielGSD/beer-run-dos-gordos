const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export async function publicRequest(path, body) {
  if (!API_URL) throw new Error('Serviço indisponível. Tente novamente mais tarde.')
  const response = await fetch(API_URL + '/api/' + path, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'omit',
    signal: AbortSignal.timeout(15000), cache: 'no-store',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Não foi possível concluir. Tente novamente.')
  return data
}
