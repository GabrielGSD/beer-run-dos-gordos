import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const LOCAL_STORAGE_KEY = 'beer_run_sponsorship_proposals'
const WHATSAPP_ORGANIZATION_NUMBER = '5535997500430'

export function useSponsorshipProposal() {
  const isSubmitting = ref(false)
  const error = ref(null)

  // Tradução amigável dos tipos de patrocínio
  function formatSponsorshipType(type) {
    const map = {
      money: '💵 Apoio Financeiro (R$)',
      gifts: '🎁 Brindes / Produtos para o Kit',
      structure: '🎪 Estrutura / Serviços',
      mixed: '🤝 Misto (R$ + Produtos/Brindes)'
    }
    return map[type] || type
  }

  // Gera link do WhatsApp com mensagem formatada
  function generateWhatsAppMessageUrl(proposal) {
    let msg = `🍻 *NOVA PROPOSTA DE PATROCÍNIO - BEER RUN DOS GORDOS* 🏃‍♂️💨\n\n`
    msg += `🏢 *Empresa / Marca:* ${proposal.companyName}\n`
    msg += `👤 *Contato / Responsável:* ${proposal.contactName}\n`
    msg += `📱 *WhatsApp:* ${proposal.phone}\n`
    
    if (proposal.websiteInstagram) {
      msg += `🌐 *Site / Instagram:* ${proposal.websiteInstagram}\n`
    }
    
    msg += `\n📌 *Formato de Apoio:* ${formatSponsorshipType(proposal.sponsorshipType)}\n`

    if (proposal.amount && (proposal.sponsorshipType === 'money' || proposal.sponsorshipType === 'mixed')) {
      msg += `💰 *Valor Pretendido:* ${proposal.amount}\n`
    }

    if (proposal.itemsDescription && (proposal.sponsorshipType === 'gifts' || proposal.sponsorshipType === 'structure' || proposal.sponsorshipType === 'mixed')) {
      msg += `🎁 *Descrição dos Itens / Serviços:* ${proposal.itemsDescription}\n`
    }

    if (proposal.activations && proposal.activations.length > 0) {
      msg += `\n🎪 *Interesse em Ativações:*\n`
      proposal.activations.forEach(act => {
        msg += `  • ${act}\n`
      })
    }

    if (proposal.notes) {
      msg += `\n📝 *Observações / Ideias:* ${proposal.notes}\n`
    }

    msg += `\n_Proposta enviada pelo site oficial da Beer Run dos Gordos!_`

    const encoded = encodeURIComponent(msg)
    return `https://wa.me/${WHATSAPP_ORGANIZATION_NUMBER}?text=${encoded}`
  }

  // Upload opcional do arquivo de logo para o Supabase Storage
  async function uploadLogoFile(file, companyName) {
    if (!file || !isSupabaseConfigured || !supabase) return null

    try {
      const sanitizedCompany = (companyName || 'patrocinador')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
      
      const fileExt = file.name ? file.name.split('.').pop() : 'png'
      const uniqueId = Math.random().toString(36).substring(2, 8)
      const filePath = `logos/${Date.now()}_${sanitizedCompany}_${uniqueId}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png'
        })

      if (uploadError) {
        console.warn('Aviso no upload do logo (verifique se o bucket sponsor-logos existe e é público):', uploadError.message)
        return null
      }

      // Obtém URL pública
      const { data: publicUrlData } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(filePath)

      return publicUrlData?.publicUrl || null
    } catch (err) {
      console.warn('Erro ao processar upload do logo:', err)
      return null
    }
  }

  // Salvar a proposta no Supabase e/ou LocalStorage
  async function submitProposal(proposalData) {
    isSubmitting.value = true
    error.value = null

    try {
      let finalLogoUrl = null

      // Tenta upload no Storage se for arquivo binário
      if (proposalData.logoFile && isSupabaseConfigured) {
        const uploadedUrl = await uploadLogoFile(proposalData.logoFile, proposalData.companyName)
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl
        }
      }

      const proposalRecord = {
        company_name: proposalData.companyName?.trim(),
        contact_name: proposalData.contactName?.trim(),
        phone: proposalData.phone?.trim(),
        website_instagram: proposalData.websiteInstagram?.trim() || null,
        sponsorship_type: proposalData.sponsorshipType,
        amount: proposalData.amount?.trim() || null,
        items_description: proposalData.itemsDescription?.trim() || null,
        activations: proposalData.activations || [],
        notes: proposalData.notes?.trim() || null,
        logo_url: finalLogoUrl,
        created_at: new Date().toISOString()
      }

      // 1. Grava no Supabase se configurado
      if (isSupabaseConfigured && supabase) {
        const { data, error: sbError } = await supabase
          .from('sponsorship_proposals')
          .insert([proposalRecord])
          .select()
          .single()

        if (sbError) {
          console.error('Erro ao salvar proposta no Supabase:', sbError)
          throw new Error(`Erro ao salvar no banco: ${sbError.message || 'Verifique as permissões de RLS no Supabase.'}`)
        }
      }

      // 2. Fallback de segurança no localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
        saved.unshift({
          id: Date.now(),
          ...proposalRecord
        })
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saved))
      } catch (storageErr) {
        console.warn('Aviso ao salvar proposta no localStorage:', storageErr)
      }

      return {
        success: true,
        whatsAppUrl: generateWhatsAppMessageUrl(proposalData)
      }
    } catch (err) {
      console.error('Erro ao submeter proposta de patrocínio:', err)
      error.value = err.message || 'Erro ao processar a proposta de patrocínio.'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    submitProposal,
    generateWhatsAppMessageUrl,
    formatSponsorshipType
  }
}
