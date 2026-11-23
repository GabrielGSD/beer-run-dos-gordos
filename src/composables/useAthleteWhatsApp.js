import { ref } from 'vue'

const storageKey = 'beer_run_athletes_whatsapp_group'
const defaultGroupUrl = 'https://chat.whatsapp.com/GzkErsdC6R71FxJuvGkIna'

function validGroupLink(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'chat.whatsapp.com' &&
      !url.username && !url.password && !url.port && /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname)
  } catch { return false }
}

function loadGroupLink() {
  try {
    const saved = localStorage.getItem(storageKey)
    if (validGroupLink(saved)) return saved
  } catch {}
  const configured = import.meta.env?.VITE_ATHLETES_WHATSAPP_GROUP_URL?.trim() || ''
  return validGroupLink(configured) ? configured : defaultGroupUrl
}

const athleteWhatsAppGroupUrl = ref(loadGroupLink())

export function useAthleteWhatsApp() {
  function saveAthleteWhatsAppGroup(value) {
    const url = value.trim()
    if (!validGroupLink(url)) {
      throw new Error('Cole um link de convite válido: https://chat.whatsapp.com/...')
    }
    try { localStorage.setItem(storageKey, url) }
    catch { throw new Error('Não foi possível salvar o link neste navegador. Verifique se o armazenamento está permitido.') }
    athleteWhatsAppGroupUrl.value = url
  }

  function getAthleteWhatsAppLink(athlete) {
    let phone = String(athlete.phone || '').replace(/\D/g, '')
    if (!phone || !athleteWhatsAppGroupUrl.value) return null
    if (phone.length === 10 || phone.length === 11) phone = '55' + phone

    const firstName = athlete.name?.trim().split(/\s+/)[0] || 'atleta'
    const greeting = athlete.modality === 'kids'
      ? `Olá, ${athlete.guardianName?.trim() || 'responsável'}! 🏃\nAqui é da organização da *Beer Run Kids*, entrando em contato sobre ${athlete.name || 'o(a) atleta'}.`
      : `Olá, ${firstName}! 🏃\nAqui é da organização da *Beer Run dos Gordos*!`
    const message = `${greeting}

Criamos um grupo no WhatsApp para reunir os atletas e compartilhar os horários, as orientações e os avisos do evento. 📣

Entre no grupo pelo link abaixo:
${athleteWhatsAppGroupUrl.value}

Esperamos você por lá! 💛`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  return { athleteWhatsAppGroupUrl, saveAthleteWhatsAppGroup, getAthleteWhatsAppLink }
}
